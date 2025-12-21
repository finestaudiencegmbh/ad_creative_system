import DashboardLayout from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Sparkles, Loader2, Trophy, Download, Image as ImageIcon } from "lucide-react";
import { useState, useEffect } from "react";
import { toast } from "sonner";
import { trpc } from "@/lib/trpc";
import { startOfMonth, endOfMonth, format as formatDate } from "date-fns";
import { getRandomFunFact } from "@/lib/funFacts";

type CreativeFormat = 'feed' | 'story' | 'reel' | 'all';

interface GeneratedCreative {
  imageUrl: string;
  headline: string;
  eyebrowText?: string;
  ctaText?: string;
  format: CreativeFormat;
}

export default function CreativeGenerator() {
  // Step 1: Campaign selection
  const [selectedCampaignId, setSelectedCampaignId] = useState<string>("");
  const [manualLandingPage, setManualLandingPage] = useState<string>("");
  
  // Step 1b: Ad Set selection (optional)
  const [selectedAdSetId, setSelectedAdSetId] = useState<string>("");
  
  // Step 2: Format selection
  const [format, setFormat] = useState<CreativeFormat>("feed");
  
  // Step 3: Batch count
  const [batchCount, setBatchCount] = useState<number>(3);
  
  // Step 4: Description (optional)
  const [description, setDescription] = useState("");
  
  // State
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedCreatives, setGeneratedCreatives] = useState<GeneratedCreative[]>([]);
  const [currentFunFact, setCurrentFunFact] = useState(getRandomFunFact());
  
  // Rotate fun facts every 4 seconds during generation
  useEffect(() => {
    if (!isGenerating) return;
    
    const interval = setInterval(() => {
      setCurrentFunFact(getRandomFunFact());
    }, 4000);
    
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

  // Fetch landing page data when campaign is selected
  const { data: landingPageData, isLoading: landingPageLoading } = trpc.ai.getLandingPageFromCampaign.useQuery(
    { campaignId: selectedCampaignId },
    { enabled: !!selectedCampaignId }
  );

  // Fetch winning creatives when campaign is selected
  const { data: winningCreativesData, isLoading: winningCreativesLoading } = trpc.ai.getWinningCreatives.useQuery(
    {
      campaignId: selectedCampaignId,
      timeRange: {
        since: formatDate(startDate, 'yyyy-MM-dd'),
        until: formatDate(endDate, 'yyyy-MM-dd'),
      },
    },
    { enabled: !!selectedCampaignId }
  );

  // Note: Ad set selection will use ad set IDs from campaign data

  const generateBatchMutation = trpc.ai.generateBatchCreatives.useMutation();

  const handleGenerate = async () => {
    // Validation
    if (!selectedCampaignId) {
      toast.error("Bitte wähle eine Kampagne aus");
      return;
    }
    if (!format) {
      toast.error("Bitte wähle ein Format aus");
      return;
    }

    setIsGenerating(true);
    setGeneratedCreatives([]);
    
    const estimatedTime = batchCount * 15; // ~15 seconds per creative
    toast.info(`Generiere ${batchCount} Creative${batchCount > 1 ? 's' : ''}... Das dauert ca. ${estimatedTime}-${estimatedTime + 10} Sekunden`);

    try {
      toast.info("⚡ Analysiere Winning Ads und extrahiere Design-System...");
      
      // If "all" formats selected, generate for each format
      const formatsToGenerate: ('feed' | 'story' | 'reel')[] = 
        format === 'all' ? ['feed', 'story', 'reel'] : [format as 'feed' | 'story' | 'reel'];
      
      const allCreatives: GeneratedCreative[] = [];
      
      for (const fmt of formatsToGenerate) {
        const creatives = await generateBatchMutation.mutateAsync({
          campaignId: selectedCampaignId,
          format: fmt,
          count: batchCount,
          userDescription: description || undefined,
          manualLandingPage: manualLandingPage || undefined,
          adSetId: selectedAdSetId || undefined,
        });
        allCreatives.push(...creatives);
      }
      
      setGeneratedCreatives(allCreatives);
      toast.success(`✅ ${allCreatives.length} Creative${allCreatives.length > 1 ? 's' : ''} erfolgreich generiert!`);
    } catch (error) {
      console.error('Generation error:', error);
      toast.error("Fehler beim Generieren der Creatives");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleDownload = async (imageUrl: string, index: number) => {
    try {
      const response = await fetch(imageUrl);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `creative-${format}-${index + 1}.png`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      toast.success("Creative heruntergeladen");
    } catch (error) {
      console.error('Download error:', error);
      toast.error("Fehler beim Herunterladen");
    }
  };

  const handleDownloadAll = async () => {
    for (let i = 0; i < generatedCreatives.length; i++) {
      await handleDownload(generatedCreatives[i].imageUrl, i);
      // Small delay between downloads
      await new Promise(resolve => setTimeout(resolve, 500));
    }
  };

  const activeCampaigns = campaignsData?.filter(c => c.status === 'ACTIVE') || [];

  const formatSpecs: Record<CreativeFormat, { label: string; size: string; description: string }> = {
    feed: { label: 'Feed (1:1)', size: '1080 × 1080 px', description: 'Quadratisches Format für News Feed' },
    story: { label: 'Story (9:16)', size: '1080 × 1920 px', description: 'Vertikales Format für Stories (Safe Zones: Top 14%, Bottom 20%)' },
    reel: { label: 'Reel (9:16)', size: '1080 × 1920 px', description: 'Vertikales Format für Reels (Safe Zones: Top 25%, Bottom 30%)' },
    all: { label: 'Alle Formate', size: 'Feed + Story + Reel', description: 'Generiert Creatives in allen drei Formaten' },
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
            {/* Step 1: Campaign Selection */}
            <Card>
              <CardHeader>
                <CardTitle>1. Kampagne auswählen</CardTitle>
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
                      {activeCampaigns.map((campaign) => (
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
                  <input
                    id="adSetId"
                    type="text"
                    placeholder="Ad Set ID für Targeting-Kontext"
                    value={selectedAdSetId}
                    onChange={(e) => setSelectedAdSetId(e.target.value)}
                    className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                  />
                  <p className="text-xs text-muted-foreground">
                    Für zielgruppenspezifische Creatives kannst du eine Ad Set ID angeben
                  </p>
                </div>

                {winningCreativesLoading && selectedCampaignId && (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Analysiere Winning Ads...
                  </div>
                )}

                {winningCreativesData && winningCreativesData.winners.length > 0 && (
                  <div className="space-y-2">
                    <p className="text-xs font-medium text-muted-foreground">
                      <Trophy className="inline h-3 w-3 mr-1 text-yellow-500" />
                      Top Performer (wird für Style-Analyse verwendet)
                    </p>
                    <div className="space-y-2">
                      {winningCreativesData.winners.slice(0, 3).map((winner, idx) => (
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

            {/* Step 2: Format Selection */}
            <Card>
              <CardHeader>
                <CardTitle>2. Format auswählen</CardTitle>
                <CardDescription>
                  Wähle das Zielformat für deine Creatives
                </CardDescription>
              </CardHeader>
              <CardContent>
                <RadioGroup value={format} onValueChange={(v) => setFormat(v as CreativeFormat)}>
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
            </Card>

            {/* Step 3: Batch Count */}
            <Card>
              <CardHeader>
                <CardTitle>3. Anzahl Creatives</CardTitle>
                <CardDescription>
                  Wie viele Variationen sollen generiert werden?
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <Label htmlFor="count">Anzahl (1-10)</Label>
                  <Select value={batchCount.toString()} onValueChange={(v) => setBatchCount(parseInt(v))}>
                    <SelectTrigger id="count">
                      <SelectValue />
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
            </Card>

            {/* Step 4: Description (Optional) */}
            <Card>
              <CardHeader>
                <CardTitle>4. Zusätzliche Beschreibung (Optional)</CardTitle>
                <CardDescription>
                  Ergänze spezifische Anforderungen oder lasse das Feld leer für automatische Generierung
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Textarea
                  placeholder="z.B. Mehr qualifizierte Leads für Marketing-Agenturen, moderne Farbpalette, professionelle Atmosphäre"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={3}
                />
              </CardContent>
            </Card>

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
                  Generiere {batchCount} Creative{batchCount > 1 ? 's' : ''}...
                </>
              ) : (
                <>
                  <Sparkles className="mr-2 h-5 w-5" />
                  {batchCount} Creative{batchCount > 1 ? 's' : ''} generieren
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
                    <CardDescription>
                      {generatedCreatives.length > 0 
                        ? `${generatedCreatives.length} Creative${generatedCreatives.length > 1 ? 's' : ''} bereit zum Download`
                        : 'Wähle eine Kampagne und starte die Generierung'
                      }
                    </CardDescription>
                  </div>
                  {generatedCreatives.length > 1 && (
                    <Button onClick={handleDownloadAll} variant="outline" size="sm">
                      <Download className="mr-2 h-4 w-4" />
                      Alle herunterladen
                    </Button>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                {isGenerating && (
                  <div className="flex flex-col items-center justify-center py-16 space-y-6">
                    <div className="relative">
                      <Loader2 className="h-16 w-16 animate-spin text-primary" />
                      <div className="absolute inset-0 h-16 w-16 animate-ping rounded-full bg-primary/20" />
                    </div>
                    <div className="text-center space-y-3 max-w-md">
                      <p className="text-lg font-semibold">Generierung läuft...</p>
                      <div className="min-h-[60px] flex items-center justify-center">
                        <p className="text-sm text-muted-foreground animate-fade-in">
                          {currentFunFact}
                        </p>
                      </div>
                      <p className="text-xs text-muted-foreground/60">
                        Dies kann 30-60 Sekunden dauern
                      </p>
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
                        <div className="p-4 space-y-3">
                          <div>
                            {creative.eyebrowText && (
                              <p className="text-xs font-medium text-primary mb-1">
                                {creative.eyebrowText}
                              </p>
                            )}
                            <p className="font-semibold">{creative.headline}</p>
                            {creative.ctaText && (
                              <p className="text-sm text-muted-foreground mt-1">
                                {creative.ctaText}
                              </p>
                            )}
                          </div>
                          <div className="flex items-center justify-between">
                            <Badge variant="secondary">
                              {formatSpecs[creative.format].label}
                            </Badge>
                            <Button
                              onClick={() => handleDownload(creative.imageUrl, index)}
                              variant="outline"
                              size="sm"
                            >
                              <Download className="mr-2 h-4 w-4" />
                              Herunterladen
                            </Button>
                          </div>
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
