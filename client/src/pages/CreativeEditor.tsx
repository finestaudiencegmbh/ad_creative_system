import DashboardLayout from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft } from "lucide-react";
import { Link } from "wouter";

export default function CreativeEditor() {
  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Link href="/creatives">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold">Creative Editor</h1>
            <p className="text-muted-foreground mt-2">
              Erstellen Sie hochwertige Ad-Creatives mit dem Fabric.js Editor
            </p>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Editor wird geladen...</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-center py-12 bg-muted rounded-lg">
              <p className="text-muted-foreground">
                Fabric.js Canvas wird hier implementiert
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
