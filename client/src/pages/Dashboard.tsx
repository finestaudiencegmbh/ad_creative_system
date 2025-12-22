import DashboardLayout from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { trpc } from "@/lib/trpc";
import { ArrowRight, Calendar, Loader2, Plus, ChevronDown, ChevronUp } from "lucide-react";
import { useLocation } from "wouter";
import { useState, useMemo } from "react";
import { startOfMonth, endOfMonth, startOfDay, endOfDay, subDays, subMonths, startOfQuarter, endOfQuarter, format } from "date-fns";
import { de } from "date-fns/locale";
import { AddSaleDialog } from "@/components/AddSaleDialog";
import { SalesListDialog } from "@/components/SalesListDialog";
import { EditLeadCountDialog } from "@/components/EditLeadCountDialog";
import { DateRangePicker } from "@/components/DateRangePicker";
import { DateRange as DateRangeValue } from "react-day-picker";

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
        <Card>
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
      <div className="grid gap-4">
        {campaigns.map((campaign) => {
          const isExpanded = expandedCampaigns.has(campaign.id);
          
          return (
            <Card 
              key={campaign.id}
              className="hover:shadow-lg transition-shadow"
            >
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="space-y-1 flex-1">
                    <div className="flex items-center gap-3">
                      <CardTitle className="text-xl">{campaign.name}</CardTitle>
                      <Badge variant={campaign.status === 'ACTIVE' ? 'default' : 'secondary'}>
                        {campaign.status === 'ACTIVE' ? 'Aktiv' : campaign.status === 'PAUSED' ? 'Pausiert' : 'Archiviert'}
                      </Badge>
                    </div>
                    <CardDescription>
                      Kampagnen-ID: {campaign.id}
                    </CardDescription>
                  </div>
                  <Button 
                    variant="ghost" 
                    size="icon"
                    onClick={(e) => toggleCampaignExpanded(campaign.id, e)}
                  >
                    {isExpanded ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {/* Key KPIs - Always Visible */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 md:gap-6">
                  {/* 1. Ausgaben */}
                  <div>
                    <p className="text-sm text-muted-foreground">Ausgaben</p>
                    <p className="text-2xl font-bold mt-1">
                      €{campaign.spend.toLocaleString('de-DE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </p>
                  </div>
                  
                  {/* 2. ROAS */}
                  <div>
                    <p className="text-sm text-muted-foreground">ROAS</p>
                    <p className="text-2xl font-bold mt-1 text-green-600">
                      {campaign.roasOrderVolume > 0
                        ? campaign.roasOrderVolume.toFixed(2) + 'x'
                        : '-'
                      }
                    </p>
                  </div>
                  
                  {/* 3. Leads */}
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="text-sm text-muted-foreground">Leads</p>
                      {campaign.hasLeadCorrection && (
                        <Badge variant="secondary" className="text-xs">Korrigiert</Badge>
                      )}
                    </div>
                    <p className="text-2xl font-bold mt-1">
                      {campaign.leads}
                    </p>
                  </div>
                  
                  {/* 4. Kosten pro Lead */}
                  <div>
                    <p className="text-sm text-muted-foreground">Kosten/Lead</p>
                    <p className="text-2xl font-bold mt-1">
                      {campaign.costPerLead > 0 
                        ? `€${campaign.costPerLead.toLocaleString('de-DE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
                        : '-'
                      }
                    </p>
                  </div>
                </div>

                {/* Expanded Details */}
                {isExpanded && (
                  <>
                    <div className="mt-6 pt-6 border-t grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
                      {/* CPM */}
                      <div>
                        <p className="text-sm text-muted-foreground">CPM</p>
                        <p className="text-xl font-bold mt-1">
                          €{campaign.cpm.toLocaleString('de-DE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </p>
                      </div>
                      
                      {/* Individuell ausgehende CTR */}
                      <div>
                        <p className="text-sm text-muted-foreground">Outbound CTR</p>
                        <p className="text-xl font-bold mt-1">
                          {campaign.outboundCtr.toFixed(2)}%
                        </p>
                      </div>
                      
                      {/* Kosten pro individuell ausgehendem Klick */}
                      <div>
                        <p className="text-sm text-muted-foreground">Kosten/Klick</p>
                        <p className="text-xl font-bold mt-1">
                          {campaign.costPerOutboundClick > 0
                            ? `€${campaign.costPerOutboundClick.toLocaleString('de-DE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
                            : '-'
                          }
                        </p>
                      </div>
                      
                      {/* Conversion Rate Landingpage */}
                      <div>
                        <p className="text-sm text-muted-foreground">CR Landingpage</p>
                        <p className="text-xl font-bold mt-1">
                          {campaign.conversionRate.toFixed(2)}%
                        </p>
                      </div>
                      
                      {/* ROAS Cash Collect */}
                      <div>
                        <p className="text-sm text-muted-foreground">ROAS Cash</p>
                        <p className="text-xl font-bold mt-1 text-green-600">
                          {campaign.roasCashCollect > 0
                            ? campaign.roasCashCollect.toFixed(2) + 'x'
                            : '-'
                          }
                        </p>
                      </div>
                      
                      {/* Lead Edit Button */}
                      <div>
                        <p className="text-sm text-muted-foreground mb-1">Lead-Anzahl bearbeiten</p>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedCampaign({ id: campaign.id, name: campaign.name, leads: campaign.leads, leadsFromMeta: campaign.leadsFromMeta });
                            setLeadDialogOpen(true);
                          }}
                        >
                          Bearbeiten
                        </Button>
                      </div>
                    </div>
                    
                    {/* Sales Summary and Add Button */}
                    <div className="mt-6 pt-6 border-t flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
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
                    <div className="mt-4">
                      <Button
                        variant="default"
                        className="w-full"
                        onClick={() => setLocation(`/campaign/${campaign.id}`)}
                      >
                        Details anzeigen
                        <ArrowRight className="h-4 w-4 ml-2" />
                      </Button>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>
    );
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-3xl font-bold">Dashboard</h1>
            <p className="text-muted-foreground mt-1">
              Übersicht über alle Kampagnen und Performance-Metriken
            </p>
          </div>
        </div>

        {/* Date Range Filter */}
        <Card>
          <CardHeader>
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-2">
                <Calendar className="h-5 w-5 text-muted-foreground" />
                <CardTitle>Zeitraum</CardTitle>
              </div>
              <Select value={dateRange} onValueChange={(value) => setDateRange(value as DateRangePreset)}>
                <SelectTrigger className="w-full sm:w-[280px]">
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
            <CardDescription className="mt-2">
              {dateRangeLabel}
            </CardDescription>
          </CardHeader>
          {dateRange === "custom" && (
            <CardContent>
              <DateRangePicker
                value={customDateRange}
                onChange={(range) => {
                  setCustomDateRange(range);
                }}
              />
            </CardContent>
          )}
        </Card>

        {/* Campaigns Section */}
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : error ? (
          <Card>
            <CardHeader>
              <CardTitle>Fehler beim Laden der Kampagnen</CardTitle>
              <CardDescription>
                {error.message || 'Ein unbekannter Fehler ist aufgetreten.'}
              </CardDescription>
            </CardHeader>
          </Card>
        ) : (
          <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as "active" | "inactive")}>
            <TabsList className="grid w-full max-w-md grid-cols-2">
              <TabsTrigger value="active">
                Aktive Kampagnen ({activeCampaigns.length})
              </TabsTrigger>
              <TabsTrigger value="inactive">
                Inaktive Kampagnen ({inactiveCampaigns.length})
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="active" className="mt-6">
              {renderCampaignCards(activeCampaigns)}
            </TabsContent>
            
            <TabsContent value="inactive" className="mt-6">
              {renderCampaignCards(inactiveCampaigns)}
            </TabsContent>
          </Tabs>
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
