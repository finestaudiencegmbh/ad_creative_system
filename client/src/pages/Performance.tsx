import DashboardLayout from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { RefreshCw, TrendingUp, TrendingDown } from "lucide-react";
import { toast } from "sonner";

export default function Performance() {
  const handleRefresh = () => {
    toast.info("Performance-Daten werden aktualisiert...");
  };

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
          <Button onClick={handleRefresh}>
            <RefreshCw className="mr-2 h-4 w-4" />
            Aktualisieren
          </Button>
        </div>

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
              {[
                { name: "VSL-Funnel Creative A", ctr: "4.2%", conversions: 127, spend: "€1.234" },
                { name: "ABO Testing Creative B", ctr: "3.8%", conversions: 98, spend: "€987" },
                { name: "Story Ad Variante 3", ctr: "3.5%", conversions: 84, spend: "€756" },
              ].map((creative, index) => (
                <div key={index} className="flex items-center justify-between p-4 border rounded-lg hover:bg-accent/50 transition-colors">
                  <div className="space-y-1">
                    <p className="font-medium">{creative.name}</p>
                    <div className="flex gap-4 text-sm text-muted-foreground">
                      <span>CTR: {creative.ctr}</span>
                      <span>Conversions: {creative.conversions}</span>
                      <span>Spend: {creative.spend}</span>
                    </div>
                  </div>
                  <div className="text-2xl font-bold text-green-500">#{index + 1}</div>
                </div>
              ))}
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
              {[
                { name: "Feed Ad Variante 7", ctr: "0.8%", conversions: 12, spend: "€543" },
                { name: "Story Creative D", ctr: "0.6%", conversions: 8, spend: "€421" },
                { name: "Testing ABO Creative E", ctr: "0.4%", conversions: 5, spend: "€312" },
              ].map((creative, index) => (
                <div key={index} className="flex items-center justify-between p-4 border rounded-lg hover:bg-accent/50 transition-colors">
                  <div className="space-y-1">
                    <p className="font-medium">{creative.name}</p>
                    <div className="flex gap-4 text-sm text-muted-foreground">
                      <span>CTR: {creative.ctr}</span>
                      <span>Conversions: {creative.conversions}</span>
                      <span>Spend: {creative.spend}</span>
                    </div>
                  </div>
                  <div className="text-2xl font-bold text-red-500">#{index + 1}</div>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Kampagnen-Übersicht</CardTitle>
            <CardDescription>Performance-Daten deiner aktiven Kampagnen</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-3">
              <div className="space-y-2">
                <h3 className="font-semibold">VSL-Funnel</h3>
                <div className="space-y-1 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Impressions</span>
                    <span className="font-medium">124.532</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Clicks</span>
                    <span className="font-medium">3.421</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">CTR</span>
                    <span className="font-medium">2.75%</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Spend</span>
                    <span className="font-medium">€1.234,56</span>
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <h3 className="font-semibold">ABO</h3>
                <div className="space-y-1 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Impressions</span>
                    <span className="font-medium">89.421</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Clicks</span>
                    <span className="font-medium">2.103</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">CTR</span>
                    <span className="font-medium">2.35%</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Spend</span>
                    <span className="font-medium">€892,34</span>
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <h3 className="font-semibold">Testing-ABO</h3>
                <div className="space-y-1 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Impressions</span>
                    <span className="font-medium">45.678</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Clicks</span>
                    <span className="font-medium">1.234</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">CTR</span>
                    <span className="font-medium">2.70%</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Spend</span>
                    <span className="font-medium">€567,89</span>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
