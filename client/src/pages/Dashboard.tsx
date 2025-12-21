import DashboardLayout from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { trpc } from "@/lib/trpc";
import { ArrowRight, Calendar, Loader2, Plus } from "lucide-react";
import { useLocation } from "wouter";
import { useState, useMemo } from "react";
import { startOfMonth, endOfMonth, startOfDay, endOfDay, subDays, subMonths, startOfQuarter, endOfQuarter, format } from "date-fns";
import { de } from "date-fns/locale";
import { AddSaleDialog } from "@/components/AddSaleDialog";
import { SalesListDialog } from "@/components/SalesListDialog";
import { EditLeadCountDialog } from "@/components/EditLeadCountDialog";

type DateRange = "today" | "last7days" | "lastMonth" | "currentMonth" | "lastQuarter" | "custom";

export default function Dashboard() {
  const [, setLocation] = useLocation();
  const [dateRange, setDateRange] = useState<DateRange>("currentMonth");
  const [activeTab, setActiveTab] = useState<"active" | "inactive">("active");
  const [saleDialogOpen, setSaleDialogOpen] = useState(false);
  const [salesListDialogOpen, setSalesListDialogOpen] = useState(false);
  const [leadDialogOpen, setLeadDialogOpen] = useState(false);
  const [selectedCampaign, setSelectedCampaign] = useState<{ id: string; name: string; leads: number; leadsFromMeta: number } | null>(null);
  
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
      default:
        return {
          startDate: startOfMonth(now),
          endDate: endOfMonth(now),
          datePreset: "this_month" as const
        };
    }
  }, [dateRange]);

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
          return (
            <Card 
              key={campaign.id}
              className="hover:shadow-lg transition-shadow cursor-pointer"
              onClick={() => setLocation(`/campaign/${campaign.id}`)}
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
                  <Button variant="ghost" size="icon">
                    <ArrowRight className="h-5 w-5" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
                  {/* 1. Ausgaben */}
                  <div>
                    <p className="text-sm text-muted-foreground">Ausgaben</p>
                    <p className="text-xl font-bold mt-1">
                      €{campaign.spend.toLocaleString('de-DE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </p>
                  </div>
                  
                  {/* 2. Kosten pro Lead */}
                  <div>
                    <p className="text-sm text-muted-foreground">Kosten/Lead</p>
                    <p className="text-xl font-bold mt-1">
                      {campaign.costPerLead > 0 
                        ? `€${campaign.costPerLead.toLocaleString('de-DE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
                        : '-'
                      }
                    </p>
                  </div>
                  
                  {/* 3. CPM */}
                  <div>
                    <p className="text-sm text-muted-foreground">CPM</p>
                    <p className="text-xl font-bold mt-1">
                      €{campaign.cpm.toLocaleString('de-DE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </p>
                  </div>
                  
                  {/* 4. Lead-Anzahl (mit Edit-Button) */}
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="text-sm text-muted-foreground">Leads</p>
                      {campaign.hasLeadCorrection && (
                        <Badge variant="secondary" className="text-xs">Korrigiert</Badge>
                      )}
                    </div>
                    <div className="flex items-center gap-2 mt-1">
                      <p className="text-xl font-bold">
                        {campaign.leads}
                      </p>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-6 px-2 text-xs"
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
                  
                  {/* 5. Individuell ausgehende CTR */}
                  <div>
                    <p className="text-sm text-muted-foreground">Outbound CTR</p>
                    <p className="text-xl font-bold mt-1">
                      {campaign.outboundCtr.toFixed(2)}%
                    </p>
                  </div>
                  
                  {/* 5. Kosten pro individuell ausgehendem Klick */}
                  <div>
                    <p className="text-sm text-muted-foreground">Kosten/Klick</p>
                    <p className="text-xl font-bold mt-1">
                      {campaign.costPerOutboundClick > 0
                        ? `€${campaign.costPerOutboundClick.toLocaleString('de-DE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
                        : '-'
                      }
                    </p>
                  </div>
                  
                  {/* 6. Conversion Rate Landingpage */}
                  <div>
                    <p className="text-sm text-muted-foreground">CR Landingpage</p>
                    <p className="text-xl font-bold mt-1">
                      {campaign.conversionRate.toFixed(2)}%
                    </p>
                  </div>
                  
                  {/* 7. ROAS Auftragsvolumen */}
                  <div>
                    <p className="text-sm text-muted-foreground">ROAS Auftrag</p>
                    <p className="text-xl font-bold mt-1">
                      {campaign.roasOrderVolume > 0
                        ? campaign.roasOrderVolume.toFixed(2) + 'x'
                        : '-'
                      }
                    </p>
                  </div>
                  
                  {/* 8. ROAS Cash Collect */}
                  <div>
                    <p className="text-sm text-muted-foreground">ROAS Cash</p>
                    <p className="text-xl font-bold mt-1">
                      {campaign.roasCashCollect > 0
                        ? campaign.roasCashCollect.toFixed(2) + 'x'
                        : '-'
                      }
                    </p>
                  </div>
                </div>
                
                {/* Sales Summary and Add Button */}
                <div className="mt-4 pt-4 border-t flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
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
              </CardContent>
            </Card>
          );
        })}
      </div>
    );
  };

  return (
    <DashboardLayout>
      <div className="space-y-8">
        <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Dashboard</h1>
            <p className="text-sm md:text-base text-muted-foreground mt-2">
              Übersicht über alle aktiven Kampagnen und deren Performance
            </p>
          </div>
          
          <div className="flex flex-col gap-2 md:items-end">
            <Select value={dateRange} onValueChange={(value) => setDateRange(value as DateRange)}>
              <SelectTrigger className="w-full md:w-[220px]">
                <Calendar className="mr-2 h-4 w-4" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="today">Heute</SelectItem>
                <SelectItem value="last7days">Letzte 7 Tage</SelectItem>
                <SelectItem value="lastMonth">Letzter Monat</SelectItem>
                <SelectItem value="currentMonth">Aktueller Monat</SelectItem>
                <SelectItem value="lastQuarter">Letztes Quartal</SelectItem>
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">
              {dateRangeLabel}
            </p>
          </div>
        </div>

        {isLoading && (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        )}

        {error && (
          <Card className="border-destructive">
            <CardHeader>
              <CardTitle className="text-destructive">Fehler beim Laden der Kampagnen</CardTitle>
              <CardDescription>{error.message}</CardDescription>
            </CardHeader>
          </Card>
        )}

        {!isLoading && !error && (
          <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as "active" | "inactive")}>
            <TabsList>
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
      
      {/* Add Sale Dialog */}
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
