import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";
import { getLoginUrl } from "@/const";
import { Link } from "wouter";

export default function Home() {
  const { isAuthenticated } = useAuth();

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
      <main className="container max-w-4xl text-center space-y-8 px-4">
        <div className="space-y-4">
          <h1 className="text-5xl font-bold tracking-tight text-foreground">
            Ad Creative System
          </h1>
          <p className="text-xl text-muted-foreground">
            KI-gestützte Creative-Generierung und Performance-Optimierung für Meta Ads
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          {isAuthenticated ? (
            <Link href="/dashboard">
              <Button size="lg" className="gap-2">
                Zum Dashboard
                <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
          ) : (
            <a href={getLoginUrl()}>
              <Button size="lg">Anmelden</Button>
            </a>
          )}
        </div>

        <div className="grid md:grid-cols-3 gap-6 mt-12">
          <div className="bg-white p-6 rounded-lg shadow-sm">
            <h3 className="font-semibold text-lg mb-2">Automatische Generierung</h3>
            <p className="text-sm text-muted-foreground">
              Erstellen Sie hochwertige Ad-Creatives auf Knopfdruck mit FLUX und GPT-4
            </p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow-sm">
            <h3 className="font-semibold text-lg mb-2">Performance-Tracking</h3>
            <p className="text-sm text-muted-foreground">
              Echtzeit-Daten von Meta Ads Manager für datengetriebene Optimierung
            </p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow-sm">
            <h3 className="font-semibold text-lg mb-2">KI-Empfehlungen</h3>
            <p className="text-sm text-muted-foreground">
              Intelligente Vorschläge basierend auf Ihrer Performance-Historie
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}
