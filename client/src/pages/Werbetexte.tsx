import DashboardLayout from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AnimatedBackground } from "@/components/AnimatedBackground";
import { Copy, Sparkles, Check } from "lucide-react";
import { useState, useEffect } from "react";
import { toast } from "sonner";
import { trpc } from "@/lib/trpc";

export default function Werbetexte() {
  const [url, setUrl] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [copiedShort, setCopiedShort] = useState(false);
  const [copiedLong, setCopiedLong] = useState(false);
  const [placeholder, setPlaceholder] = useState("");
  const fullPlaceholder = "Hier Landingpage eingeben...";

  const [generatedCopy, setGeneratedCopy] = useState<{
    short: string;
    long: string;
  } | null>(null);

  // Animated placeholder
  useEffect(() => {
    if (url) return;

    let currentIndex = 0;
    const interval = setInterval(() => {
      if (currentIndex <= fullPlaceholder.length) {
        setPlaceholder(fullPlaceholder.slice(0, currentIndex));
        currentIndex++;
      } else {
        setTimeout(() => {
          currentIndex = 0;
          setPlaceholder("");
        }, 2000);
      }
    }, 100);

    return () => clearInterval(interval);
  }, [url]);

  const generateCopyMutation = trpc.ai.generateAdCopy.useMutation({
    onSuccess: (data) => {
      setGeneratedCopy(data);
      setIsGenerating(false);
      setShowResults(true);
      toast.success("Werbetexte erfolgreich generiert!");
    },
    onError: (error) => {
      setIsGenerating(false);
      toast.error(`Fehler: ${error.message}`);
    },
  });

  const handleGenerate = () => {
    if (!url) {
      toast.error("Bitte gib eine Landing Page URL ein");
      return;
    }

    // Validate URL format
    try {
      new URL(url);
    } catch {
      toast.error("Bitte gib eine gültige URL ein (z.B. https://example.com)");
      return;
    }

    setIsGenerating(true);
    generateCopyMutation.mutate({ landingPageUrl: url });
  };

  const copyToClipboard = (text: string, isShort: boolean) => {
    navigator.clipboard.writeText(text);
    if (isShort) {
      setCopiedShort(true);
      setTimeout(() => setCopiedShort(false), 2000);
    } else {
      setCopiedLong(true);
      setTimeout(() => setCopiedLong(false), 2000);
    }
    toast.success("In Zwischenablage kopiert!");
  };

  return (
    <DashboardLayout>
      <AnimatedBackground />
      
      <div className="relative z-10 space-y-8 max-w-5xl mx-auto">
        <div>
          <h1 className="text-4xl font-bold tracking-tight text-balance mb-2">Werbetexte</h1>
          <p className="text-lg text-muted-foreground">
            Professionelle Ad Copy wie von einem Elite Copywriter – analysiert Landing Page für perfekte Brücke zur
            Zielseite
          </p>
        </div>

        <div className="relative overflow-hidden rounded-2xl bg-card/50 backdrop-blur-xl border border-border/50 p-8 shadow-xl">
          <div className="absolute inset-0 bg-gradient-to-br from-accent/5 via-transparent to-transparent pointer-events-none" />

          <div className="relative space-y-6">
            <div className="space-y-3">
              <Label htmlFor="url" className="text-base font-semibold">
                Landing Page URL
              </Label>
              <p className="text-sm text-muted-foreground">
                Gib die URL deiner Landing Page ein, um professionelle Werbetexte zu generieren (kurz + lang)
              </p>
              <Input
                id="url"
                type="url"
                placeholder={placeholder}
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    handleGenerate();
                  }
                }}
                className="h-14 text-base bg-background/60 border-border/60 focus:border-accent transition-all duration-200"
              />
            </div>

            <button
              onClick={handleGenerate}
              disabled={!url || isGenerating}
              className="group relative h-14 px-8 overflow-hidden rounded-xl font-semibold text-base transition-all duration-300 hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-accent/20 via-accent/30 to-accent/20 backdrop-blur-xl" />
              <div className="absolute inset-[1px] bg-gradient-to-br from-background/80 via-background/60 to-background/80 rounded-[11px]" />

              <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500">
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
              </div>

              <div className="absolute inset-0 opacity-0 group-hover:opacity-100 blur-xl transition-opacity duration-300 bg-accent/30" />

              <div className="relative flex items-center justify-center text-foreground">
                {isGenerating ? (
                  <>
                    <Sparkles className="w-5 h-5 mr-2 animate-spin" />
                    Generiere Werbetexte...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-5 h-5 mr-2" />
                    Werbetexte generieren
                  </>
                )}
              </div>
            </button>
          </div>
        </div>

        {showResults && generatedCopy && (
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
            {/* Short Copy */}
            <div className="group relative overflow-hidden rounded-2xl bg-card/50 backdrop-blur-xl border border-border/50 p-8 shadow-xl hover:shadow-2xl hover:shadow-accent/10 transition-all duration-300">
              <div className="absolute inset-0 bg-gradient-to-br from-accent/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />

              <div className="relative space-y-4">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <h3 className="text-xl font-bold mb-1">Kurzer Werbetext</h3>
                    <p className="text-sm text-muted-foreground">
                      Kompakt und prägnant – ideal für Feed Ads und kurze Aufmerksamkeitsspanne
                    </p>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => copyToClipboard(generatedCopy.short, true)}
                    className="shrink-0 h-10 px-4 hover:bg-accent/20 transition-all duration-200"
                  >
                    {copiedShort ? (
                      <>
                        <Check className="w-4 h-4 mr-2" />
                        Kopiert
                      </>
                    ) : (
                      <>
                        <Copy className="w-4 h-4 mr-2" />
                        Kopieren
                      </>
                    )}
                  </Button>
                </div>

                <div className="p-6 rounded-xl bg-background/60 border border-border/30">
                  <div className="prose prose-invert prose-sm max-w-none">
                    <div className="whitespace-pre-wrap text-sm leading-relaxed text-foreground/90">
                      {generatedCopy.short}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Long Copy */}
            <div className="group relative overflow-hidden rounded-2xl bg-card/50 backdrop-blur-xl border border-border/50 p-8 shadow-xl hover:shadow-2xl hover:shadow-accent/10 transition-all duration-300">
              <div className="absolute inset-0 bg-gradient-to-br from-accent/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />

              <div className="relative space-y-4">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <h3 className="text-xl font-bold mb-1">Langer Werbetext</h3>
                    <p className="text-sm text-muted-foreground">
                      Ausführlich und überzeugend – ideal für warme Zielgruppen und detaillierte Argumentation
                    </p>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => copyToClipboard(generatedCopy.long, false)}
                    className="shrink-0 h-10 px-4 hover:bg-accent/20 transition-all duration-200"
                  >
                    {copiedLong ? (
                      <>
                        <Check className="w-4 h-4 mr-2" />
                        Kopiert
                      </>
                    ) : (
                      <>
                        <Copy className="w-4 h-4 mr-2" />
                        Kopieren
                      </>
                    )}
                  </Button>
                </div>

                <div className="p-6 rounded-xl bg-background/60 border border-border/30 max-h-[600px] overflow-y-auto">
                  <div className="prose prose-invert prose-sm max-w-none">
                    <div className="whitespace-pre-wrap text-sm leading-relaxed text-foreground/90">
                      {generatedCopy.long}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
