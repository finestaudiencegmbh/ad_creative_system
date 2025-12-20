import DashboardLayout from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { trpc } from "@/lib/trpc";
import { ArrowRight, Calendar, Loader2, ChevronLeft, Plus } from "lucide-react";
import { useLocation, useRoute } from "wouter";
import { useState, useMemo } from "react";
import { startOfMonth, endOfMonth, startOfDay, endOfDay, subDays, subMonths, startOfQuarter, endOfQuarter, format } from "date-fns";
import { de } from "date-fns/locale";
import { AddSaleDialog } from "@/components/AddSaleDialog";
import { SalesListDialog } from "@/components/SalesListDialog";

type DateRange = "today" | "last7days" | "lastMonth" | "currentMonth" | "lastQuarter" | "custom";

export default function CampaignDetail() {
  const [, params] = useRoute("/campaign/:id");
  const [, setLocation] = useLocation();
  const [dateRange, setDateRange] = useState<DateRange>("currentMonth");
  const [activeTab, setActiveTab] = useState<"active" | "inactive">("active");
  const [saleDialogOpen, setSaleDialogOpen] = useState(false);
  const [salesListDialogOpen, setSalesListDialogOpen] = useState(false);
  const [selectedAdSet, setSelectedAdSet] = useState<{ id: string; name: string } | null>(null);
  
  const campaignId = params?.id || "";

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

  // Fetch ad sets for this campaign
  const { data: allAdSets, isLoading, error } = trpc.adsets.listByCampaign.useQuery({
    campaignId,
    datePreset,
  });

  // Filter ad sets by status
  const activeAdSets = useMemo(() => {
    return allAdSets?.filter(a => a.status === 'ACTIVE') || [];
  }, [allAdSets]);

  const inactiveAdSets = useMemo(() => {
    return allAdSets?.filter(a => a.status !== 'ACTIVE') || [];
  }, [allAdSets]);

  const dateRangeLabel = useMemo(() => {
    return `${format(startDate, 'dd. MMM yyyy', { locale: de })} - ${format(endDate, 'dd. MMM yyyy', { locale: de })}`;
  }, [startDate, endDate]);

  const renderAdSetCards = (adsets: typeof allAdSets) => {
    if (!adsets || adsets.length === 0) {
      return (
        <Card>
          <CardHeader>
            <CardTitle>Keine Anzeigengruppen gefunden</CardTitle>
            <CardDescription>
              Es wurden keine Anzeigengruppen für den gewählten Zeitraum gefunden.
            </CardDescription>
          </CardHeader>
        </Card>
      );
    }

    return (
      <div className="grid gap-4">
        {adsets.map((adset) => {
          return (
            <Card 
              key={adset.id}
              className="hover:shadow-lg transition-shadow cursor-pointer"
              onClick={() => setLocation(`/adset/${adset.id}`)}
            >
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="space-y-1 flex-1">
                    <div className="flex items-center gap-3">
                      <CardTitle className="text-xl">{adset.name}</CardTitle>
                      <Badge variant={adset.status === 'ACTIVE' ? 'default' : 'secondary'}>
                        {adset.status === 'ACTIVE' ? 'Aktiv' : adset.status === 'PAUSED' ? 'Pausiert' : 'Archiviert'}
                      </Badge>
                    </div>
                    <CardDescription>
                      Anzeigengruppen-ID: {adset.id}
                    </CardDescription>
                  </div>
                  <Button variant="ghost" size="icon">
                    <ArrowRight className="h-5 w-5" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                  {/* 1. Ausgaben */}
                  <div>
                    <p className="text-sm text-muted-foreground">Ausgaben</p>
                    <p className="text-xl font-bold mt-1">
                      €{adset.spend.toLocaleString('de-DE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </p>
                  </div>
                  
                  {/* 2. Kosten pro Lead */}
                  <div>
                    <p className="text-sm text-muted-foreground">Kosten/Lead</p>
                    <p className="text-xl font-bold mt-1">
                      {adset.costPerLead > 0 
                        ? `€${adset.costPerLead.toLocaleString('de-DE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
                        : '-'
                      }
                    </p>
                  </div>
                  
                  {/* 3. CPM */}
                  <div>
                    <p className="text-sm text-muted-foreground">CPM</p>
                    <p className="text-xl font-bold mt-1">
                      €{adset.cpm.toLocaleString('de-DE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </p>
                  </div>
                  
                  {/* 4. Individuell ausgehende CTR */}
                  <div>
                    <p className="text-sm text-muted-foreground">Outbound CTR</p>
                    <p className="text-xl font-bold mt-1">
                      {adset.outboundCtr.toFixed(2)}%
                    </p>
                  </div>
                  
                  {/* 5. Kosten pro individuell ausgehendem Klick */}
                  <div>
                    <p className="text-sm text-muted-foreground">Kosten/Klick</p>
                    <p className="text-xl font-bold mt-1">
                      {adset.costPerOutboundClick > 0
                        ? `€${adset.costPerOutboundClick.toLocaleString('de-DE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
                        : '-'
                      }
                    </p>
                  </div>
                  
                  {/* 6. Conversion Rate Landingpage */}
                  <div>
                    <p className="text-sm text-muted-foreground">CR Landingpage</p>
                    <p className="text-xl font-bold mt-1">
                      {adset.conversionRate.toFixed(2)}%
                    </p>
                  </div>
                  
                  {/* 7. ROAS Auftragsvolumen */}
                  <div>
                    <p className="text-sm text-muted-foreground">ROAS Auftrag</p>
                    <p className="text-xl font-bold mt-1">
                      {adset.roasOrderVolume > 0
                        ? adset.roasOrderVolume.toFixed(2) + 'x'
                        : '-'
                      }
                    </p>
                  </div>
                  
                  {/* 8. ROAS Cash Collect */}
                  <div>
                    <p className="text-sm text-muted-foreground">ROAS Cash</p>
                    <p className="text-xl font-bold mt-1">
                      {adset.roasCashCollect > 0
                        ? adset.roasCashCollect.toFixed(2) + 'x'
                        : '-'
                      }
                    </p>
                  </div>
                </div>
                
                {/* Sales Summary and Add Button */}
                <div className="mt-4 pt-4 border-t flex items-center justify-between">
                  <button
                    className="text-sm text-muted-foreground hover:text-foreground transition-colors cursor-pointer text-left"
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedAdSet({ id: adset.id, name: adset.name });
                      setSalesListDialogOpen(true);
                    }}
                  >
                    {adset.salesCount > 0 ? (
                      <span>
                        {adset.salesCount} Verkauf{adset.salesCount !== 1 ? 'e' : ''} erfasst 
                        (Auftragswert: €{adset.totalOrderValue.toLocaleString('de-DE', { minimumFractionDigits: 2 })})
                      </span>
                    ) : (
                      <span>Noch keine Verkäufe erfasst</span>
                    )}
                  </button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedAdSet({ id: adset.id, name: adset.name });
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
        <div className="flex items-start justify-between">
          <div>
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => setLocation('/')}
              className="mb-4 -ml-2"
            >
              <ChevronLeft className="h-4 w-4 mr-1" />
              Zurück zum Dashboard
            </Button>
            <h1 className="text-3xl font-bold tracking-tight">Anzeigengruppen</h1>
            <p className="text-muted-foreground mt-2">
              Übersicht über alle Anzeigengruppen dieser Kampagne
            </p>
          </div>
          
          <div className="flex flex-col items-end gap-2">
            <Select value={dateRange} onValueChange={(value) => setDateRange(value as DateRange)}>
              <SelectTrigger className="w-[220px]">
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
              <CardTitle className="text-destructive">Fehler beim Laden der Anzeigengruppen</CardTitle>
              <CardDescription>{error.message}</CardDescription>
            </CardHeader>
          </Card>
        )}

        {!isLoading && !error && (
          <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as "active" | "inactive")}>
            <TabsList>
              <TabsTrigger value="active">
                Aktive Anzeigengruppen ({activeAdSets.length})
              </TabsTrigger>
              <TabsTrigger value="inactive">
                Inaktive Anzeigengruppen ({inactiveAdSets.length})
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="active" className="mt-6">
              {renderAdSetCards(activeAdSets)}
            </TabsContent>
            
            <TabsContent value="inactive" className="mt-6">
              {renderAdSetCards(inactiveAdSets)}
            </TabsContent>
          </Tabs>
        )}
      </div>
      
      {/* Add Sale Dialog */}
      {selectedAdSet && (
        <>
          <AddSaleDialog
            open={saleDialogOpen}
            onOpenChange={setSaleDialogOpen}
            entityId={selectedAdSet.id}
            entityType="adset"
            entityName={selectedAdSet.name}
          />
          <SalesListDialog
            open={salesListDialogOpen}
            onOpenChange={setSalesListDialogOpen}
            entityId={selectedAdSet.id}
            entityType="adset"
            entityName={selectedAdSet.name}
          />
        </>
      )}
    </DashboardLayout>
  );
}
