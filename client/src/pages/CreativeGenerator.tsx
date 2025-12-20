import DashboardLayout from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Sparkles } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

export default function CreativeGenerator() {
  const [format, setFormat] = useState<string>("");
  const [prompt, setPrompt] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);

  const handleGenerate = () => {
    if (!format) {
      toast.error("Bitte wähle ein Format aus");
      return;
    }
    if (!prompt.trim()) {
      toast.error("Bitte beschreibe, was du erstellen möchtest");
      return;
    }

    setIsGenerating(true);
    toast.info("Creative wird generiert... Das dauert ca. 10-15 Sekunden");

    // Simulation - später mit echtem API-Call ersetzen
    setTimeout(() => {
      setIsGenerating(false);
      toast.success("Creative erfolgreich generiert!");
    }, 3000);
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Creative Generator</h1>
          <p className="text-muted-foreground mt-2">
            Erstelle hochwertige Ad-Creatives auf Knopfdruck mit KI-Power
          </p>
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Einstellungen</CardTitle>
              <CardDescription>
                Wähle das Format und beschreibe, was du erstellen möchtest
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="format">Format</Label>
                <Select value={format} onValueChange={setFormat}>
                  <SelectTrigger id="format">
                    <SelectValue placeholder="Format auswählen" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="feed">Feed (1080×1420)</SelectItem>
                    <SelectItem value="story">Story (1080×1930)</SelectItem>
                    <SelectItem value="both">Beide Formate</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="prompt">Beschreibung</Label>
                <Textarea
                  id="prompt"
                  placeholder="Beschreibe, was du erstellen möchtest... z.B. 'Erstelle ein Creative für unsere neue Produktlinie mit modernem Design und Call-to-Action'"
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  rows={6}
                />
              </div>

              <Button 
                onClick={handleGenerate} 
                disabled={isGenerating}
                className="w-full"
                size="lg"
              >
                <Sparkles className="mr-2 h-4 w-4" />
                {isGenerating ? "Generiere..." : "Creative generieren"}
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Vorschau</CardTitle>
              <CardDescription>
                Hier siehst du eine Vorschau deines generierten Creatives
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-center bg-muted rounded-lg aspect-[3/4] min-h-[400px]">
                <p className="text-muted-foreground">
                  {isGenerating 
                    ? "Creative wird generiert..." 
                    : "Keine Vorschau verfügbar"}
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Wie funktioniert's?</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <div className="w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold">
                  1
                </div>
                <h3 className="font-semibold">Format wählen</h3>
                <p className="text-sm text-muted-foreground">
                  Wähle zwischen Feed (1080×1420) und Story (1080×1930) Format
                </p>
              </div>
              <div className="space-y-2">
                <div className="w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold">
                  2
                </div>
                <h3 className="font-semibold">Beschreiben</h3>
                <p className="text-sm text-muted-foreground">
                  Beschreibe, was du erstellen möchtest - die KI macht den Rest
                </p>
              </div>
              <div className="space-y-2">
                <div className="w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold">
                  3
                </div>
                <h3 className="font-semibold">Generieren & Anpassen</h3>
                <p className="text-sm text-muted-foreground">
                  Lass die KI arbeiten und passe das Ergebnis nach Bedarf an
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
