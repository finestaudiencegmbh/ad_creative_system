import DashboardLayout from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Loader2, Sparkles, Trophy, ImageIcon, Download, ChevronDown, Check } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { useState, useEffect } from "react";
import { startOfMonth, endOfMonth, format as formatDate } from "date-fns";
import { toast } from "sonner";
import { getRandomFunFact } from "@/lib/funFacts";

type CreativeFormat = "feed" | "story" | "reel" | "all";

interface GeneratedCreative {
  imageUrl: string;
  headline: string;
  eyebrowText?: string;
  ctaText?: string;
  format: CreativeFormat;
}

const formatSpecs: Record<CreativeFormat, { label: string; size: string; description: string; aspectRatio: string }> = {
  feed: {
    label: "Feed (1:1)",
    size: "1080 × 1080 px",
    description: "Quadratisches Format für News Feed",
    aspectRatio: "1:1",
  },
  story: {
    label: "Story (9:16)",
    size: "1080 × 1920 px",
    description: "Vertikales Format für Stories (Safe Zones: Top 14%, Bottom 20%)",
    aspectRatio: "9:16",
  },
  reel: {
    label: "Reel (9:16)",
    size: "1080 × 1920 px",
    description: "Vertikales Format für Reels (Safe Zones: Top 25%, Bottom 30%)",
    aspectRatio: "9:16",
  },
  all: {
    label: "Alle Formate",
    size: "Feed + Story + Reel",
    description: "Generiert Creatives in allen drei Formaten",
    aspectRatio: "mixed",
  },
};

export default function CreativeGenerator() {
  // Campaign selection
  const [selectedCampaignId, setSelectedCampaignId] = useState("");
  const [selectedAdSetId, setSelectedAdSetId] = useState("");
  const [manualLandingPage, setManualLandingPage] = useState("");
  
  // Format & batch settings
  const [format, setFormat] = useState<CreativeFormat | null>(null);
  const [batchCount, setBatchCount] = useState<number | null>(null);
  const [description, setDescription] = useState("");
  
  // State
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedCreatives, setGeneratedCreatives] = useState<GeneratedCreative[]>([]);
  const [currentFunFact, setCurrentFunFact] = useState(getRandomFunFact());
  const [usedFacts, setUsedFacts] = useState<Set<string>>(new Set());
  
  // Collapsible state
  const [step2Open, setStep2Open] = useState(false);
  const [step3Open, setStep3Open] = useState(false);
  const [step4Open, setStep4Open] = useState(false);

  // Rotate fun facts every 8 seconds during generation (no repeats)
  useEffect(() => {
    if (!isGenerating) return;
    
    const interval = setInterval(() => {
      let newFact = getRandomFunFact();
      // Avoid repeating facts until all have been shown
      let attempts = 0;
      while (usedFacts.has(newFact) && attempts < 10) {
        newFact = getRandomFunFact();
        attempts++;
      }
      
      // If all facts shown, reset
      if (usedFacts.size >= 65) {
        setUsedFacts(new Set([newFact]));
      } else {
        setUsedFacts(prev => new Set([...Array.from(prev), newFact]));
      }
      
      setCurrentFunFact(newFact);
    }, 8000); // 8 seconds per fact
    
    return () => clearInterval(interval);
  }, [isGenerating, usedFacts]);

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

  // Fetch landing page data
  const { data: landingPageData, isLoading: landingPageLoading } = trpc.ai.getLandingPageFromCampaign.useQuery(
    { campaignId: selectedCampaignId },
    { enabled: !!selectedCampaignId }
  );

  // Fetch winning creatives (filtered by ad set if selected)
  const { data: winningCreativesData, isLoading: winningCreativesLoading } = trpc.ai.getWinningCreatives.useQuery(
    { 
      campaignId: selectedCampaignId,
      adSetId: selectedAdSetId || undefined,
    },
    { enabled: !!selectedCampaignId }
  );

  // Fetch ad sets
  const { data: adSetsData, isLoading: adSetsLoading } = trpc.campaigns.getAdSets.useQuery(
    { campaignId: selectedCampaignId },
    { enabled: !!selectedCampaignId }
  );

  // Fetch audience targeting
  const { data: audienceTargeting, isLoading: targetingLoading } = trpc.ai.getAudienceTargeting.useQuery(
    { adSetId: selectedAdSetId },
    { enabled: !!selectedAdSetId }
  );

  // Auto-expand steps when previous step is completed
  useEffect(() => {
    if (selectedCampaignId && !step2Open) {
      setStep2Open(true);
    }
  }, [selectedCampaignId]);

  useEffect(() => {
    if (format && !step3Open) {
      setStep3Open(true);
    }
  }, [format]);

  useEffect(() => {
    if (batchCount && !step4Open) {
      setStep4Open(true);
    }
  }, [batchCount]);

  // Check if steps are completed
  const step1Complete = !!selectedCampaignId;
  const step2Complete = !!format;
  const step3Complete = batchCount !== null && batchCount > 0;
  const step4Complete = step3Complete; // Optional field, complete when step 3 is complete

  const generateBatchCreativesMutation = trpc.ai.generateBatchCreatives.useMutation();

  const handleGenerate = async () => {
    if (!selectedCampaignId) {
      toast.error("Bitte wähle eine Kampagne aus");
      return;
    }

    if (!format) {
      toast.error("Bitte wähle ein Format aus");
      return;
    }

    if (!batchCount || batchCount <= 0) {
      toast.error("Bitte wähle eine Anzahl aus");
      return;
    }

    setIsGenerating(true);
    setGeneratedCreatives([]);

    try {
      const formats = format === "all" ? ["feed", "story", "reel"] : [format];
      
      for (const currentFormat of formats) {
        const result = await generateBatchCreativesMutation.mutateAsync({
          campaignId: selectedCampaignId,
          format: currentFormat as Exclude<CreativeFormat, "all">,
          count: batchCount,
          userDescription: description || undefined,
          manualLandingPage: manualLandingPage || undefined,
          adSetId: selectedAdSetId || undefined,
        });

        setGeneratedCreatives(prev => [...prev, ...result]);
      }

      toast.success(`${formats.length * (batchCount || 1)} Creatives erfolgreich generiert!`);
    } catch (error: any) {
      console.error("Generation error:", error);
      toast.error(error.message || "Fehler bei der Generierung");
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Creative Generator</h1>
          <p className="text-muted-foreground mt-2">
            KI-gestützte Creative-Generierung mit Style-Aware Prompts und Text-Overlays
          </p>
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          <div className="space-y-6">
            {/* Step 1: Campaign Selection - Always Visible */}
            <Card>
              <CardHeader>
                <div className="flex items-center gap-2">
                  <div className={`w-5 h-5 rounded flex items-center justify-center ${step1Complete ? 'bg-green-500' : 'bg-gray-300'}`}>
                    {step1Complete && <Check className="h-3 w-3 text-white" />}
                  </div>
                  <CardTitle>1. Kampagne auswählen</CardTitle>
                </div>
                <CardDescription>
                  Wähle eine Kampagne aus, um Winning Ads und Landing Page zu analysieren
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="campaign">Kampagne</Label>
                  <Select value={selectedCampaignId} onValueChange={setSelectedCampaignId}>
                    <SelectTrigger id="campaign">
                      <SelectValue placeholder="Kampagne auswählen" />
                    </SelectTrigger>
                    <SelectContent>
                      {campaignsLoading && (
                        <div className="p-2 text-sm text-muted-foreground">Lade Kampagnen...</div>
                      )}
                      {activeCampaigns.map((campaign: any) => (
                        <SelectItem key={campaign.id} value={campaign.id}>
                          {campaign.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {landingPageLoading && selectedCampaignId && (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Analysiere Landingpage...
                  </div>
                )}

                {landingPageData?.url && (
                  <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
                    <p className="text-xs text-green-800 font-medium mb-1">
                      ✓ Landingpage erkannt
                    </p>
                    <p className="text-xs text-green-700 break-all">
                      {landingPageData.url}
                    </p>
                  </div>
                )}

                {/* Manual Landing Page Override */}
                <div className="space-y-2">
                  <Label htmlFor="manualLandingPage" className="text-sm">
                    Manuelle Landingpage (Optional)
                  </Label>
                  <input
                    id="manualLandingPage"
                    type="url"
                    placeholder="https://..."
                    value={manualLandingPage}
                    onChange={(e) => setManualLandingPage(e.target.value)}
                    className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                  />
                  <p className="text-xs text-muted-foreground">
                    Falls automatische Erkennung fehlschlägt, kannst du hier manuell eine URL eingeben
                  </p>
                </div>

                {/* Ad Set Selection (Optional) */}
                <div className="space-y-2">
                  <Label htmlFor="adSetId" className="text-sm">
                    Anzeigengruppe (Optional)
                  </Label>
                  <Select value={selectedAdSetId} onValueChange={setSelectedAdSetId} disabled={!selectedCampaignId}>
                    <SelectTrigger id="adSetId">
                      <SelectValue placeholder="Anzeigengruppe auswählen" />
                    </SelectTrigger>
                    <SelectContent>
                      {adSetsLoading && (
                        <div className="p-2 text-sm text-muted-foreground">Lade Anzeigengruppen...</div>
                      )}
                      {adSetsData && adSetsData.length === 0 && (
                        <div className="p-2 text-sm text-muted-foreground">Keine aktiven Anzeigengruppen gefunden</div>
                      )}
                      {adSetsData?.map((adSet) => (
                        <SelectItem key={adSet.id} value={adSet.id}>
                          {adSet.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-muted-foreground">
                    Für zielgruppenspezifische Creatives kannst du eine Anzeigengruppe auswählen
                  </p>
                </div>

                {/* Audience Targeting Display */}
                {targetingLoading && selectedAdSetId && (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Lade Zielgruppen-Einstellungen...
                  </div>
                )}

                {audienceTargeting && selectedAdSetId && (
                  <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg space-y-3">
                    <p className="text-xs font-semibold text-blue-900 mb-2">🎯 Erkannte Zielgruppen-Einstellungen</p>
                    
                    {/* Age */}
                    {audienceTargeting.age_min && audienceTargeting.age_max && (
                      <div className="space-y-1">
                        <p className="text-xs font-medium text-blue-800">Alter</p>
                        <p className="text-xs text-blue-700">{audienceTargeting.age_min} - {audienceTargeting.age_max} Jahre</p>
                      </div>
                    )}

                    {/* Gender */}
                    {audienceTargeting.genders && audienceTargeting.genders.length > 0 && (
                      <div className="space-y-1">
                        <p className="text-xs font-medium text-blue-800">Geschlecht</p>
                        <p className="text-xs text-blue-700">
                          {audienceTargeting.genders.map((g: number) => g === 1 ? 'Männer' : g === 2 ? 'Frauen' : 'Alle').join(', ')}
                        </p>
                      </div>
                    )}

                    {/* Locations */}
                    {audienceTargeting.geo_locations && (
                      <div className="space-y-1">
                        <p className="text-xs font-medium text-blue-800">Land/Region</p>
                        <div className="text-xs text-blue-700 space-y-1">
                          {audienceTargeting.geo_locations.countries && audienceTargeting.geo_locations.countries.length > 0 && (
                            <p>Länder: {audienceTargeting.geo_locations.countries.join(', ')}</p>
                          )}
                          {audienceTargeting.geo_locations.regions && audienceTargeting.geo_locations.regions.length > 0 && (
                            <p>Regionen: {audienceTargeting.geo_locations.regions.map((r: any) => r.name).join(', ')}</p>
                          )}
                          {audienceTargeting.geo_locations.cities && audienceTargeting.geo_locations.cities.length > 0 && (
                            <p>Städte: {audienceTargeting.geo_locations.cities.map((c: any) => c.name).join(', ')}</p>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Interests */}
                    {audienceTargeting.flexible_spec && audienceTargeting.flexible_spec.length > 0 && (
                      <div className="space-y-1">
                        <p className="text-xs font-medium text-blue-800">Detaillierte Targeting-Angaben</p>
                        <div className="text-xs text-blue-700 space-y-1">
                          {audienceTargeting.flexible_spec.map((spec: any, idx: number) => (
                            <div key={idx}>
                              {spec.interests && spec.interests.length > 0 && (
                                <p>• Interessen: {spec.interests.map((i: any) => i.name).join(', ')}</p>
                              )}
                              {spec.behaviors && spec.behaviors.length > 0 && (
                                <p>• Verhaltensweisen: {spec.behaviors.map((b: any) => b.name).join(', ')}</p>
                              )}
                              {spec.demographics && spec.demographics.length > 0 && (
                                <p>• Demografische Merkmale: {spec.demographics.map((d: any) => d.name).join(', ')}</p>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Narrow Targeting */}
                    {audienceTargeting.targeting_optimization && (
                      <div className="space-y-1">
                        <p className="text-xs font-medium text-blue-800">Targeting-Optimierung</p>
                        <p className="text-xs text-blue-700">{audienceTargeting.targeting_optimization}</p>
                      </div>
                    )}
                  </div>
                )}

                {winningCreativesLoading && selectedCampaignId && (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Analysiere Winning Ads...
                  </div>
                )}

                {winningCreativesData && winningCreativesData.winners.length > 0 && (
                  <div className="space-y-2">
                    <p className="text-xs text-muted-foreground mb-2">
                      🏆 Top Performer (wird für Style-Analyse verwendet)
                    </p>
                    
                    {/* Info message if no ROAS data available */}
                    {winningCreativesData.winners.every((w: any) => w.metrics.roasOrderVolume === 0 && w.metrics.roasCashCollect === 0) && (
                      <div className="p-2 bg-yellow-50 border border-yellow-200 rounded-lg mb-2">
                        <p className="text-xs text-yellow-800">
                          ℹ️ <strong>ROAS-Daten nicht verfügbar:</strong> Trage Verkäufe im Dashboard ein, um ROAS-basiertes Ranking zu aktivieren.
                        </p>
                      </div>
                    )}
                    
                    <div className="space-y-2">
                      {winningCreativesData.winners.slice(0, 3).map((winner: any, idx: number) => (
                        <div key={winner.adId} className="flex items-center gap-2 p-2 bg-muted rounded-lg">
                          {winner.imageUrl ? (
                            <img 
                              src={winner.imageUrl} 
                              alt={`Top ${idx + 1}`}
                              className="w-12 h-12 object-cover rounded"
                            />
                          ) : (
                            <div className="w-12 h-12 bg-muted-foreground/20 rounded flex items-center justify-center">
                              <ImageIcon className="h-6 w-6 text-muted-foreground" />
                            </div>
                          )}
                          <div className="flex-1 min-w-0">
                            <p className="text-xs font-medium truncate">{winner.adName}</p>
                            <div className="flex gap-2 text-xs text-muted-foreground">
                              {winner.metrics.roasOrderVolume > 0 && (
                                <span className="font-semibold text-green-600">ROAS: {winner.metrics.roasOrderVolume.toFixed(2)}x</span>
                              )}
                              <span>CPL: {winner.metrics.costPerLead.toFixed(2)}€</span>
                              <span>CTR: {winner.metrics.outboundCtr.toFixed(2)}%</span>
                            </div>
                          </div>
                          <Badge variant="secondary" className="text-xs">
                            #{idx + 1}
                          </Badge>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Step 2: Format Selection - Collapsible */}
            <Collapsible open={step2Open} onOpenChange={(open) => step1Complete && setStep2Open(open)}>
              <Card className={!step1Complete ? 'opacity-50 pointer-events-none' : ''}>
                <CollapsibleTrigger asChild disabled={!step1Complete}>
                  <CardHeader className={`cursor-pointer transition-colors ${step1Complete ? 'hover:bg-accent/50' : 'cursor-not-allowed'}`}>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className={`w-5 h-5 rounded flex items-center justify-center ${step2Complete ? 'bg-green-500' : 'bg-gray-300'}`}>
                          {step2Complete && <Check className="h-3 w-3 text-white" />}
                        </div>
                        <CardTitle>2. Format auswählen</CardTitle>
                      </div>
                      <ChevronDown className={`h-5 w-5 transition-transform ${step2Open ? 'rotate-180' : ''}`} />
                    </div>
                    <CardDescription>
                      Wähle das Zielformat für deine Creatives
                    </CardDescription>
                  </CardHeader>
                </CollapsibleTrigger>
                <CollapsibleContent>
                  <CardContent>
                    <RadioGroup value={format || ""} onValueChange={(v) => setFormat(v as CreativeFormat)} disabled={!step1Complete}>
                      {Object.entries(formatSpecs).map(([key, spec]) => (
                        <div key={key} className="flex items-start space-x-3 space-y-0">
                          <RadioGroupItem value={key} id={key} />
                          <Label htmlFor={key} className="font-normal cursor-pointer flex-1">
                            <div>
                              <div className="font-medium">{spec.label}</div>
                              <div className="text-xs text-muted-foreground">{spec.size}</div>
                              <div className="text-xs text-muted-foreground mt-1">{spec.description}</div>
                            </div>
                          </Label>
                        </div>
                      ))}
                    </RadioGroup>
                  </CardContent>
                </CollapsibleContent>
              </Card>
            </Collapsible>

            {/* Step 3: Batch Count - Collapsible */}
            <Collapsible open={step3Open} onOpenChange={(open) => step2Complete && setStep3Open(open)}>
              <Card className={!step2Complete ? 'opacity-50 pointer-events-none' : ''}>
                <CollapsibleTrigger asChild disabled={!step2Complete}>
                  <CardHeader className={`cursor-pointer transition-colors ${step2Complete ? 'hover:bg-accent/50' : 'cursor-not-allowed'}`}>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className={`w-5 h-5 rounded flex items-center justify-center ${step3Complete ? 'bg-green-500' : 'bg-gray-300'}`}>
                          {step3Complete && <Check className="h-3 w-3 text-white" />}
                        </div>
                        <CardTitle>3. Anzahl Creatives</CardTitle>
                      </div>
                      <ChevronDown className={`h-5 w-5 transition-transform ${step3Open ? 'rotate-180' : ''}`} />
                    </div>
                    <CardDescription>
                      Wie viele Variationen sollen generiert werden?
                    </CardDescription>
                  </CardHeader>
                </CollapsibleTrigger>
                <CollapsibleContent>
                  <CardContent>
                    <div className="space-y-2">
                      <Label htmlFor="count">Anzahl (1-10)</Label>
                      <Select value={batchCount?.toString() || ""} onValueChange={(v) => setBatchCount(parseInt(v))} disabled={!step2Complete}>
                        <SelectTrigger id="count">
                          <SelectValue placeholder="Anzahl wählen" />
                        </SelectTrigger>
                        <SelectContent>
                          {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((num) => (
                            <SelectItem key={num} value={num.toString()}>
                              {num} Creative{num > 1 ? 's' : ''}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </CardContent>
                </CollapsibleContent>
              </Card>
            </Collapsible>

            {/* Step 4: Description - Collapsible */}
            <Collapsible open={step4Open} onOpenChange={(open) => step3Complete && setStep4Open(open)}>
              <Card className={!step3Complete ? 'opacity-50 pointer-events-none' : ''}>
                <CollapsibleTrigger asChild disabled={!step3Complete}>
                  <CardHeader className={`cursor-pointer transition-colors ${step3Complete ? 'hover:bg-accent/50' : 'cursor-not-allowed'}`}>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className={`w-5 h-5 rounded flex items-center justify-center ${step4Complete ? 'bg-green-500' : 'bg-gray-300'}`}>
                          {step4Complete && <Check className="h-3 w-3 text-white" />}
                        </div>
                        <CardTitle>4. Zusätzliche Beschreibung (Optional)</CardTitle>
                      </div>
                      <ChevronDown className={`h-5 w-5 transition-transform ${step4Open ? 'rotate-180' : ''}`} />
                    </div>
                    <CardDescription>
                      Ergänze spezifische Anforderungen oder lasse das Feld leer für automatische Generierung
                    </CardDescription>
                  </CardHeader>
                </CollapsibleTrigger>
                <CollapsibleContent>
                  <CardContent>
                    <Textarea
                      disabled={!step3Complete}
                      placeholder="z.B. Mehr qualifizierte Leads für Marketing-Agenturen, moderne Farbpalette, professionelle Atmosphäre"
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      rows={3}
                    />
                  </CardContent>
                </CollapsibleContent>
              </Card>
            </Collapsible>

            {/* Generate Button */}
            <Button
              onClick={handleGenerate}
              disabled={!selectedCampaignId || isGenerating}
              className="w-full"
              size="lg"
            >
              {isGenerating ? (
                <>
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                  Generiere {batchCount || 1} Creative{(batchCount || 1) > 1 ? 's' : ''}...
                </>
              ) : (
                <>
                  <Sparkles className="mr-2 h-5 w-5" />
                  {batchCount || 1} Creative{(batchCount || 1) > 1 ? 's' : ''} generieren
                </>
              )}
            </Button>
          </div>

          {/* Right Column: Results */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Generierte Creatives</CardTitle>
                    <CardDescription>Wähle eine Kampagne und starte die Generierung</CardDescription>
                  </div>
                  {generatedCreatives.length > 0 && (
                    <Badge variant="secondary">
                      {generatedCreatives.length} Creative{generatedCreatives.length > 1 ? 's' : ''}
                    </Badge>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                {/* Loading Modal - Centered Popup */}
                {isGenerating && (
                  <div className="fixed inset-0 z-50 flex items-center justify-center">
                    {/* Backdrop with gradient */}
                    <div 
                      className="absolute inset-0 backdrop-blur-sm" 
                      style={{ background: 'linear-gradient(135deg, rgba(139, 92, 246, 0.3) 0%, rgba(59, 130, 246, 0.3) 100%)' }}
                      onClick={() => setIsGenerating(false)}
                    />
                    
                    {/* Modal Content */}
                    <div className="relative bg-white dark:bg-card border rounded-lg shadow-2xl p-12 max-w-md w-full mx-4">
                      {/* X Button */}
                      <button
                        onClick={() => setIsGenerating(false)}
                        className="absolute top-4 right-4 text-muted-foreground hover:text-foreground transition-colors"
                        aria-label="Modal schließen"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <line x1="18" y1="6" x2="6" y2="18"></line>
                          <line x1="6" y1="6" x2="18" y2="18"></line>
                        </svg>
                      </button>
                      <div className="flex flex-col items-center justify-center space-y-6">
                        <div className="relative">
                          <Loader2 className="h-16 w-16 animate-spin text-primary" />
                          <div className="absolute inset-0 h-16 w-16 animate-ping rounded-full bg-primary/20" />
                        </div>
                        <div className="text-center space-y-3">
                          <p className="text-lg font-semibold">Generierung läuft...</p>
                          <div className="min-h-[60px] flex items-center justify-center">
                            <p className="text-sm text-muted-foreground animate-fade-in px-4">
                              🎯 {currentFunFact}
                            </p>
                          </div>
                          <p className="text-xs text-muted-foreground/60">
                            Dies kann 30-60 Sekunden dauern
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {!isGenerating && generatedCreatives.length === 0 && (
                  <div className="flex flex-col items-center justify-center py-12 text-center space-y-2">
                    <ImageIcon className="h-12 w-12 text-muted-foreground/50" />
                    <p className="text-muted-foreground">
                      Noch keine Creatives generiert
                    </p>
                  </div>
                )}

                {!isGenerating && generatedCreatives.length > 0 && (
                  <div className="grid gap-4">
                    {generatedCreatives.map((creative, index) => (
                      <div key={index} className="border rounded-lg overflow-hidden">
                        <div className="aspect-square relative bg-muted">
                          <img
                            src={creative.imageUrl}
                            alt={`Creative ${index + 1}`}
                            className="w-full h-full object-contain"
                          />
                        </div>
                        <div className="p-4 space-y-2">
                          <div className="flex items-center justify-between">
                            <Badge variant="outline">{formatSpecs[creative.format].label}</Badge>
                            <a
                              href={creative.imageUrl}
                              download={`creative-${index + 1}.png`}
                              className="inline-flex items-center gap-1 text-sm text-primary hover:underline"
                            >
                              <Download className="h-4 w-4" />
                              Download
                            </a>
                          </div>
                          {creative.eyebrowText && (
                            <p className="text-xs text-muted-foreground">{creative.eyebrowText}</p>
                          )}
                          <p className="font-medium">{creative.headline}</p>
                          {creative.ctaText && (
                            <p className="text-sm text-primary">{creative.ctaText}</p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
