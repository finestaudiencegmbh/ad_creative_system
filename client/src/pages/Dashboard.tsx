import DashboardLayout from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { trpc } from "@/lib/trpc";
import { TrendingUp, TrendingDown, ArrowRight, Loader2 } from "lucide-react";
import { useLocation } from "wouter";

export default function Dashboard() {
  const [, setLocation] = useLocation();
  
  // Dummy data for now - will be replaced with real API call
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

  return (
    <DashboardLayout>
      <div className="space-y-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground mt-2">
            Übersicht über alle aktiven Kampagnen und deren Performance
          </p>
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
