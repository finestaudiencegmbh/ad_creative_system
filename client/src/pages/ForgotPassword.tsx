import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { trpc } from "@/lib/trpc";
import { Link } from "wouter";
import { ArrowLeft, Mail } from "lucide-react";

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);

  const requestReset = trpc.passwordReset.requestReset.useMutation({
    onSuccess: () => {
      setSubmitted(true);
    },
    onError: (error) => {
      alert("Fehler: " + error.message);
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    requestReset.mutate({ email });
  };

  if (submitted) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
        <Card className="w-full max-w-md shadow-xl">
          <CardHeader className="space-y-3 text-center">
            <div className="mx-auto w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
              <Mail className="h-6 w-6 text-green-600" />
            </div>
            <CardTitle className="text-2xl">E-Mail versendet</CardTitle>
            <CardDescription className="text-base">
              Falls ein Account mit dieser E-Mail existiert, haben wir Ihnen eine E-Mail mit Anweisungen zum Zurücksetzen Ihres Passworts gesendet.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground text-center">
                Überprüfen Sie Ihren Posteingang und folgen Sie dem Link in der E-Mail.
              </p>
              <Link href="/login">
                <Button variant="outline" className="w-full">
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Zurück zum Login
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <Card className="w-full max-w-md shadow-xl">
        <CardHeader className="space-y-3">
          <CardTitle className="text-2xl text-center">Passwort vergessen?</CardTitle>
          <CardDescription className="text-center">
            Geben Sie Ihre E-Mail-Adresse ein und wir senden Ihnen einen Link zum Zurücksetzen Ihres Passworts.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <label htmlFor="email" className="text-sm font-medium">
                E-Mail
              </label>
              <Input
                id="email"
                type="email"
                placeholder="ihre@email.de"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                disabled={requestReset.isPending}
              />
            </div>

            <Button
              type="submit"
              className="w-full bg-[#8B5CF6] hover:bg-[#7C3AED]"
              disabled={requestReset.isPending}
            >
              {requestReset.isPending ? "Wird gesendet..." : "Reset-Link senden"}
            </Button>

            <Link href="/login">
              <Button variant="ghost" className="w-full" type="button">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Zurück zum Login
              </Button>
            </Link>
          </form>
        </CardContent>
        <div className="px-6 pb-6 text-center text-sm text-muted-foreground">
          Powered by Finest Audience GmbH
        </div>
      </Card>
    </div>
  );
}
