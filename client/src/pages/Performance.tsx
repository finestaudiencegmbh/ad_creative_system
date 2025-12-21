import DashboardLayout from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { RefreshCw, TrendingUp, TrendingDown } from "lucide-react";
import { toast } from "sonner";
import { trpc } from "@/lib/trpc";
import { useState, useEffect } from "react";
import { startOfMonth, endOfMonth, format as formatDate } from "date-fns";

export default function Performance() {
  const [selectedCampaignId, setSelectedCampaignId] = useState<string>("all");
  const [selectedAdSetId, setSelectedAdSetId] = useState<string>("all");

  // Fetch campaigns
  const now = new Date();
  const startDate = startOfMonth(now);
  const endDate = endOfMonth(now);

  const { data: campaignsData, isLoading: campaignsLoading, refetch } = trpc.campaigns.list.useQuery({
    timeRange: {
      since: formatDate(startDate, 'yyyy-MM-dd'),
      until: formatDate(endDate, 'yyyy-MM-dd'),
    },
  });

  // Fetch ad sets when campaign is selected
  const { data: adSetsData, isLoading: adSetsLoading } = trpc.campaigns.getAdSets.useQuery(
    { campaignId: selectedCampaignId },
    { enabled: selectedCampaignId !== "all" }
  );

  // Fetch performance data based on filters
  const { data: performanceData, isLoading: performanceLoading } = trpc.campaigns.getPerformanceData.useQuery({
    campaignId: selectedCampaignId === "all" ? undefined : selectedCampaignId,
    adSetId: selectedAdSetId === "all" ? undefined : selectedAdSetId,
    timeRange: {
      since: formatDate(startDate, 'yyyy-MM-dd'),
      until: formatDate(endDate, 'yyyy-MM-dd'),
    },
  });

  // Reset ad set selection when campaign changes
  useEffect(() => {
    setSelectedAdSetId("all");
  }, [selectedCampaignId]);

  const handleRefresh = async () => {
    toast.info("Performance-Daten werden aktualisiert...");
    await refetch();
  };

  const activeCampaigns = campaignsData?.filter((c: any) => c.status === 'ACTIVE') || [];
  const activeAdSets = adSetsData?.filter(a => a.status === 'ACTIVE') || [];

  const topPerformers = performanceData?.topPerformers || [];
  const topFlops = performanceData?.topFlops || [];
  const campaignOverview = performanceData?.campaignOverview || [];

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Performance</h1>
            <p className="text-muted-foreground mt-2">
              Sieh auf einen Blick, welche Creatives am besten performen und welche optimiert werden sollten.
            </p>
          </div>
          <Button onClick={handleRefresh} disabled={performanceLoading}>
            <RefreshCw className={`mr-2 h-4 w-4 ${performanceLoading ? 'animate-spin' : ''}`} />
            Aktualisieren
          </Button>
        </div>

        {/* Filters */}
        <Card>
          <CardHeader>
            <CardTitle>Filter</CardTitle>
            <CardDescription>Filtere Performance-Daten nach Kampagne und Anzeigengruppe</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-2">
              {/* Campaign Filter */}
              <div className="space-y-2">
                <label className="text-sm font-medium">Kampagne</label>
                <Select value={selectedCampaignId} onValueChange={setSelectedCampaignId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Kampagne auswählen" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Alle Kampagnen</SelectItem>
                    {activeCampaigns.map((campaign) => (
                      <SelectItem key={campaign.id} value={campaign.id}>
                        {campaign.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Ad Set Filter (only visible when campaign is selected) */}
              {selectedCampaignId !== "all" && (
                <div className="space-y-2">
                  <label className="text-sm font-medium">Anzeigengruppe (Optional)</label>
                  <Select 
                    value={selectedAdSetId} 
                    onValueChange={setSelectedAdSetId}
                    disabled={adSetsLoading}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Anzeigengruppe auswählen" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Alle Anzeigengruppen</SelectItem>
                      {activeAdSets.map((adSet) => (
                        <SelectItem key={adSet.id} value={adSet.id}>
                          {adSet.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Top Performers & Flops */}
        <div className="grid gap-6 lg:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-green-500" />
                Top 3 Performer
              </CardTitle>
              <CardDescription>Diese Creatives performen am besten</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {performanceLoading ? (
                <div className="text-center py-8 text-muted-foreground">Lade Daten...</div>
              ) : topPerformers.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">Keine Daten verfügbar</div>
              ) : (
                topPerformers.map((creative, index) => (
                  <div key={creative.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-accent/50 transition-colors">
                    <div className="space-y-1">
                      <p className="font-medium">{creative.name}</p>
                      <div className="flex gap-4 text-sm text-muted-foreground">
                        {creative.roas > 0 && (
                          <span className="font-semibold text-green-600">ROAS: {creative.roas.toFixed(2)}x</span>
                        )}
                        <span>CPL: {creative.cpl.toFixed(2)}€</span>
                        <span>CTR: {creative.ctr.toFixed(2)}%</span>
                        <span>Spend: {creative.spend.toFixed(2)}€</span>
                      </div>
                    </div>
                    <div className="text-2xl font-bold text-green-500">#{index + 1}</div>
                  </div>
                ))
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingDown className="h-5 w-5 text-red-500" />
                Top 3 Flops
              </CardTitle>
              <CardDescription>Diese Creatives sollten optimiert werden</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {performanceLoading ? (
                <div className="text-center py-8 text-muted-foreground">Lade Daten...</div>
              ) : topFlops.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">Keine Daten verfügbar</div>
              ) : (
                topFlops.map((creative, index) => (
                  <div key={creative.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-accent/50 transition-colors">
                    <div className="space-y-1">
                      <p className="font-medium">{creative.name}</p>
                      <div className="flex gap-4 text-sm text-muted-foreground">
                        {creative.roas > 0 && (
                          <span className="font-semibold text-green-600">ROAS: {creative.roas.toFixed(2)}x</span>
                        )}
                        <span>CPL: {creative.cpl.toFixed(2)}€</span>
                        <span>CTR: {creative.ctr.toFixed(2)}%</span>
                        <span>Spend: {creative.spend.toFixed(2)}€</span>
                      </div>
                    </div>
                    <div className="text-2xl font-bold text-red-500">#{index + 1}</div>
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </div>

        {/* Campaign Overview */}
        <Card>
          <CardHeader>
            <CardTitle>Kampagnen-Übersicht</CardTitle>
            <CardDescription>
              {selectedCampaignId === "all" 
                ? "Performance-Daten deiner aktiven Kampagnen" 
                : "Performance-Daten der ausgewählten Kampagne"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {performanceLoading ? (
              <div className="text-center py-8 text-muted-foreground">Lade Daten...</div>
            ) : campaignOverview.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">Keine Kampagnen-Daten verfügbar</div>
            ) : (
              <div className="grid gap-4 md:grid-cols-3">
                {campaignOverview.map((campaign: any) => (
                  <div key={campaign.id} className="space-y-2 p-4 border rounded-lg">
                    <h3 className="font-semibold">{campaign.name}</h3>
                    <div className="space-y-1 text-sm">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Impressions</span>
                        <span className="font-medium">{campaign.impressions.toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Clicks</span>
                        <span className="font-medium">{campaign.clicks.toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">CTR</span>
                        <span className="font-medium">{campaign.ctr.toFixed(2)}%</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Spend</span>
                        <span className="font-medium">{campaign.spend.toFixed(2)}€</span>
                      </div>
                      {campaign.roas > 0 && (
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">ROAS</span>
                          <span className="font-medium text-green-600">{campaign.roas.toFixed(2)}x</span>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
