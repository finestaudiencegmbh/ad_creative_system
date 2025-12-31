import DashboardLayout from "@/components/DashboardLayout";
import { AnimatedBackground } from "@/components/AnimatedBackground";
import { Calendar, Loader2, ChevronDown, TrendingUp, TrendingDown } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { trpc } from "@/lib/trpc";
import { useState, useMemo } from "react";
import { startOfMonth, endOfMonth, subMonths, format } from "date-fns";
import { cn } from "@/lib/utils";
import { formatCurrency, formatRoas, formatNumber } from "@/lib/formatters";

type DateRangePreset = "today" | "yesterday" | "last7days" | "currentMonth" | "lastMonth" | "last90days" | "maximum" | "custom";

export default function Dashboard() {
  const [dateRange, setDateRange] = useState<DateRangePreset>("currentMonth");
  const [activeTab, setActiveTab] = useState<"active" | "inactive">("active");
  const [expandedCampaigns, setExpandedCampaigns] = useState<Set<string>>(new Set());

  // Calculate date range based on selection
  const { startDate, endDate, displayRange } = useMemo(() => {
    const now = new Date();
    const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    
    switch (dateRange) {
      case "today":
        return {
          startDate: now,
          endDate: now,
          displayRange: format(now, 'dd. MMM. yyyy')
        };
      case "yesterday":
        return {
          startDate: yesterday,
          endDate: yesterday,
          displayRange: format(yesterday, 'dd. MMM. yyyy')
        };
      case "last7days":
        const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        return {
          startDate: sevenDaysAgo,
          endDate: now,
          displayRange: `${format(sevenDaysAgo, 'dd. MMM. yyyy')} - ${format(now, 'dd. MMM. yyyy')}`
        };
      case "lastMonth":
        const lastMonth = subMonths(now, 1);
        return {
          startDate: startOfMonth(lastMonth),
          endDate: endOfMonth(lastMonth),
          displayRange: `${format(startOfMonth(lastMonth), 'dd. MMM. yyyy')} - ${format(endOfMonth(lastMonth), 'dd. MMM. yyyy')}`
        };
      case "last90days":
        const ninetyDaysAgo = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
        return {
          startDate: ninetyDaysAgo,
          endDate: now,
          displayRange: `${format(ninetyDaysAgo, 'dd. MMM. yyyy')} - ${format(now, 'dd. MMM. yyyy')}`
        };
      case "maximum":
        const oneYearAgo = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
        return {
          startDate: oneYearAgo,
          endDate: now,
          displayRange: `${format(oneYearAgo, 'dd. MMM. yyyy')} - ${format(now, 'dd. MMM. yyyy')}`
        };
      case "custom":
        // TODO: Implement custom date picker
        return {
          startDate: startOfMonth(now),
          endDate: endOfMonth(now),
          displayRange: `${format(startOfMonth(now), 'dd. MMM. yyyy')} - ${format(endOfMonth(now), 'dd. MMM. yyyy')}`
        };
      case "currentMonth":
      default:
        return {
          startDate: startOfMonth(now),
          endDate: endOfMonth(now),
          displayRange: `${format(startOfMonth(now), 'dd. MMM. yyyy')} - ${format(endOfMonth(now), 'dd. MMM. yyyy')}`
        };
    }
  }, [dateRange]);

  // Fetch campaigns from Meta API
  const { data: campaignsData, isLoading } = trpc.campaigns.list.useQuery({
    timeRange: {
      since: format(startDate, 'yyyy-MM-dd'),
      until: format(endDate, 'yyyy-MM-dd'),
    },
  });

  // Filter campaigns by status
  const activeCampaigns = campaignsData?.filter((c: any) => c.status === 'ACTIVE') || [];
  const inactiveCampaigns = campaignsData?.filter((c: any) => c.status !== 'ACTIVE') || [];
  const displayedCampaigns = activeTab === 'active' ? activeCampaigns : inactiveCampaigns;

  const toggleExpand = (campaignId: string) => {
    setExpandedCampaigns(prev => {
      const newSet = new Set(prev);
      if (newSet.has(campaignId)) {
        newSet.delete(campaignId);
      } else {
        newSet.add(campaignId);
      }
      return newSet;
    });
  };

  return (
    <DashboardLayout>
      <AnimatedBackground />
      
      <div className="relative z-10 space-y-8">
        <div className="space-y-6">
          <div>
            <h1 className="text-4xl font-bold tracking-tight mb-2">Dashboard</h1>
            <p className="text-lg text-muted-foreground">
              Übersicht über alle aktiven und inaktiven Kampagnen
            </p>
          </div>

          {/* Date Range Selector */}
          <div className="flex items-center justify-between p-6 bg-card/60 backdrop-blur-sm rounded-2xl border border-border shadow-sm transition-all duration-300 hover:shadow-lg hover:shadow-accent/20 hover:border-accent/50 hover:bg-card/80 hover:scale-[1.01] group cursor-pointer">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-accent/10 group-hover:bg-accent/20 transition-all duration-300 group-hover:scale-110">
                <Calendar className="w-5 h-5 text-muted-foreground group-hover:text-accent transition-colors duration-300" />
              </div>
              <div>
                <p className="text-sm font-medium group-hover:text-accent transition-colors duration-300">Zeitraum</p>
                <p className="text-sm text-muted-foreground group-hover:text-foreground transition-colors duration-300">
                  {displayRange}
                </p>
              </div>
            </div>
            <Select value={dateRange} onValueChange={(value) => setDateRange(value as DateRangePreset)}>
              <SelectTrigger className="w-48 hover:border-accent/50 hover:shadow-lg hover:shadow-accent/20 transition-all duration-300">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="today">Heute</SelectItem>
                <SelectItem value="yesterday">Gestern</SelectItem>
                <SelectItem value="last7days">Letzte 7 Tage</SelectItem>
                <SelectItem value="currentMonth">Aktueller Monat</SelectItem>
                <SelectItem value="lastMonth">Letzter Monat</SelectItem>
                <SelectItem value="last90days">Letzte 90 Tage</SelectItem>
                <SelectItem value="maximum">Maximum</SelectItem>
                <SelectItem value="custom">Benutzerdefiniert</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Metrics Summary Cards */}
          {!isLoading && campaignsData && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Gesamt-Ausgaben Card */}
              <div className="group relative bg-gradient-to-br from-white/5 to-white/[0.02] backdrop-blur-xl rounded-2xl border border-white/10 overflow-hidden transition-all duration-500 hover:shadow-[0_0_30px_rgba(95,47,175,0.15)] hover:border-[#5f2faf]/30 hover:scale-[1.02]">
                <div className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <p className="text-sm font-medium text-muted-foreground uppercase tracking-wide">Gesamt-Ausgaben</p>
                    <div className="p-2 rounded-lg bg-accent/10 group-hover:bg-accent/20 transition-all duration-300">
                      <TrendingUp className="w-4 h-4 text-accent" />
                    </div>
                  </div>
                  <p className="text-3xl font-bold mb-2">
                    {formatCurrency(campaignsData.reduce((sum: number, c: any) => sum + (c.spend || 0), 0))}
                  </p>
                  <div className="h-1 bg-muted rounded-full overflow-hidden">
                    <div className="h-full bg-accent/60 rounded-full" style={{ width: '75%' }} />
                  </div>
                </div>
              </div>

              {/* Gesamt-ROAS Card */}
              <div className="group relative bg-gradient-to-br from-white/5 to-white/[0.02] backdrop-blur-xl rounded-2xl border border-white/10 overflow-hidden transition-all duration-500 hover:shadow-[0_0_30px_rgba(95,47,175,0.15)] hover:border-[#5f2faf]/30 hover:scale-[1.02]">
                <div className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <p className="text-sm font-medium text-muted-foreground uppercase tracking-wide">Durchschnittlicher ROAS</p>
                    <div className="p-2 rounded-lg bg-green-500/10 group-hover:bg-green-500/20 transition-all duration-300">
                      <TrendingUp className="w-4 h-4 text-green-500" />
                    </div>
                  </div>
                  <p className="text-3xl font-bold mb-2 text-green-600">
                    {(() => {
                      const totalRoas = campaignsData.reduce((sum: number, c: any) => sum + (c.roasOrderVolume || 0), 0);
                      const avgRoas = campaignsData.length > 0 ? totalRoas / campaignsData.length : 0;
                      return avgRoas > 0 ? formatRoas(avgRoas) : '-';
                    })()}
                  </p>
                  <div className="flex items-center gap-1 text-xs text-green-600">
                    <div className="w-2 h-2 rounded-full bg-green-600 animate-pulse" />
                    Profitable
                  </div>
                </div>
              </div>

              {/* Gesamt-Leads Card */}
              <div className="group relative bg-gradient-to-br from-white/5 to-white/[0.02] backdrop-blur-xl rounded-2xl border border-white/10 overflow-hidden transition-all duration-500 hover:shadow-[0_0_30px_rgba(95,47,175,0.15)] hover:border-[#5f2faf]/30 hover:scale-[1.02]">
                <div className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <p className="text-sm font-medium text-muted-foreground uppercase tracking-wide">Gesamt-Leads</p>
                    <div className="p-2 rounded-lg bg-blue-500/10 group-hover:bg-blue-500/20 transition-all duration-300">
                      <TrendingUp className="w-4 h-4 text-blue-500" />
                    </div>
                  </div>
                  <p className="text-3xl font-bold mb-2">
                    {formatNumber(campaignsData.reduce((sum: number, c: any) => sum + (c.leads || 0), 0), 0)}
                  </p>
                  <div className="h-1 bg-muted rounded-full overflow-hidden">
                    <div className="h-full bg-blue-500/60 rounded-full" style={{ width: '60%' }} />
                  </div>
                </div>
              </div>
            </div>
          )}
          
          {/* Campaign Tabs */}
          <div className="flex items-center justify-between">
            <div className="inline-flex p-1 bg-card/50 rounded-xl backdrop-blur-sm border border-border">
              <button
                onClick={() => setActiveTab("active")}
                className={cn(
                  "px-4 py-2 text-sm font-medium rounded-lg transition-all duration-300 relative overflow-hidden",
                  activeTab === "active"
                    ? "bg-accent text-white shadow-lg shadow-accent/30 scale-105"
                    : "text-muted-foreground hover:text-foreground hover:bg-card/80 hover:shadow-md hover:scale-105",
                )}
              >
                {activeTab === "active" && (
                  <div className="absolute inset-0 bg-gradient-to-r from-accent/20 to-accent/10 rounded-lg" />
                )}
                <span className="relative">Aktive Kampagnen ({activeCampaigns.length})</span>
              </button>
              <button
                onClick={() => setActiveTab("inactive")}
                className={cn(
                  "px-4 py-2 text-sm font-medium rounded-lg transition-all duration-300 relative overflow-hidden",
                  activeTab === "inactive"
                    ? "bg-accent text-white shadow-lg shadow-accent/30 scale-105"
                    : "text-muted-foreground hover:text-foreground hover:bg-card/80 hover:shadow-md hover:scale-105",
                )}
              >
                {activeTab === "inactive" && (
                  <div className="absolute inset-0 bg-gradient-to-r from-accent/20 to-accent/10 rounded-lg" />
                )}
                <span className="relative">Inaktive Kampagnen ({inactiveCampaigns.length})</span>
              </button>
            </div>
          </div>

          {/* Campaign List */}
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-accent" />
            </div>
          ) : displayedCampaigns.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-muted-foreground">Keine Kampagnen gefunden</p>
            </div>
          ) : (
            <div className="space-y-4">
              {displayedCampaigns.map((campaign: any) => {
                const isExpanded = expandedCampaigns.has(campaign.id);
                const spend = campaign.spend || 0;
                const roas = campaign.roasOrderVolume || 0;
                const leads = campaign.leads || 0;
                const costPerLead = campaign.costPerLead || 0;
                const hasLeadCorrection = campaign.hasLeadCorrection || false;
                
                // Calculate progress (0-100) based on spend
                const progress = Math.min(100, (spend / 10000) * 100);

                return (
                  <div
                    key={campaign.id}
                    className={cn(
                      "group relative bg-card/60 backdrop-blur-xl rounded-2xl border overflow-hidden transition-all duration-500",
                      "hover:shadow-[0_8px_30px_rgba(95,47,175,0.25)] hover:scale-[1.01]",
                      isExpanded
                        ? "border-accent/60 shadow-[0_0_40px_rgba(95,47,175,0.3)]"
                        : "border-border shadow-sm hover:border-accent/40",
                    )}
                  >
                    <div
                      className={cn(
                        "absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none",
                        "bg-gradient-to-br from-accent/[0.08] via-transparent to-transparent",
                      )}
                    />

                    {/* Campaign Header */}
                    <button
                      onClick={() => toggleExpand(campaign.id)}
                      className="relative w-full p-6 flex items-center justify-between text-left"
                    >
                      <div className="flex-1 space-y-2">
                        <div className="flex items-center gap-3">
                          <h3 className="text-lg font-semibold group-hover:text-accent transition-colors">{campaign.name}</h3>
                          <Badge
                            variant="secondary"
                            className={cn(
                              "bg-accent/10 text-accent border-accent/30 font-medium px-3 py-1",
                              "shadow-[0_0_20px_rgba(95,47,175,0.15)]",
                            )}
                          >
                            {campaign.status}
                          </Badge>
                          {roas > 1 ? (
                            <TrendingUp className="w-4 h-4 text-green-600" />
                          ) : (
                            <TrendingDown className="w-4 h-4 text-red-600" />
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground">Kampagnen-ID: {campaign.id}</p>
                      </div>
                      <ChevronDown
                        className={cn(
                          "w-5 h-5 text-muted-foreground group-hover:text-accent transition-all duration-300",
                          isExpanded && "rotate-180",
                        )}
                      />
                    </button>

                    {/* Campaign Metrics */}
                    <div className="relative px-6 pb-6 grid grid-cols-2 lg:grid-cols-4 gap-6">
                      <div className="space-y-2">
                        <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide">Ausgaben</p>
                        <p className="text-2xl font-semibold">{formatCurrency(spend)}</p>
                        <div className="h-1 bg-muted rounded-full overflow-hidden">
                          <div className="h-full bg-accent/60 rounded-full" style={{ width: `${progress}%` }} />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide">ROAS</p>
                        <p
                          className={cn(
                            "text-2xl font-semibold",
                            roas > 1 ? "text-green-600" : "text-muted-foreground",
                          )}
                        >
                          {roas > 0 ? formatRoas(roas) : "-"}
                        </p>
                        {roas > 1 && (
                          <div className="flex items-center gap-1 text-xs text-green-600">
                            <div className="w-2 h-2 rounded-full bg-green-600 animate-pulse" />
                            Profitable
                          </div>
                        )}
                      </div>
                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide">Leads</p>
                          {hasLeadCorrection && (
                            <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-100 text-amber-700 border border-amber-200">
                              Korrigiert
                            </span>
                          )}
                        </div>
                        <p className="text-2xl font-semibold">{formatNumber(leads, 0)}</p>
                        <div className="h-1 bg-muted rounded-full overflow-hidden">
                          <div className="h-full bg-blue-500/60 rounded-full" style={{ width: `${Math.min(100, (leads / 500) * 100)}%` }} />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide">Kosten/Lead</p>
                        <p className="text-2xl font-semibold">{formatCurrency(costPerLead)}</p>
                        <div className="h-1 bg-muted rounded-full overflow-hidden">
                          <div
                            className="h-full bg-green-500/60 rounded-full"
                            style={{ width: `${Math.max(0, 100 - (costPerLead / 50) * 100)}%` }}
                          />
                        </div>
                      </div>
                    </div>

                    <div
                      className={cn(
                        "overflow-hidden transition-all duration-500",
                        isExpanded ? "max-h-96 opacity-100" : "max-h-0 opacity-0",
                      )}
                    >
                      <div className="px-6 pb-6 pt-4 border-t border-border/50">
                        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 text-sm">
                          <div>
                            <p className="text-muted-foreground">Impressions</p>
                            <p className="font-semibold">{campaign.impressions?.toLocaleString() || 0}</p>
                          </div>
                          <div>
                            <p className="text-muted-foreground">CPM</p>
                            <p className="font-semibold">€{campaign.cpm?.toFixed(2) || 0}</p>
                          </div>
                          <div>
                            <p className="text-muted-foreground">Outbound CTR</p>
                            <p className="font-semibold">{campaign.outboundCtr?.toFixed(2) || 0}%</p>
                          </div>
                          <div>
                            <p className="text-muted-foreground">Conversion Rate</p>
                            <p className="font-semibold">{campaign.conversionRate?.toFixed(2) || 0}%</p>
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
    </DashboardLayout>
  );
}
