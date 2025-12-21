import DashboardLayout from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Sparkles, Loader2, Trophy, TrendingUp } from "lucide-react";
import { useState, useEffect } from "react";
import { toast } from "sonner";
import { trpc } from "@/lib/trpc";
import { startOfMonth, endOfMonth, format as formatDate } from "date-fns";

export default function CreativeGenerator() {
  // Step 1: Campaign selection
  const [selectedCampaignId, setSelectedCampaignId] = useState<string>("");
  const [manualUrl, setManualUrl] = useState("");
  
  // Step 2: Ad Set selection (optional)
  const [selectedAdSetId, setSelectedAdSetId] = useState<string>("");
  
  // Step 3: Format selection
  const [format, setFormat] = useState<string>("feed");
  
  // Step 3b: Batch count
  const [batchCount, setBatchCount] = useState<number>(1);
  
  // Step 4: Description (optional, auto-filled)
  const [description, setDescription] = useState("");
  
  // State
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedImageUrl, setGeneratedImageUrl] = useState<string | null>(null);

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

  // Fetch ad sets when campaign is selected
  const { data: adSetsData, isLoading: adSetsLoading } = trpc.adsets.listByCampaign.useQuery(
    {
      campaignId: selectedCampaignId,
      timeRange: {
        since: formatDate(startDate, 'yyyy-MM-dd'),
        until: formatDate(endDate, 'yyyy-MM-dd'),
      },
    },
    { enabled: !!selectedCampaignId }
  );

  // Fetch landing page data when campaign is selected
  const { data: landingPageData, isLoading: landingPageLoading } = trpc.ai.getLandingPageFromCampaign.useQuery(
    { campaignId: selectedCampaignId },
    { enabled: !!selectedCampaignId }
  );

  // Fetch audience targeting when ad set is selected
  const { data: audienceData } = trpc.ai.getAudienceTargeting.useQuery(
    { adSetId: selectedAdSetId },
    { enabled: !!selectedAdSetId }
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

  // Note: Description field is intentionally left empty for manual input
  // Auto-filling with page title ("Startseite") is not useful

  const generateImageMutation = trpc.ai.generateImage.useMutation();
  const generatePromptMutation = trpc.ai.generateCreativePrompt.useMutation();

  const handleGenerate = async () => {
    // Validation
    if (!selectedCampaignId && !manualUrl) {
      toast.error("Bitte wähle eine Kampagne aus oder gib eine Landingpage-URL ein");
      return;
    }
    if (!format) {
      toast.error("Bitte wähle ein Format aus");
      return;
    }

    setIsGenerating(true);
    toast.info("Creative wird generiert... Das dauert ca. 10-20 Sekunden");

    try {
      // Determine aspect ratio based on format
      let aspectRatio: "1:1" | "16:9" | "9:16" | "3:4" | "4:3" = "3:4";
      if (format === "feed") aspectRatio = "3:4";
      if (format === "story" || format === "reel") aspectRatio = "9:16";

      let prompt = "";
      
      // Use intelligent prompt generation if campaign is selected
      if (selectedCampaignId) {
        toast.info("⚡ Analysiere Winning Ads und Landing Page...");
        
        try {
          const promptData = await generatePromptMutation.mutateAsync({
            campaignId: selectedCampaignId,
            userDescription: description || undefined,
          });
          
          prompt = promptData.prompt;
          
          toast.success("✅ Intelligente Analyse abgeschlossen!");
          console.log('Generated Contextual Prompt:', prompt);
          console.log('Creative Analysis:', promptData.analysis);
          console.log('Landing Page:', promptData.landingPage);
        } catch (error) {
          console.error('Prompt generation failed, using fallback:', error);
          toast.warning('⚠️ Fallback zu Standard-Prompt');
          
          // Fallback to basic prompt
          prompt = "Professional B2B marketing ad creative showing dashboard with metrics, " +
                   "clean modern design, business data visualization, " +
                   "professional color scheme, high quality";
        }
      } else {
        // Manual URL - use basic prompt
        prompt = "Professional advertising creative, modern design, high quality";
        if (description) {
          prompt += `, ${description}`;
        }
      }
      
      // Add format-specific guidance
      if (format === "story" || format === "reel") {
        prompt += ", vertical format optimized for mobile viewing";
      }
      
      prompt += ", no text overlay, no watermarks, professional composition";
      
      console.log('Final FLUX Prompt:', prompt);

      const result = await generateImageMutation.mutateAsync({
        prompt,
        aspectRatio,
        numOutputs: 1,
      });

      if (result.imageUrls && result.imageUrls.length > 0) {
        setGeneratedImageUrl(result.imageUrls[0]);
        toast.success("Creative erfolgreich generiert!");
      } else {
        toast.error("Keine Bilder generiert");
      }
    } catch (error) {
      console.error('Generation error:', error);
      toast.error("Fehler beim Generieren des Creatives");
    } finally {
      setIsGenerating(false);
    }
  };

  const activeCampaigns = campaignsData?.filter(c => c.status === 'ACTIVE') || [];
  const activeAdSets = adSetsData?.filter(a => a.status === 'ACTIVE') || [];

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Creative Generator</h1>
          <p className="text-muted-foreground mt-2">
            Intelligente Creative-Generierung basierend auf deinen Kampagnen-Daten
          </p>
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          <div className="space-y-6">
            {/* Step 1: Campaign Selection */}
            <Card>
              <CardHeader>
                <CardTitle>1. Kampagne auswählen</CardTitle>
                <CardDescription>
                  Wähle eine Kampagne aus, um automatisch die Landingpage zu erkennen
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
                    {landingPageData.data?.title && (
                      <p className="text-xs text-green-700 mt-1">
                        <strong>Titel:</strong> {landingPageData.data.title}
                      </p>
                    )}
                  </div>
                )}

                {landingPageData?.error && (
                  <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                    <p className="text-xs text-yellow-800">
                      ⚠️ {landingPageData.error}
                    </p>
                  </div>
                )}

                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <span className="w-full border-t" />
                  </div>
                  <div className="relative flex justify-center text-xs uppercase">
                    <span className="bg-background px-2 text-muted-foreground">
                      Oder
                    </span>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="manualUrl">Landingpage-URL (manuell)</Label>
                  <Input
                    id="manualUrl"
                    type="url"
                    placeholder="https://beispiel.de/landingpage"
                    value={manualUrl}
                    onChange={(e) => setManualUrl(e.target.value)}
                    disabled={!!selectedCampaignId}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Step 2: Ad Set Selection (Optional) */}
            {selectedCampaignId && (
              <Card>
                <CardHeader>
                  <CardTitle>2. Anzeigengruppe (Optional)</CardTitle>
                  <CardDescription>
                    Wähle eine Anzeigengruppe für Zielgruppen-Kontext
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="adset">Anzeigengruppe</Label>
                    <Select value={selectedAdSetId} onValueChange={setSelectedAdSetId}>
                      <SelectTrigger id="adset">
                        <SelectValue placeholder="Anzeigengruppe auswählen (optional)" />
                      </SelectTrigger>
                      <SelectContent>
                        {adSetsLoading && (
                          <div className="p-2 text-sm text-muted-foreground">Lade Anzeigengruppen...</div>
                        )}
                        {activeAdSets.map((adset) => (
                          <SelectItem key={adset.id} value={adset.id}>
                            {adset.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {audienceData && (
                    <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                      <p className="text-xs text-blue-800 font-medium mb-2">
                        Zielgruppen-Targeting:
                      </p>
                      <div className="flex flex-wrap gap-2">
                        {audienceData.age_min && audienceData.age_max && (
                          <Badge variant="secondary" className="text-xs">
                            Alter: {audienceData.age_min}-{audienceData.age_max}
                          </Badge>
                        )}
                        {audienceData.genders && audienceData.genders.length > 0 && (
                          <Badge variant="secondary" className="text-xs">
                            {audienceData.genders.map((g: number) => g === 1 ? 'Männlich' : 'Weiblich').join(', ')}
                          </Badge>
                        )}
                        {audienceData.geo_locations?.countries && (
                          <Badge variant="secondary" className="text-xs">
                            {audienceData.geo_locations.countries.join(', ')}
                          </Badge>
                        )}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Step 3: Format Selection */}
            <Card>
              <CardHeader>
                <CardTitle>3. Format auswählen</CardTitle>
                <CardDescription>
                  Wähle das gewünschte Creative-Format
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="format">Format</Label>
                  <Select value={format} onValueChange={setFormat}>
                    <SelectTrigger id="format">
                      <SelectValue placeholder="Format auswählen" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="feed">Feed (1080×1080, 1:1)</SelectItem>
                      <SelectItem value="story">Story (1080×1920, 9:16)</SelectItem>
                      <SelectItem value="reel">Reel (1080×1920, 9:16)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {(format === "story" || format === "reel") && (
                  <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                    <p className="text-xs text-blue-800 font-medium mb-1">
                      ⚠️ Safe Zone beachten
                    </p>
                    <p className="text-xs text-blue-700">
                      {format === "story" 
                        ? "Story: Text wird automatisch in der mittleren 66% Zone platziert (Oben 14% und unten 20% sind für UI-Elemente reserviert)."
                        : "Reel: Text wird automatisch in der mittleren 45% Zone platziert (Oben 25% und unten 30% sind für UI-Elemente reserviert)."}
                    </p>
                  </div>
                )}
                
                <div className="space-y-2">
                  <Label htmlFor="batchCount">Anzahl Creatives</Label>
                  <Select value={batchCount.toString()} onValueChange={(v) => setBatchCount(parseInt(v))}>
                    <SelectTrigger id="batchCount">
                      <SelectValue placeholder="Anzahl auswählen" />
                    </SelectTrigger>
                    <SelectContent>
                      {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((count) => (
                        <SelectItem key={count} value={count.toString()}>
                          {count} Creative{count > 1 ? 's' : ''}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-muted-foreground">
                    Generiere mehrere Variationen gleichzeitig mit verschiedenen Headlines
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Step 4: Description (Optional) */}
            <Card>
              <CardHeader>
                <CardTitle>4. Beschreibung (Optional)</CardTitle>
                <CardDescription>
                  Beschreibe dein Angebot für bessere Creative-Generierung
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="description">Zusätzliche Beschreibung</Label>
                  <Textarea
                    id="description"
                    placeholder="Beschreibe dein Angebot, z.B. 'Mehr qualifizierte Leads für Marketing-Agenturen' oder 'Skalierbare Kundengewinnung für Coaches'"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    rows={4}
                  />
                </div>

                <Button 
                  onClick={handleGenerate} 
                  disabled={isGenerating || (!selectedCampaignId && !manualUrl)}
                  className="w-full"
                  size="lg"
                >
                  <Sparkles className="mr-2 h-4 w-4" />
                  {isGenerating ? "Generiere..." : "Creative generieren"}
                </Button>
              </CardContent>
            </Card>
          </div>

          <div className="space-y-6">
            {/* Winning Creatives */}
            {selectedCampaignId && winningCreativesData && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Trophy className="h-5 w-5 text-yellow-500" />
                    Top Performer
                  </CardTitle>
                  <CardDescription>
                    Beste Werbeanzeigen in dieser Kampagne
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {winningCreativesLoading ? (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Analysiere Performance...
                    </div>
                  ) : winningCreativesData.winners.length > 0 ? (
                    <div className="space-y-3">
                      {winningCreativesData.winners.slice(0, 3).map((winner, index) => (
                        <div key={winner.adId} className="flex items-start gap-3 p-3 bg-muted rounded-lg">
                          <div className="flex-shrink-0 w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs font-bold">
                            {index + 1}
                          </div>
                          {winner.imageUrl && (
                            <div className="flex-shrink-0">
                              <img 
                                src={winner.imageUrl} 
                                alt={winner.adName}
                                className="w-16 h-16 object-cover rounded border border-border"
                                onError={(e) => {
                                  // Hide image if loading fails
                                  e.currentTarget.style.display = 'none';
                                }}
                              />
                            </div>
                          )}
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium truncate">{winner.adName}</p>
                            <div className="flex flex-wrap gap-2 mt-1">
                              {winner.metrics.roasOrderVolume > 0 && (
                                <Badge variant="secondary" className="text-xs">
                                  ROAS: {winner.metrics.roasOrderVolume.toFixed(2)}x
                                </Badge>
                              )}
                              {winner.metrics.costPerLead > 0 && (
                                <Badge variant="secondary" className="text-xs">
                                  CPL: €{winner.metrics.costPerLead.toFixed(2)}
                                </Badge>
                              )}
                              <Badge variant="secondary" className="text-xs">
                                Score: {winner.score.toFixed(1)}
                              </Badge>
                            </div>
                          </div>
                        </div>
                      ))}
                      {winningCreativesData.insights && (
                        <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg mt-3">
                          <div className="flex items-start gap-2">
                            <TrendingUp className="h-4 w-4 text-blue-600 mt-0.5 flex-shrink-0" />
                            <p className="text-xs text-blue-800">
                              {winningCreativesData.insights}
                            </p>
                          </div>
                        </div>
                      )}
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground">
                      Keine Performance-Daten verfügbar
                    </p>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Preview */}
            <Card>
              <CardHeader>
                <CardTitle>Vorschau</CardTitle>
                <CardDescription>
                  Generiertes Creative
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-center bg-muted rounded-lg aspect-[3/4] min-h-[400px]">
                  {isGenerating ? (
                    <div className="flex flex-col items-center gap-3">
                      <Loader2 className="h-8 w-8 animate-spin text-primary" />
                      <p className="text-sm text-muted-foreground">Creative wird generiert...</p>
                    </div>
                  ) : generatedImageUrl ? (
                    <img 
                      src={generatedImageUrl} 
                      alt="Generated Creative" 
                      className="w-full h-full object-contain rounded-lg"
                    />
                  ) : (
                    <p className="text-muted-foreground">
                      Keine Vorschau verfügbar
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
