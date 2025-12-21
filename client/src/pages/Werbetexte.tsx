import DashboardLayout from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Copy, Sparkles, CheckCircle2, Loader2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { trpc } from "@/lib/trpc";

export default function Werbetexte() {
  const [landingPageUrl, setLandingPageUrl] = useState("");
  const [generatedCopy, setGeneratedCopy] = useState<{
    short: string;
    long: string;
  } | null>(null);
  const [copiedField, setCopiedField] = useState<string | null>(null);

  const generateCopyMutation = trpc.ai.generateAdCopy.useMutation({
    onSuccess: (data) => {
      setGeneratedCopy(data);
      toast.success("Werbetexte erfolgreich generiert!");
    },
    onError: (error) => {
      toast.error(`Fehler: ${error.message}`);
    },
  });

  const handleGenerate = () => {
    if (!landingPageUrl) {
      toast.error("Bitte gib eine Landing Page URL ein");
      return;
    }

    // Validate URL format
    try {
      new URL(landingPageUrl);
    } catch {
      toast.error("Bitte gib eine gültige URL ein (z.B. https://example.com)");
      return;
    }

    generateCopyMutation.mutate({ landingPageUrl });
  };

  const copyToClipboard = (text: string, field: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(field);
    toast.success("In Zwischenablage kopiert!");
    setTimeout(() => setCopiedField(null), 2000);
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold">Werbetexte</h1>
          <p className="text-sm md:text-base text-muted-foreground mt-2">
            Professionelle Ad Copy wie von einem Elite Copywriter – analysiert Landing Page für perfekte Brücke zur Zielseite
          </p>
        </div>

        {/* Input Section */}
        <Card>
          <CardHeader>
            <CardTitle>Landing Page URL</CardTitle>
            <CardDescription>
              Gib die URL deiner Landing Page ein, um professionelle Werbetexte zu generieren (kurz + lang)
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="landingPageUrl">Landing Page URL</Label>
              <Input
                id="landingPageUrl"
                type="url"
                placeholder="https://example.com/landing-page"
                value={landingPageUrl}
                onChange={(e) => setLandingPageUrl(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    handleGenerate();
                  }
                }}
              />
            </div>

            <Button
              onClick={handleGenerate}
              disabled={generateCopyMutation.isPending || !landingPageUrl}
              size="lg"
              className="w-full sm:w-auto"
            >
              {generateCopyMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Werbetexte werden generiert...
                </>
              ) : (
                <>
                  <Sparkles className="mr-2 h-4 w-4" />
                  Werbetexte generieren
                </>
              )}
            </Button>
          </CardContent>
        </Card>

        {/* Results Section */}
        {generatedCopy && (
          <div className="space-y-6">
            {/* Short Copy */}
            <Card>
              <CardHeader>
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <CardTitle>Kurzer Werbetext</CardTitle>
                    <CardDescription>
                      Kompakt und prägnant – ideal für Feed Ads und kurze Aufmerksamkeitsspanne
                    </CardDescription>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full sm:w-auto"
                    onClick={() => copyToClipboard(generatedCopy.short, "short")}
                  >
                    {copiedField === "short" ? (
                      <>
                        <CheckCircle2 className="mr-2 h-4 w-4" />
                        Kopiert
                      </>
                    ) : (
                      <>
                        <Copy className="mr-2 h-4 w-4" />
                        Kopieren
                      </>
                    )}
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="prose prose-sm max-w-none">
                  <div className="whitespace-pre-wrap bg-muted p-4 rounded-lg">
                    {generatedCopy.short}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Long Copy */}
            <Card>
              <CardHeader>
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <CardTitle>Langer Werbetext</CardTitle>
                    <CardDescription>
                      Ausführlich und überzeugend – ideal für warme Zielgruppen und detaillierte Argumentation
                    </CardDescription>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full sm:w-auto"
                    onClick={() => copyToClipboard(generatedCopy.long, "long")}
                  >
                    {copiedField === "long" ? (
                      <>
                        <CheckCircle2 className="mr-2 h-4 w-4" />
                        Kopiert
                      </>
                    ) : (
                      <>
                        <Copy className="mr-2 h-4 w-4" />
                        Kopieren
                      </>
                    )}
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="prose prose-sm max-w-none">
                  <div className="whitespace-pre-wrap bg-muted p-4 rounded-lg">
                    {generatedCopy.long}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Empty State */}
        {!generatedCopy && !generateCopyMutation.isPending && (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12 text-center">
              <div className="text-muted-foreground space-y-2">
                <p className="text-lg font-medium">Keine Werbetexte generiert</p>
                <p className="text-sm">
                  Gib eine Landing Page URL ein und klicke auf "Werbetexte generieren"
                </p>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </DashboardLayout>
  );
}
