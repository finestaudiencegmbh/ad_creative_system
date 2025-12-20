import DashboardLayout from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Copy, Sparkles } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

export default function Werbetexte() {
  const [format, setFormat] = useState<string>("");
  const [goal, setGoal] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedTexts, setGeneratedTexts] = useState<Array<{
    headline: string;
    bodyText: string;
    callToAction: string;
  }>>([]);

  const handleGenerate = () => {
    if (!format) {
      toast.error("Bitte wähle ein Format aus");
      return;
    }
    if (!goal.trim()) {
      toast.error("Bitte beschreibe dein Kommunikationsziel");
      return;
    }

    setIsGenerating(true);
    toast.info("Werbetexte werden generiert...");

    // Simulation - später mit echtem API-Call ersetzen
    setTimeout(() => {
      setGeneratedTexts([
        {
          headline: "Deine Zielgruppe wartet auf dich",
          bodyText: "Erreiche genau die Menschen, die dein Angebot brauchen. Mit präzisem Targeting und datengetriebenen Insights.",
          callToAction: "Jetzt starten"
        },
        {
          headline: "Performance, die überzeugt",
          bodyText: "Steigere deine Conversion-Rate mit Kampagnen, die wirklich funktionieren. Messbar. Skalierbar. Profitabel.",
          callToAction: "Mehr erfahren"
        },
        {
          headline: "Wachstum auf Knopfdruck",
          bodyText: "Automatisierte Kampagnen, die rund um die Uhr für dich arbeiten. Mehr Leads, mehr Sales, mehr Erfolg.",
          callToAction: "Demo anfragen"
        }
      ]);
      setIsGenerating(false);
      toast.success("3 Varianten erfolgreich generiert!");
    }, 2000);
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success("In Zwischenablage kopiert!");
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Werbetexte</h1>
          <p className="text-muted-foreground mt-2">
            Generiere überzeugende Headlines und Ad-Copy mit KI
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Einstellungen</CardTitle>
            <CardDescription>
              Beschreibe dein Kommunikationsziel und lass die KI überzeugende Texte erstellen
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="format">Format</Label>
                <Select value={format} onValueChange={setFormat}>
                  <SelectTrigger id="format">
                    <SelectValue placeholder="Format auswählen" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="feed">Feed (längere Texte)</SelectItem>
                    <SelectItem value="story">Story (kurze Texte)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="goal">Kommunikationsziel</Label>
              <Textarea
                id="goal"
                placeholder="Beschreibe dein Kommunikationsziel... z.B. 'Ich möchte mehr Leads für meine Marketing-Agentur generieren. Zielgruppe sind B2B-Unternehmen mit 10-50 Mitarbeitern.'"
                value={goal}
                onChange={(e) => setGoal(e.target.value)}
                rows={4}
              />
            </div>

            <Button 
              onClick={handleGenerate} 
              disabled={isGenerating}
              size="lg"
            >
              <Sparkles className="mr-2 h-4 w-4" />
              {isGenerating ? "Generiere..." : "Werbetexte generieren"}
            </Button>
          </CardContent>
        </Card>

        {generatedTexts.length > 0 && (
          <div className="space-y-4">
            <h2 className="text-2xl font-bold">Generierte Varianten</h2>
            <div className="grid gap-4 md:grid-cols-3">
              {generatedTexts.map((text, index) => (
                <Card key={index}>
                  <CardHeader>
                    <CardTitle className="text-lg">Variante {index + 1}</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <Label className="text-xs text-muted-foreground">Headline</Label>
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="h-6 w-6"
                          onClick={() => copyToClipboard(text.headline)}
                        >
                          <Copy className="h-3 w-3" />
                        </Button>
                      </div>
                      <p className="font-semibold">{text.headline}</p>
                    </div>

                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <Label className="text-xs text-muted-foreground">Body Text</Label>
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="h-6 w-6"
                          onClick={() => copyToClipboard(text.bodyText)}
                        >
                          <Copy className="h-3 w-3" />
                        </Button>
                      </div>
                      <p className="text-sm">{text.bodyText}</p>
                    </div>

                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <Label className="text-xs text-muted-foreground">Call-to-Action</Label>
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="h-6 w-6"
                          onClick={() => copyToClipboard(text.callToAction)}
                        >
                          <Copy className="h-3 w-3" />
                        </Button>
                      </div>
                      <p className="text-sm font-medium">{text.callToAction}</p>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
