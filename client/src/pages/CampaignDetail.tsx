import DashboardLayout from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, TrendingUp, TrendingDown } from "lucide-react";
import { useLocation, useRoute } from "wouter";

export default function CampaignDetail() {
  const [, setLocation] = useLocation();
  const [, params] = useRoute("/campaign/:id");
  
  // Dummy data - will be replaced with real API call based on params.id
  const campaign = {
    id: 1,
    name: "VSL-Funnel Kampagne",
    campaign_id: "120210548491777694",
    status: "active",
    impressions: 125430,
    spend: 1250.50,
    ctr: 2.34,
    ctr_change: 12.5,
    conversions: 45,
    cpc: 27.79,
    cpm: 9.97
  };

  return (
    <DashboardLayout>
      <div className="space-y-8">
        <div className="flex items-center gap-4">
          <Button 
            variant="ghost" 
            size="icon"
            onClick={() => setLocation("/")}
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div className="flex-1">
            <div className="flex items-center gap-3">
              <h1 className="text-3xl font-bold tracking-tight">{campaign.name}</h1>
              <Badge variant={campaign.status === 'active' ? 'default' : 'secondary'}>
                {campaign.status === 'active' ? 'Aktiv' : 'Pausiert'}
              </Badge>
            </div>
            <p className="text-muted-foreground mt-1">
              Kampagnen-ID: {campaign.campaign_id}
            </p>
          </div>
        </div>

        {/* KPI Cards */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Impressions
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">
                {campaign.impressions.toLocaleString('de-DE')}
              </div>
              <p className="text-xs text-muted-foreground mt-1">Letzte 30 Tage</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Ausgaben
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">
                €{campaign.spend.toLocaleString('de-DE', { minimumFractionDigits: 2 })}
              </div>
              <p className="text-xs text-muted-foreground mt-1">Gesamtbudget</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                CTR
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2">
                <div className="text-3xl font-bold">
                  {campaign.ctr.toFixed(2)}%
                </div>
                <div className={`flex items-center gap-1 text-sm ${campaign.ctr_change >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {campaign.ctr_change >= 0 ? (
                    <TrendingUp className="h-4 w-4" />
                  ) : (
                    <TrendingDown className="h-4 w-4" />
                  )}
                  <span>{Math.abs(campaign.ctr_change).toFixed(1)}%</span>
                </div>
              </div>
              <p className="text-xs text-muted-foreground mt-1">vs. letzte Woche</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Conversions
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">
                {campaign.conversions}
              </div>
              <p className="text-xs text-muted-foreground mt-1">Gesamt</p>
            </CardContent>
          </Card>
        </div>

        {/* Additional Metrics */}
        <div className="grid gap-4 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Kosten-Metriken</CardTitle>
              <CardDescription>Durchschnittliche Kosten pro Aktion</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">CPC (Cost per Click)</span>
                <span className="text-lg font-bold">€{campaign.cpc.toFixed(2)}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">CPM (Cost per 1000 Impressions)</span>
                <span className="text-lg font-bold">€{campaign.cpm.toFixed(2)}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Cost per Conversion</span>
                <span className="text-lg font-bold">€{(campaign.spend / campaign.conversions).toFixed(2)}</span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Performance-Insights</CardTitle>
              <CardDescription>KI-gestützte Empfehlungen</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-start gap-3">
                <div className="w-2 h-2 mt-2 rounded-full bg-green-500"></div>
                <div>
                  <p className="text-sm font-medium">Überdurchschnittliche CTR</p>
                  <p className="text-xs text-muted-foreground">
                    Ihre CTR liegt 23% über dem Branchendurchschnitt
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-2 h-2 mt-2 rounded-full bg-blue-500"></div>
                <div>
                  <p className="text-sm font-medium">Optimierungspotenzial</p>
                  <p className="text-xs text-muted-foreground">
                    Testen Sie neue Creative-Varianten für bessere Conversion-Rate
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-2 h-2 mt-2 rounded-full bg-purple-500"></div>
                <div>
                  <p className="text-sm font-medium">Budget-Empfehlung</p>
                  <p className="text-xs text-muted-foreground">
                    Erhöhen Sie das Budget um 20% für maximale Reichweite
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions */}
        <Card>
          <CardHeader>
            <CardTitle>Schnellaktionen</CardTitle>
            <CardDescription>Optimieren Sie Ihre Kampagne</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-wrap gap-3">
            <Button onClick={() => setLocation("/generator")}>
              Neue Creatives generieren
            </Button>
            <Button variant="outline" onClick={() => setLocation("/werbetexte")}>
              Werbetexte optimieren
            </Button>
            <Button variant="outline" onClick={() => setLocation("/performance")}>
              Performance vergleichen
            </Button>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
