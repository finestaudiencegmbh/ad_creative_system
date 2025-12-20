import DashboardLayout from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { RefreshCw } from "lucide-react";
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
              Analysieren Sie die Performance Ihrer Meta-Kampagnen
            </p>
          </div>
          <Button onClick={handleRefresh}>
            <RefreshCw className="mr-2 h-4 w-4" />
            Aktualisieren
          </Button>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardHeader>
              <CardTitle>VSL-Funnel</CardTitle>
              <CardDescription>Video Sales Letter Kampagne</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Impressions</span>
                  <span className="text-sm font-medium">124,532</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Clicks</span>
                  <span className="text-sm font-medium">3,421</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">CTR</span>
                  <span className="text-sm font-medium">2.75%</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Spend</span>
                  <span className="text-sm font-medium">€1,234.56</span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>ABO</CardTitle>
              <CardDescription>Ad Set Budget Optimization</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Impressions</span>
                  <span className="text-sm font-medium">89,421</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Clicks</span>
                  <span className="text-sm font-medium">2,103</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">CTR</span>
                  <span className="text-sm font-medium">2.35%</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Spend</span>
                  <span className="text-sm font-medium">€892.34</span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Testing-ABO</CardTitle>
              <CardDescription>A/B Testing Kampagne</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Impressions</span>
                  <span className="text-sm font-medium">45,678</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Clicks</span>
                  <span className="text-sm font-medium">1,234</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">CTR</span>
                  <span className="text-sm font-medium">2.70%</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Spend</span>
                  <span className="text-sm font-medium">€567.89</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Performance-Trend</CardTitle>
            <CardDescription>Entwicklung der letzten 30 Tage</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-center py-12 bg-muted rounded-lg">
              <p className="text-muted-foreground">
                Performance-Chart wird hier implementiert (Recharts)
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
