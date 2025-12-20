import DashboardLayout from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { trpc } from "@/lib/trpc";
import { TrendingUp, TrendingDown, ArrowRight, Calendar } from "lucide-react";
import { useLocation } from "wouter";
import { useState, useMemo } from "react";
import { startOfMonth, endOfMonth, startOfDay, endOfDay, subDays, subMonths, startOfQuarter, endOfQuarter, format } from "date-fns";
import { de } from "date-fns/locale";

type DateRange = "today" | "last7days" | "lastMonth" | "currentMonth" | "lastQuarter" | "custom";

export default function Dashboard() {
  const [, setLocation] = useLocation();
  const [dateRange, setDateRange] = useState<DateRange>("currentMonth");
  
  // Calculate date range based on selection
  const { startDate, endDate } = useMemo(() => {
    const now = new Date();
    
    switch (dateRange) {
      case "today":
        return {
          startDate: startOfDay(now),
          endDate: endOfDay(now)
        };
      case "last7days":
        return {
          startDate: subDays(now, 7),
          endDate: now
        };
      case "lastMonth":
        const lastMonth = subMonths(now, 1);
        return {
          startDate: startOfMonth(lastMonth),
          endDate: endOfMonth(lastMonth)
        };
      case "currentMonth":
        return {
          startDate: startOfMonth(now),
          endDate: endOfMonth(now)
        };
      case "lastQuarter":
        const lastQuarter = subMonths(now, 3);
        return {
          startDate: startOfQuarter(lastQuarter),
          endDate: endOfQuarter(lastQuarter)
        };
      default:
        return {
          startDate: startOfMonth(now),
          endDate: endOfMonth(now)
        };
    }
  }, [dateRange]);
  
  // Dummy data for now - will be replaced with real API call filtered by date range
  const campaigns = [
    {
      id: 1,
      name: "VSL-Funnel Kampagne",
      campaign_id: "120210548491777694",
      status: "active",
      impressions: 125430,
      spend: 1250.50,
      ctr: 2.34,
      ctr_change: 12.5,
      conversions: 45
    },
    {
      id: 2,
      name: "Testing-ABO",
      campaign_id: "120210548491777695",
      status: "active",
      impressions: 89201,
      spend: 890.25,
      ctr: 1.89,
      ctr_change: -5.2,
      conversions: 32
    },
    {
      id: 3,
      name: "ABO Hauptkampagne",
      campaign_id: "120210548491777696",
      status: "active",
      impressions: 45000,
      spend: 450.00,
      ctr: 3.12,
      ctr_change: 18.3,
      conversions: 28
    }
  ];

  const dateRangeLabel = useMemo(() => {
    return `${format(startDate, 'dd. MMM yyyy', { locale: de })} - ${format(endDate, 'dd. MMM yyyy', { locale: de })}`;
  }, [startDate, endDate]);

  return (
    <DashboardLayout>
      <div className="space-y-8">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
            <p className="text-muted-foreground mt-2">
              Übersicht über alle aktiven Kampagnen und deren Performance
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

        <div className="grid gap-4">
          {campaigns.map((campaign) => {
            const isPositive = campaign.ctr_change >= 0;
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
                        <Badge variant={campaign.status === 'active' ? 'default' : 'secondary'}>
                          {campaign.status === 'active' ? 'Aktiv' : 'Pausiert'}
                        </Badge>
                      </div>
                      <CardDescription>
                        Kampagnen-ID: {campaign.campaign_id}
                      </CardDescription>
                    </div>
                    <Button variant="ghost" size="icon">
                      <ArrowRight className="h-5 w-5" />
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                    <div>
                      <p className="text-sm text-muted-foreground">Impressions</p>
                      <p className="text-2xl font-bold mt-1">
                        {campaign.impressions.toLocaleString('de-DE')}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Ausgaben</p>
                      <p className="text-2xl font-bold mt-1">
                        €{campaign.spend.toLocaleString('de-DE', { minimumFractionDigits: 2 })}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">CTR</p>
                      <div className="flex items-center gap-2 mt-1">
                        <p className="text-2xl font-bold">
                          {campaign.ctr.toFixed(2)}%
                        </p>
                        <div className={`flex items-center gap-1 text-sm ${isPositive ? 'text-green-600' : 'text-red-600'}`}>
                          {isPositive ? (
                            <TrendingUp className="h-4 w-4" />
                          ) : (
                            <TrendingDown className="h-4 w-4" />
                          )}
                          <span>{Math.abs(campaign.ctr_change).toFixed(1)}%</span>
                        </div>
                      </div>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Conversions</p>
                      <p className="text-2xl font-bold mt-1">
                        {campaign.conversions}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>
    </DashboardLayout>
  );
}
