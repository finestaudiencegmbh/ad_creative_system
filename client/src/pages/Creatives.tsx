import DashboardLayout from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Plus } from "lucide-react";
import { toast } from "sonner";

export default function Creatives() {
  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Creatives</h1>
            <p className="text-muted-foreground mt-2">
              Erstellen und verwalten Sie Ad-Creatives für Meta Ads
            </p>
          </div>
          <Button onClick={() => toast.info("Creative-Editor wird geladen...")}>
            <Plus className="mr-2 h-4 w-4" />
            Neues Creative
          </Button>
        </div>

        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <p className="text-muted-foreground mb-4">Noch keine Creatives vorhanden</p>
            <Button onClick={() => toast.info("Creative-Editor wird geladen...")}>
              <Plus className="mr-2 h-4 w-4" />
              Erstes Creative erstellen
            </Button>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
