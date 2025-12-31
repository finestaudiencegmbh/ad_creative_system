import DashboardLayout from "@/components/DashboardLayout";
import { AnimatedBackground } from "@/components/AnimatedBackground";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { RefreshCw, TrendingUp, TrendingDown, ChevronDown } from "lucide-react";
import { toast } from "sonner";
import { trpc } from "@/lib/trpc";
import { useState, useEffect } from "react";
import { startOfMonth, endOfMonth, format as formatDate } from "date-fns";
import { cn } from "@/lib/utils";

export default function Performance() {
  const [selectedCampaignId, setSelectedCampaignId] = useState<string>("all");
  const [selectedAdSetId, setSelectedAdSetId] = useState<string>("all");
  const [expandedPerformers, setExpandedPerformers] = useState<Set<string>>(new Set());
  const [expandedFlops, setExpandedFlops] = useState<Set<string>>(new Set());

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

  const toggleExpandPerformer = (id: string) => {
    setExpandedPerformers(prev => {
      const newSet = new Set(prev);
      if (newSet.has(id)) {
        newSet.delete(id);
      } else {
        newSet.add(id);
      }
      return newSet;
    });
  };

  const toggleExpandFlop = (id: string) => {
    setExpandedFlops(prev => {
      const newSet = new Set(prev);
      if (newSet.has(id)) {
        newSet.delete(id);
      } else {
        newSet.add(id);
      }
      return newSet;
    });
  };

  return (
    <DashboardLayout>
      <AnimatedBackground />
      
      <div className="relative z-10 space-y-8">
        <div className="space-y-6">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <h1 className="text-4xl font-bold tracking-tight mb-2">Performance</h1>
              <p className="text-lg text-muted-foreground">
                Sieh auf einen Blick, welche Creatives am besten performen und welche optimiert werden sollten.
              </p>
            </div>
            <Button 
              onClick={handleRefresh} 
              disabled={performanceLoading} 
              className="w-full sm:w-auto bg-gradient-to-r from-accent via-accent/90 to-accent/80 hover:shadow-lg hover:shadow-accent/40 transition-all duration-300"
            >
              <RefreshCw className={`mr-2 h-4 w-4 ${performanceLoading ? 'animate-spin' : ''}`} />
              Aktualisieren
            </Button>
          </div>

          {/* Filters */}
          <div className="p-6 bg-card/60 backdrop-blur-sm rounded-2xl border border-border shadow-sm">
            <h3 className="text-lg font-semibold mb-4">Filter</h3>
            <div className="grid gap-4 sm:grid-cols-1 md:grid-cols-2">
              {/* Campaign Filter */}
              <div className="space-y-2">
                <label className="text-sm font-medium">Kampagne</label>
                <Select value={selectedCampaignId} onValueChange={setSelectedCampaignId}>
                  <SelectTrigger className="hover:border-accent/50 hover:shadow-lg hover:shadow-accent/20 transition-all duration-300">
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

              {/* Ad Set Filter */}
              {selectedCampaignId !== "all" && (
                <div className="space-y-2">
                  <label className="text-sm font-medium">Anzeigengruppe (Optional)</label>
                  <Select 
                    value={selectedAdSetId} 
                    onValueChange={setSelectedAdSetId}
                    disabled={adSetsLoading}
                  >
                    <SelectTrigger className="hover:border-accent/50 hover:shadow-lg hover:shadow-accent/20 transition-all duration-300">
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
          </div>

          {/* Top Performers & Flops */}
          <div className="grid gap-6 md:grid-cols-1 lg:grid-cols-2">
            {/* Top Performers */}
            <div className="space-y-4">
              <div className="flex items-center gap-2 mb-4">
                <TrendingUp className="h-6 w-6 text-green-500" />
                <h2 className="text-2xl font-bold">Top 3 Performer</h2>
              </div>
              <p className="text-sm text-muted-foreground mb-4">Diese Creatives performen am besten</p>
              
              {performanceLoading ? (
                <div className="text-center py-12 text-muted-foreground">Lade Daten...</div>
              ) : topPerformers.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">Keine Daten verfügbar</div>
              ) : (
                <div className="space-y-4">
                  {topPerformers.map((creative, index) => {
                    const isExpanded = expandedPerformers.has(creative.id);
                    return (
                      <div
                        key={creative.id}
                        className={cn(
                          "group relative bg-card/60 backdrop-blur-xl rounded-2xl border overflow-hidden transition-all duration-500",
                          "hover:shadow-[0_8px_30px_rgba(34,197,94,0.25)] hover:scale-[1.01]",
                          isExpanded
                            ? "border-green-500/60 shadow-[0_0_40px_rgba(34,197,94,0.3)]"
                            : "border-border shadow-sm hover:border-green-500/40",
                        )}
                      >
                        <button
                          onClick={() => toggleExpandPerformer(creative.id)}
                          className="relative w-full p-6 flex items-center gap-4 text-left"
                        >
                          {creative.imageUrl && (
                            <img 
                              src={creative.imageUrl} 
                              alt={creative.name}
                              className="w-20 h-20 object-cover rounded-xl flex-shrink-0 shadow-lg"
                              onError={(e) => {
                                (e.target as HTMLImageElement).style.display = 'none';
                              }}
                            />
                          )}
                          <div className="flex-1 space-y-2">
                            <p className="font-semibold text-lg group-hover:text-green-500 transition-colors">{creative.name}</p>
                            <div className="flex gap-4 text-sm">
                              {creative.roas > 0 && (
                                <span className="font-semibold text-green-600">ROAS: {creative.roas.toFixed(2)}x</span>
                              )}
                              <span className="text-muted-foreground">CPL: €{creative.cpl.toFixed(2)}</span>
                            </div>
                          </div>
                          <div className="text-3xl font-bold text-green-500 flex-shrink-0">#{index + 1}</div>
                          <ChevronDown
                            className={cn(
                              "w-5 h-5 text-muted-foreground group-hover:text-green-500 transition-all duration-300",
                              isExpanded && "rotate-180",
                            )}
                          />
                        </button>

                        <div
                          className={cn(
                            "overflow-hidden transition-all duration-500",
                            isExpanded ? "max-h-96 opacity-100" : "max-h-0 opacity-0",
                          )}
                        >
                          <div className="px-6 pb-6 pt-4 border-t border-border/50">
                            <div className="grid grid-cols-2 gap-4 text-sm">
                              <div>
                                <p className="text-muted-foreground">CTR</p>
                                <p className="font-semibold">{creative.ctr.toFixed(2)}%</p>
                              </div>
                              <div>
                                <p className="text-muted-foreground">Spend</p>
                                <p className="font-semibold">€{creative.spend.toFixed(2)}</p>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Top Flops */}
            <div className="space-y-4">
              <div className="flex items-center gap-2 mb-4">
                <TrendingDown className="h-6 w-6 text-red-500" />
                <h2 className="text-2xl font-bold">Top 3 Flops</h2>
              </div>
              <p className="text-sm text-muted-foreground mb-4">Diese Creatives sollten optimiert werden</p>
              
              {performanceLoading ? (
                <div className="text-center py-12 text-muted-foreground">Lade Daten...</div>
              ) : topFlops.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">Keine Daten verfügbar</div>
              ) : (
                <div className="space-y-4">
                  {topFlops.map((creative, index) => {
                    const isExpanded = expandedFlops.has(creative.id);
                    return (
                      <div
                        key={creative.id}
                        className={cn(
                          "group relative bg-card/60 backdrop-blur-xl rounded-2xl border overflow-hidden transition-all duration-500",
                          "hover:shadow-[0_8px_30px_rgba(239,68,68,0.25)] hover:scale-[1.01]",
                          isExpanded
                            ? "border-red-500/60 shadow-[0_0_40px_rgba(239,68,68,0.3)]"
                            : "border-border shadow-sm hover:border-red-500/40",
                        )}
                      >
                        <button
                          onClick={() => toggleExpandFlop(creative.id)}
                          className="relative w-full p-6 flex items-center gap-4 text-left"
                        >
                          {creative.imageUrl && (
                            <img 
                              src={creative.imageUrl} 
                              alt={creative.name}
                              className="w-20 h-20 object-cover rounded-xl flex-shrink-0 shadow-lg"
                              onError={(e) => {
                                (e.target as HTMLImageElement).style.display = 'none';
                              }}
                            />
                          )}
                          <div className="flex-1 space-y-2">
                            <p className="font-semibold text-lg group-hover:text-red-500 transition-colors">{creative.name}</p>
                            <div className="flex gap-4 text-sm">
                              {creative.roas > 0 && (
                                <span className="font-semibold text-green-600">ROAS: {creative.roas.toFixed(2)}x</span>
                              )}
                              <span className="text-muted-foreground">CPL: €{creative.cpl.toFixed(2)}</span>
                            </div>
                          </div>
                          <div className="text-3xl font-bold text-red-500 flex-shrink-0">#{index + 1}</div>
                          <ChevronDown
                            className={cn(
                              "w-5 h-5 text-muted-foreground group-hover:text-red-500 transition-all duration-300",
                              isExpanded && "rotate-180",
                            )}
                          />
                        </button>

                        <div
                          className={cn(
                            "overflow-hidden transition-all duration-500",
                            isExpanded ? "max-h-96 opacity-100" : "max-h-0 opacity-0",
                          )}
                        >
                          <div className="px-6 pb-6 pt-4 border-t border-border/50">
                            <div className="grid grid-cols-2 gap-4 text-sm">
                              <div>
                                <p className="text-muted-foreground">CTR</p>
                                <p className="font-semibold">{creative.ctr.toFixed(2)}%</p>
                              </div>
                              <div>
                                <p className="text-muted-foreground">Spend</p>
                                <p className="font-semibold">€{creative.spend.toFixed(2)}</p>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* Campaign Overview */}
          <div className="space-y-4">
            <h2 className="text-2xl font-bold">Kampagnen-Übersicht</h2>
            <p className="text-sm text-muted-foreground">
              {selectedCampaignId === "all" 
                ? "Performance-Daten deiner aktiven Kampagnen" 
                : "Performance-Daten der ausgewählten Kampagne"}
            </p>
            
            {performanceLoading ? (
              <div className="text-center py-12 text-muted-foreground">Lade Daten...</div>
            ) : campaignOverview.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">Keine Kampagnen-Daten verfügbar</div>
            ) : (
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {campaignOverview.map((campaign: any) => (
                  <div 
                    key={campaign.id} 
                    className="group relative bg-gradient-to-br from-white/5 to-white/[0.02] backdrop-blur-xl rounded-2xl border border-white/10 overflow-hidden transition-all duration-500 hover:shadow-[0_0_30px_rgba(95,47,175,0.15)] hover:border-[#5f2faf]/30 hover:scale-[1.02] p-6"
                  >
                    <h3 className="font-semibold text-lg mb-4 group-hover:text-accent transition-colors">{campaign.name}</h3>
                    <div className="space-y-3 text-sm">
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
                        <span className="font-medium">€{campaign.spend.toFixed(2)}</span>
                      </div>
                      {campaign.roas > 0 && (
                        <div className="flex justify-between pt-2 border-t border-border/50">
                          <span className="text-muted-foreground">ROAS</span>
                          <span className="font-semibold text-green-600">{campaign.roas.toFixed(2)}x</span>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
