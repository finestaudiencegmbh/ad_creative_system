import DashboardLayout from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { AnimatedBackground } from "@/components/AnimatedBackground";
import { GeneratedCreatives } from "@/components/GeneratedCreatives";
import { Loader2, Sparkles, Download, ChevronDown, Check, ImageIcon } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { useState, useEffect } from "react";
import { startOfMonth, endOfMonth, format as formatDate } from "date-fns";
import { toast } from "sonner";
import { getRandomFunFact } from "@/lib/funFacts";

type CreativeFormat = "feed" | "story" | "reel";

interface GeneratedCreative {
  imageUrl: string;
  headline?: string;
  eyebrowText?: string;
  ctaText?: string;
  format: CreativeFormat;
  texts?: {
    preHeadline: string;
    headline: string;
    subHeadline?: string;
    cta: string;
  };
}

const formatSpecs: Record<CreativeFormat, { label: string; ratio: string }> = {
  feed: { label: "Feed", ratio: "1:1" },
  story: { label: "Story", ratio: "9:16" },
  reel: { label: "Reel", ratio: "9:16" },
};

export default function CreativeGenerator() {
  // Wizard state
  const [currentStep, setCurrentStep] = useState(1);
  const [selectedCampaignId, setSelectedCampaignId] = useState("");
  const [selectedCreativeId, setSelectedCreativeId] = useState<number | null>(null);
  const [selectedFormats, setSelectedFormats] = useState<CreativeFormat[]>([]);
  const [creativeCount, setCreativeCount] = useState<number>(1);
  
  // Generation state
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedCreatives, setGeneratedCreatives] = useState<GeneratedCreative[]>([]);
  const [currentFunFact, setCurrentFunFact] = useState(getRandomFunFact());
  const [usedFacts, setUsedFacts] = useState<Set<string>>(new Set());
  const [progress, setProgress] = useState(0);

  // Rotate fun facts every 8 seconds during generation
  useEffect(() => {
    if (!isGenerating) return;
    
    const interval = setInterval(() => {
      let newFact = getRandomFunFact();
      let attempts = 0;
      while (usedFacts.has(newFact) && attempts < 10) {
        newFact = getRandomFunFact();
        attempts++;
      }
      
      if (usedFacts.size >= 65) {
        setUsedFacts(new Set([newFact]));
      } else {
        setUsedFacts(prev => new Set([...Array.from(prev), newFact]));
      }
      
      setCurrentFunFact(newFact);
    }, 8000);
    
    return () => clearInterval(interval);
  }, [isGenerating, usedFacts]);

  // Progress bar animation
  useEffect(() => {
    if (!isGenerating) {
      setProgress(0);
      return;
    }
    
    const startTime = Date.now();
    const duration = 60000;
    
    const interval = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const newProgress = Math.min(100, (elapsed / duration) * 100);
      setProgress(newProgress);
      
      if (newProgress >= 100) {
        clearInterval(interval);
      }
    }, 100);
    
    return () => clearInterval(interval);
  }, [isGenerating]);

  // Fetch campaigns
  const now = new Date();
  const startDate = startOfMonth(now);
  const endDate = endOfMonth(now);
  
  const { data: campaignsData, isLoading: campaignsLoading } = trpc.campaigns.list.useQuery({
    timeRange: {
      since: formatDate(startDate, 'yyyy-MM-dd'),
      until: formatDate(endDate, 'yyyy-MM-dd'),
    },
  });

  const activeCampaigns = campaignsData?.filter((c: any) => c.status === 'ACTIVE') || [];

  // Fetch winning creatives
  const { data: winningCreativesData, isLoading: winningCreativesLoading } = trpc.ai.getWinningCreatives.useQuery(
    { campaignId: selectedCampaignId },
    { enabled: !!selectedCampaignId }
  );

  const winningCreatives = winningCreativesData?.winners || [];

  // Toggle format selection
  const toggleFormat = (formatId: CreativeFormat) => {
    setSelectedFormats((prev) => 
      prev.includes(formatId) 
        ? prev.filter((f) => f !== formatId) 
        : [...prev, formatId]
    );
  };

  // Check if step can proceed
  const canProceed = () => {
    if (currentStep === 1) return selectedCampaignId && selectedCreativeId !== null;
    if (currentStep === 2) return selectedFormats.length > 0;
    if (currentStep === 3) return creativeCount > 0;
    return true;
  };

  // Handle generation
  const triggerCreativeGeneration = trpc.ai.triggerCreativeGeneration.useMutation();
  const [currentJobId, setCurrentJobId] = useState<string | null>(null);

  const handleGenerate = async () => {
    if (!selectedCampaignId || selectedFormats.length === 0 || creativeCount === 0) {
      toast.error("Bitte alle Schritte abschließen");
      return;
    }

    setIsGenerating(true);
    setProgress(0);

    try {
      // Generate for first format (webhook handles all formats)
      const result = await triggerCreativeGeneration.mutateAsync({
        campaignId: selectedCampaignId,
        landingPageUrl: '',
        format: selectedFormats[0],
        count: creativeCount,
      });

      if (result.jobId) {
        setCurrentJobId(result.jobId);
        pollJobStatus(result.jobId);
      }
    } catch (error: any) {
      console.error("Generation error:", error);
      toast.error(error.message || "Fehler bei der Generierung");
      setIsGenerating(false);
    }
  };

  const getJobStatus = trpc.ai.getJobStatus.useQuery(
    { jobId: currentJobId! },
    {
      enabled: !!currentJobId && isGenerating,
      refetchInterval: 3000,
    }
  );

  const pollJobStatus = (jobId: string) => {
    const checkStatus = async () => {
      try {
        const status = await getJobStatus.refetch();
        
        if (status.data?.status === 'completed' && status.data.result?.creatives) {
          const creatives = status.data.result.creatives.map((c: any) => ({
            imageUrl: c.url,
            format: c.format as CreativeFormat,
            headline: c.headline,
            eyebrowText: c.eyebrow,
            ctaText: c.cta,
          }));
          setGeneratedCreatives(creatives);
          toast.success(`${creatives.length} Creatives erfolgreich generiert!`);
          setIsGenerating(false);
          setCurrentJobId(null);
        } else if (status.data?.status === 'failed') {
          toast.error("Generierung fehlgeschlagen");
          setIsGenerating(false);
          setCurrentJobId(null);
        }
      } catch (error) {
        console.error("Polling error:", error);
      }
    };

    checkStatus();
  };

  return (
    <DashboardLayout>
      <AnimatedBackground />
      
      <div className="relative z-10 space-y-6 max-w-7xl mx-auto">
        {/* Header */}
        <div>
          <h1 className="text-4xl font-bold tracking-tight mb-2">Creative Generator</h1>
          <p className="text-lg text-muted-foreground">
            KI-gestützte Creative-Generierung mit Style-Aware Prompts und Text-Overlays
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-[1fr_350px] gap-6">
          {/* Main Form - Left Side */}
          <div className="space-y-6">
            {/* Progress Indicator */}
            <div className="flex items-center justify-between">
              {[1, 2, 3].map((step) => (
                <div key={step} className="flex items-center flex-1">
                  <div
                    className={`flex h-10 w-10 items-center justify-center rounded-full font-semibold transition-all duration-300 ${
                      step === currentStep
                        ? "bg-gradient-to-br from-[#5f2faf] to-[#8b5cf6] text-white shadow-lg shadow-[#5f2faf]/30 scale-110"
                        : step < currentStep
                          ? "bg-[#5f2faf] text-white"
                          : "bg-white/5 text-muted-foreground border border-white/10"
                    }`}
                  >
                    {step < currentStep ? <Check className="h-5 w-5" /> : step}
                  </div>
                  {step < 3 && (
                    <div
                      className={`h-0.5 flex-1 mx-3 transition-all duration-500 ${
                        step < currentStep ? "bg-[#5f2faf]" : "bg-white/10"
                      }`}
                    />
                  )}
                </div>
              ))}
            </div>

            {/* Step Content */}
            <div className="bg-gradient-to-br from-white/5 to-white/[0.02] backdrop-blur-xl rounded-2xl border border-white/10 p-8 min-h-[400px] transition-all duration-500 hover:shadow-[0_0_30px_rgba(95,47,175,0.15)]">
              {/* Step 1: Campaign & Creative Selection */}
              {currentStep === 1 && (
                <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-500">
                  <div>
                    <h2 className="text-2xl font-bold mb-2">Kampagne & Winning Ad auswählen</h2>
                    <p className="text-muted-foreground">Wähle die Kampagne und das Top-Performing Creative</p>
                  </div>

                  {/* Campaign Selector */}
                  <div className="space-y-3">
                    <label className="text-sm font-medium">Kampagne</label>
                    <div className="relative">
                      <Select value={selectedCampaignId} onValueChange={setSelectedCampaignId}>
                        <SelectTrigger className="w-full h-14 px-4 bg-white/5 border border-white/10 rounded-xl hover:bg-white/10 hover:border-[#5f2faf]/30 transition-all duration-300">
                          <SelectValue placeholder="Kampagne auswählen..." />
                        </SelectTrigger>
                        <SelectContent>
                          {activeCampaigns.map((campaign: any) => (
                            <SelectItem key={campaign.id} value={campaign.id}>
                              {campaign.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  {/* Creative Selection */}
                  {selectedCampaignId && (
                    <div className="space-y-3">
                      <label className="text-sm font-medium">Top Performer (für Style-Analyse)</label>
                      {winningCreativesLoading ? (
                        <div className="flex items-center justify-center py-8">
                          <Loader2 className="h-6 w-6 animate-spin text-[#5f2faf]" />
                        </div>
                      ) : (
                        <div className="space-y-3">
                          {winningCreatives.slice(0, 3).map((creative: any, index: number) => (
                            <div
                              key={creative.id}
                              onClick={() => setSelectedCreativeId(index + 1)}
                              className={`group/item relative p-4 rounded-xl border cursor-pointer transition-all duration-300 ${
                                selectedCreativeId === index + 1
                                  ? "bg-[#5f2faf]/10 border-[#5f2faf] shadow-[0_0_20px_rgba(95,47,175,0.2)]"
                                  : "bg-white/5 border-white/10 hover:bg-white/10 hover:border-[#5f2faf]/30"
                              }`}
                            >
                              <div className="flex items-center gap-4">
                                {creative.imageUrl ? (
                                  <img
                                    src={creative.imageUrl}
                                    alt={creative.name}
                                    className="w-16 h-16 rounded-lg object-cover"
                                  />
                                ) : (
                                  <div className="w-16 h-16 rounded-lg bg-white/5 flex items-center justify-center">
                                    <ImageIcon className="h-8 w-8 text-muted-foreground" />
                                  </div>
                                )}
                                <div className="flex-1 min-w-0">
                                  <h4 className="font-medium truncate">{creative.name}</h4>
                                  <div className="flex items-center gap-4 mt-1">
                                    <span className="text-sm text-green-400">CPL: {creative.cpl}€</span>
                                    <span className="text-sm text-blue-400">CTR: {creative.ctr}%</span>
                                  </div>
                                </div>
                                <div className="flex items-center justify-center h-8 w-8 rounded-lg bg-white/5 text-muted-foreground text-sm font-medium">
                                  #{index + 1}
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}

              {/* Step 2: Format Selection */}
              {currentStep === 2 && (
                <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-500">
                  <div>
                    <h2 className="text-2xl font-bold mb-2">Format auswählen</h2>
                    <p className="text-muted-foreground">Wähle ein oder mehrere Zielformate</p>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    {(Object.keys(formatSpecs) as CreativeFormat[]).map((formatId) => {
                      const format = formatSpecs[formatId];
                      return (
                        <div
                          key={formatId}
                          onClick={() => toggleFormat(formatId)}
                          className={`relative p-6 rounded-xl border cursor-pointer transition-all duration-300 text-center ${
                            selectedFormats.includes(formatId)
                              ? "bg-[#5f2faf]/10 border-[#5f2faf] shadow-[0_0_20px_rgba(95,47,175,0.2)]"
                              : "bg-white/5 border-white/10 hover:bg-white/10 hover:border-[#5f2faf]/30"
                          }`}
                        >
                          <div
                            className={`mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-xl transition-all duration-300 ${
                              selectedFormats.includes(formatId)
                                ? "bg-[#5f2faf] text-white"
                                : "bg-white/5 text-muted-foreground"
                            }`}
                          >
                            {selectedFormats.includes(formatId) && <Check className="h-6 w-6" />}
                          </div>
                          <h4 className="font-semibold text-lg">{format.label}</h4>
                          <p className="text-sm text-muted-foreground mt-1">{format.ratio}</p>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Step 3: Creative Count */}
              {currentStep === 3 && (
                <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-500">
                  <div>
                    <h2 className="text-2xl font-bold mb-2">Anzahl Variationen</h2>
                    <p className="text-muted-foreground">Wie viele Creatives sollen generiert werden?</p>
                  </div>

                  <div className="grid grid-cols-3 sm:grid-cols-5 gap-4">
                    {[1, 2, 3, 5, 10].map((count) => (
                      <div
                        key={count}
                        onClick={() => setCreativeCount(count)}
                        className={`aspect-square rounded-xl border cursor-pointer transition-all duration-300 flex items-center justify-center text-3xl font-bold ${
                          creativeCount === count
                            ? "bg-[#5f2faf]/10 border-[#5f2faf] shadow-[0_0_20px_rgba(95,47,175,0.2)] text-white"
                            : "bg-white/5 border-white/10 hover:bg-white/10 hover:border-[#5f2faf]/30 text-muted-foreground"
                        }`}
                      >
                        {count}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Navigation Buttons */}
            <div className="flex items-center gap-4">
              {currentStep > 1 && (
                <Button
                  onClick={() => setCurrentStep(currentStep - 1)}
                  variant="outline"
                  className="h-14 px-8 border-white/10 hover:bg-white/10 hover:border-[#5f2faf]/30 transition-all duration-300"
                >
                  Zurück
                </Button>
              )}

              {currentStep < 3 ? (
                <Button
                  onClick={() => setCurrentStep(currentStep + 1)}
                  disabled={!canProceed()}
                  className="flex-1 h-14 bg-gradient-to-r from-[#5f2faf] to-[#8b5cf6] hover:from-[#7041c9] hover:to-[#9d6ff7] text-white font-semibold text-lg rounded-xl shadow-lg shadow-[#5f2faf]/30 hover:shadow-[#5f2faf]/50 transition-all duration-300 hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
                >
                  Weiter
                </Button>
              ) : (
                <Button
                  onClick={handleGenerate}
                  disabled={!canProceed() || isGenerating}
                  className="flex-1 h-14 bg-gradient-to-r from-[#5f2faf] to-[#8b5cf6] hover:from-[#7041c9] hover:to-[#9d6ff7] text-white font-semibold text-lg rounded-xl shadow-lg shadow-[#5f2faf]/30 hover:shadow-[#5f2faf]/50 transition-all duration-300 hover:scale-[1.02] group/btn disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
                >
                  <Sparkles className="h-5 w-5 mr-2 group-hover/btn:rotate-12 transition-transform" />
                  {creativeCount} Creative{creativeCount > 1 ? "s" : ""} generieren
                </Button>
              )}
            </div>
          </div>

          {/* Generated Creatives - Right Sidebar */}
          <div>
            <GeneratedCreatives />
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
