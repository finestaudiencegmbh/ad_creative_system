import DashboardLayout from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { trpc } from "@/lib/trpc";
import { ArrowRight, Calendar, Loader2, Plus, ChevronDown, ChevronUp, TrendingUp, TrendingDown } from "lucide-react";
import { useLocation } from "wouter";
import { useState, useMemo } from "react";
import { startOfMonth, endOfMonth, startOfDay, endOfDay, subDays, subMonths, startOfQuarter, endOfQuarter, format } from "date-fns";
import { de } from "date-fns/locale";
import { AddSaleDialog } from "@/components/AddSaleDialog";
import { SalesListDialog } from "@/components/SalesListDialog";
import { EditLeadCountDialog } from "@/components/EditLeadCountDialog";
import { DateRangePicker } from "@/components/DateRangePicker";
import { DateRange as DateRangeValue } from "react-day-picker";
import { cn } from "@/lib/utils";

type DateRangePreset = "today" | "last7days" | "lastMonth" | "currentMonth" | "lastQuarter" | "custom";

export default function Dashboard() {
  const [, setLocation] = useLocation();
  const [dateRange, setDateRange] = useState<DateRangePreset>("currentMonth");
  const [activeTab, setActiveTab] = useState<"active" | "inactive">("active");
  const [saleDialogOpen, setSaleDialogOpen] = useState(false);
  const [salesListDialogOpen, setSalesListDialogOpen] = useState(false);
  const [leadDialogOpen, setLeadDialogOpen] = useState(false);
  const [selectedCampaign, setSelectedCampaign] = useState<{ id: string; name: string; leads: number; leadsFromMeta: number } | null>(null);
  const [expandedCampaigns, setExpandedCampaigns] = useState<Set<string>>(new Set());
  const [customDateRange, setCustomDateRange] = useState<DateRangeValue | undefined>();
  
  // Calculate date range based on selection
  const { startDate, endDate, datePreset } = useMemo(() => {
    const now = new Date();
    
    switch (dateRange) {
      case "today":
        return {
          startDate: startOfDay(now),
          endDate: endOfDay(now),
          datePreset: "today" as const
        };
      case "last7days":
        return {
          startDate: subDays(now, 7),
          endDate: now,
          datePreset: "last_7d" as const
        };
      case "lastMonth":
        const lastMonth = subMonths(now, 1);
        return {
          startDate: startOfMonth(lastMonth),
          endDate: endOfMonth(lastMonth),
          datePreset: "last_30d" as const
        };
      case "currentMonth":
        return {
          startDate: startOfMonth(now),
          endDate: endOfMonth(now),
          datePreset: "this_month" as const
        };
      case "lastQuarter":
        const lastQuarter = subMonths(now, 3);
        return {
          startDate: startOfQuarter(lastQuarter),
          endDate: endOfQuarter(lastQuarter),
          datePreset: "last_90d" as const
        };
      case "custom":
        if (customDateRange?.from && customDateRange?.to) {
          return {
            startDate: customDateRange.from,
            endDate: customDateRange.to,
            datePreset: "last_90d" as const // Use closest preset for API
          };
        }
        // Fallback to current month if custom range not set
        return {
          startDate: startOfMonth(now),
          endDate: endOfMonth(now),
          datePreset: "this_month" as const
        };
      default:
        return {
          startDate: startOfMonth(now),
          endDate: endOfMonth(now),
          datePreset: "this_month" as const
        };
    }
  }, [dateRange, customDateRange]);

  // Fetch real campaign data from Meta API
  const { data: allCampaigns, isLoading, error } = trpc.campaigns.list.useQuery({
    datePreset,
  });

  // Filter campaigns by status
  const activeCampaigns = useMemo(() => {
    return allCampaigns?.filter(c => c.status === 'ACTIVE') || [];
  }, [allCampaigns]);

  const inactiveCampaigns = useMemo(() => {
    return allCampaigns?.filter(c => c.status !== 'ACTIVE') || [];
  }, [allCampaigns]);

  const dateRangeLabel = useMemo(() => {
    return `${format(startDate, 'dd. MMM yyyy', { locale: de })} - ${format(endDate, 'dd. MMM yyyy', { locale: de })}`;
  }, [startDate, endDate]);

  const toggleCampaignExpanded = (campaignId: string, e: React.MouseEvent) => {
    e.stopPropagation();
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

  const renderCampaignCards = (campaigns: typeof allCampaigns) => {
    if (!campaigns || campaigns.length === 0) {
      return (
        <Card className="bg-card/60 backdrop-blur-sm">
          <CardHeader>
            <CardTitle>Keine Kampagnen gefunden</CardTitle>
            <CardDescription>
              Es wurden keine Kampagnen für den gewählten Zeitraum gefunden.
            </CardDescription>
          </CardHeader>
        </Card>
      );
    }

    return (
      <div className="space-y-4">
        {campaigns.map((campaign) => {
          const isExpanded = expandedCampaigns.has(campaign.id);
          const hasPositiveROAS = campaign.roasOrderVolume > 0;
          const trend = campaign.spend > 1000 ? "up" : "down"; // Simple trend logic
          const progress = Math.min((campaign.spend / 10000) * 100, 100); // Progress based on spend
          
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
                onClick={(e) => toggleCampaignExpanded(campaign.id, e)}
                className="relative w-full p-6 flex items-center justify-between text-left"
              >
                <div className="flex-1 space-y-2">
                  <div className="flex items-center gap-3 flex-wrap">
                    <h3 className="text-lg font-semibold group-hover:text-accent transition-colors">{campaign.name}</h3>
                    <Badge
                      variant="secondary"
                      className={cn(
                        "bg-accent/10 text-accent border-accent/30 font-medium px-3 py-1",
                        "shadow-[0_0_20px_rgba(95,47,175,0.15)]",
                      )}
                    >
                      {campaign.status === 'ACTIVE' ? 'Aktiv' : campaign.status === 'PAUSED' ? 'Pausiert' : 'Archiviert'}
                    </Badge>
                    {trend === "up" ? (
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
                {/* Ausgaben */}
                <div className="space-y-2">
                  <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide">Ausgaben</p>
                  <p className="text-2xl font-semibold">
                    €{campaign.spend.toLocaleString('de-DE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </p>
                  <div className="h-1 bg-muted rounded-full overflow-hidden">
                    <div className="h-full bg-accent/60 rounded-full transition-all duration-500" style={{ width: `${progress}%` }} />
                  </div>
                </div>

                {/* Leads */}
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide">Leads</p>
                    {campaign.hasLeadCorrection && (
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-400 border border-amber-500/30">
                        Korrigiert
                      </span>
                    )}
                  </div>                 <p
                    className={cn(
                      "text-2xl font-semibold",
                      hasPositiveROAS ? "text-green-600" : "text-muted-foreground",
                    )}
                  >
                    {hasPositiveROAS ? campaign.roasOrderVolume.toFixed(2) + 'x' : '-'}
                  </p>
                  {hasPositiveROAS && (
                    <div className="flex items-center gap-1 text-xs text-green-600">
                      <div className="w-2 h-2 rounded-full bg-green-600 animate-pulse" />
                      Profitable
                    </div>
                  )}
                </div>

                {/* Leads */}
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide">Leads</p>
                    {campaign.hasLeadCorrection && (
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-100 text-amber-700 border border-amber-200">
                        Korrigiert
                      </span>
                    )}
                  </div>
                  <p className="text-2xl font-semibold">{campaign.leads}</p>
                  <div className="h-1 bg-muted rounded-full overflow-hidden">
                    <div className="h-full bg-blue-500/60 rounded-full transition-all duration-500" style={{ width: `${Math.min(campaign.leads / 100 * 100, 100)}%` }} />
                  </div>
                </div>

                {/* Kosten pro Lead */}
                <div className="space-y-2">
                  <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide">Kosten/Lead</p>
                  <p className="text-2xl font-semibold">
                    {campaign.costPerLead > 0 
                      ? `€${campaign.costPerLead.toLocaleString('de-DE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
                      : '-'
                    }
                  </p>
                  <div className="h-1 bg-muted rounded-full overflow-hidden">
                    <div
                      className="h-full bg-green-500/60 rounded-full transition-all duration-500"
                      style={{ width: `${Math.max(100 - (campaign.costPerLead / 50 * 100), 20)}%` }}
                    />
                  </div>
                </div>
              </div>

              {/* Expanded Details */}
              <div
                className={cn(
                  "overflow-hidden transition-all duration-500",
                  isExpanded ? "max-h-[1000px] opacity-100" : "max-h-0 opacity-0",
                )}
              >
                <div className="px-6 pb-6 pt-4 border-t border-border/50 space-y-6">
                  {/* Additional Metrics Grid */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
                    {/* CPM */}
                    <div>
                      <p className="text-sm text-muted-foreground">CPM</p>
                      <p className="text-xl font-bold mt-1">
                        €{campaign.cpm.toLocaleString('de-DE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </p>
                    </div>
                    
                    {/* Outbound CTR */}
                    <div>
                      <p className="text-sm text-muted-foreground">Outbound CTR</p>
                      <p className="text-xl font-bold mt-1">
                        {campaign.outboundCtr.toFixed(2)}%
                      </p>
                    </div>
                    
                    {/* Cost per Click */}
                    <div>
                      <p className="text-sm text-muted-foreground">Kosten/Klick</p>
                      <p className="text-xl font-bold mt-1">
                        {campaign.costPerOutboundClick > 0
                          ? `€${campaign.costPerOutboundClick.toLocaleString('de-DE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
                          : '-'
                        }
                      </p>
                    </div>
                    
                    {/* Conversion Rate */}
                    <div>
                      <p className="text-sm text-muted-foreground">CR Landingpage</p>
                      <p className="text-xl font-bold mt-1">
                        {campaign.conversionRate.toFixed(2)}%
                      </p>
                    </div>
                    
                    {/* ROAS Cash Collect */}
                    <div>
                      <p className="text-sm text-muted-foreground">ROAS Cash Collect</p>
                      <p className="text-xl font-bold mt-1 text-green-600">
                        {campaign.roasCashCollect > 0
                          ? campaign.roasCashCollect.toFixed(2) + 'x'
                          : '-'
                        }
                      </p>
                    </div>
                    
                    {/* Impressions */}
                    <div>
                      <p className="text-sm text-muted-foreground">Impressionen</p>
                      <p className="text-xl font-bold mt-1">
                        {campaign.impressions.toLocaleString('de-DE')}
                      </p>
                    </div>
                    
                    {/* Outbound Clicks */}
                    <div>
                      <p className="text-sm text-muted-foreground">Outbound Clicks</p>
                      <p className="text-xl font-bold mt-1">
                        {campaign.outboundClicks.toLocaleString('de-DE')}
                      </p>
                    </div>
                  </div>
                  
                  {/* Lead Correction Button */}
                  <div className="flex items-center justify-between pt-4 border-t border-border/50">
                    <div className="text-sm text-muted-foreground">
                      <span className="font-medium">Leads von Meta:</span> {campaign.leadsFromMeta}
                      {campaign.hasLeadCorrection && (
                        <span className="ml-2 text-amber-600">
                          (Korrigiert auf {campaign.leads})
                        </span>
                      )}
                    </div>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedCampaign({ 
                          id: campaign.id, 
                          name: campaign.name, 
                          leads: campaign.leads, 
                          leadsFromMeta: campaign.leadsFromMeta 
                        });
                        setLeadDialogOpen(true);
                      }}
                    >
                      Lead-Anzahl korrigieren
                    </Button>
                  </div>
                  
                  {/* Sales Summary and Add Button */}
                  <div className="pt-4 border-t border-border/50 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <button
                      className="text-sm text-muted-foreground hover:text-foreground transition-colors cursor-pointer text-left"
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedCampaign({ id: campaign.id, name: campaign.name, leads: campaign.leads, leadsFromMeta: campaign.leadsFromMeta });
                        setSalesListDialogOpen(true);
                      }}
                    >
                      {campaign.salesCount > 0 ? (
                        <span>
                          {campaign.salesCount} Verkauf{campaign.salesCount !== 1 ? 'e' : ''} erfasst 
                          (Auftragswert: €{campaign.totalOrderValue.toLocaleString('de-DE', { minimumFractionDigits: 2 })})
                        </span>
                      ) : (
                        <span>Noch keine Verkäufe erfasst</span>
                      )}
                    </button>
                    <Button
                      size="sm"
                      variant="outline"
                      className="w-full sm:w-auto"
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedCampaign({ id: campaign.id, name: campaign.name, leads: campaign.leads, leadsFromMeta: campaign.leadsFromMeta });
                        setSaleDialogOpen(true);
                      }}
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Verkauf hinzufügen
                    </Button>
                  </div>

                  {/* View Details Button */}
                  <div>
                    <Button
                      variant="default"
                      className="w-full"
                      onClick={() => setLocation(`/campaign/${campaign.id}`)}
                    >
                      Details anzeigen
                      <ArrowRight className="h-4 w-4 ml-2" />
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <DashboardLayout>
      <div className="space-y-8">
        {/* Breadcrumbs */}
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <span className="hover:text-foreground transition-colors cursor-pointer">Home</span>
          <span>/</span>
          <span className="text-foreground font-medium">Dashboard</span>
        </div>

        {/* Header Section */}
        <div className="space-y-2">
          <h1 className="text-4xl font-semibold tracking-tight text-balance">Dashboard</h1>
          <p className="text-muted-foreground text-balance">Übersicht über alle Kampagnen und Performance-Metriken</p>
        </div>

        {/* Date Range Filter */}
        <div className="flex items-center justify-between p-6 bg-card/60 backdrop-blur-sm rounded-2xl border border-border shadow-sm transition-all duration-300 hover:shadow-lg hover:shadow-accent/20 hover:border-accent/50 hover:bg-card/80 hover:scale-[1.01] group cursor-pointer">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-accent/10 group-hover:bg-accent/20 transition-all duration-300 group-hover:scale-110">
              <Calendar className="w-5 h-5 text-muted-foreground group-hover:text-accent transition-colors duration-300" />
            </div>
            <div>
              <p className="text-sm font-medium group-hover:text-accent transition-colors duration-300">Zeitraum</p>
              <p className="text-sm text-muted-foreground group-hover:text-foreground transition-colors duration-300">
                {dateRangeLabel}
              </p>
            </div>
          </div>
          <Select value={dateRange} onValueChange={(value) => setDateRange(value as DateRangePreset)}>
            <SelectTrigger className="w-48 hover:border-accent/50 hover:shadow-lg hover:shadow-accent/20 transition-all duration-300">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="today">Heute</SelectItem>
              <SelectItem value="last7days">Letzte 7 Tage</SelectItem>
              <SelectItem value="lastMonth">Letzter Monat</SelectItem>
              <SelectItem value="currentMonth">Aktueller Monat</SelectItem>
              <SelectItem value="lastQuarter">Letztes Quartal</SelectItem>
              <SelectItem value="custom">Benutzerdefiniert</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Custom Date Range Picker */}
        {dateRange === "custom" && (
          <Card className="bg-card/60 backdrop-blur-sm">
            <CardContent className="pt-6">
              <DateRangePicker
                value={customDateRange}
                onChange={setCustomDateRange}
              />
            </CardContent>
          </Card>
        )}

        {/* Campaign Tabs */}
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

        {/* Campaign List */}
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : error ? (
          <Card className="bg-card/60 backdrop-blur-sm">
            <CardHeader>
              <CardTitle>Fehler beim Laden der Kampagnen</CardTitle>
              <CardDescription>
                {error.message || 'Ein unbekannter Fehler ist aufgetreten.'}
              </CardDescription>
            </CardHeader>
          </Card>
        ) : (
          <>
            {activeTab === "active" && renderCampaignCards(activeCampaigns)}
            {activeTab === "inactive" && renderCampaignCards(inactiveCampaigns)}
          </>
        )}
      </div>

      {/* Dialogs */}
      {selectedCampaign && (
        <>
          <AddSaleDialog
            open={saleDialogOpen}
            onOpenChange={setSaleDialogOpen}
            entityId={selectedCampaign.id}
            entityType="campaign"
            entityName={selectedCampaign.name}
          />
          <SalesListDialog
            open={salesListDialogOpen}
            onOpenChange={setSalesListDialogOpen}
            entityId={selectedCampaign.id}
            entityType="campaign"
            entityName={selectedCampaign.name}
          />
          <EditLeadCountDialog
            open={leadDialogOpen}
            onOpenChange={setLeadDialogOpen}
            entityId={selectedCampaign.id}
            entityType="campaign"
            entityName={selectedCampaign.name}
            currentLeadCount={selectedCampaign.leads}
            leadsFromMeta={selectedCampaign.leadsFromMeta}
          />
        </>
      )}
    </DashboardLayout>
  );
}
