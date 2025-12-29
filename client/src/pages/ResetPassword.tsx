import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { trpc } from "@/lib/trpc";
import { Link, useLocation } from "wouter";
import { ArrowLeft, CheckCircle2 } from "lucide-react";

export default function ResetPassword() {
  const [, setLocation] = useLocation();
  const [token, setToken] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    // Get token from URL query parameter
    const params = new URLSearchParams(window.location.search);
    const tokenParam = params.get("token");
    if (tokenParam) {
      setToken(tokenParam);
    }
  }, []);

  const resetPassword = trpc.passwordReset.resetPassword.useMutation({
    onSuccess: () => {
      setSuccess(true);
      // Redirect to login after 3 seconds
      setTimeout(() => {
        setLocation("/login");
      }, 3000);
    },
    onError: (error) => {
      alert("Fehler: " + error.message);
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (newPassword !== confirmPassword) {
      alert("Passwörter stimmen nicht überein");
      return;
    }

    if (newPassword.length < 8) {
      alert("Passwort muss mindestens 8 Zeichen lang sein");
      return;
    }

    resetPassword.mutate({ token, newPassword });
  };

  if (!token) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
        <Card className="w-full max-w-md shadow-xl">
          <CardHeader className="space-y-3 text-center">
            <CardTitle className="text-2xl">Ungültiger Link</CardTitle>
            <CardDescription>
              Dieser Passwort-Reset-Link ist ungültig oder abgelaufen.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Link href="/forgot-password">
              <Button className="w-full bg-[#8B5CF6] hover:bg-[#7C3AED]">
                Neuen Link anfordern
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (success) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
        <Card className="w-full max-w-md shadow-xl">
          <CardHeader className="space-y-3 text-center">
            <div className="mx-auto w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
              <CheckCircle2 className="h-6 w-6 text-green-600" />
            </div>
            <CardTitle className="text-2xl">Passwort zurückgesetzt</CardTitle>
            <CardDescription className="text-base">
              Ihr Passwort wurde erfolgreich zurückgesetzt. Sie werden in Kürze zum Login weitergeleitet...
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Link href="/login">
              <Button className="w-full bg-[#8B5CF6] hover:bg-[#7C3AED]">
                Jetzt anmelden
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <Card className="w-full max-w-md shadow-xl">
        <CardHeader className="space-y-3">
          <CardTitle className="text-2xl text-center">Neues Passwort setzen</CardTitle>
          <CardDescription className="text-center">
            Geben Sie Ihr neues Passwort ein (mindestens 8 Zeichen).
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <label htmlFor="newPassword" className="text-sm font-medium">
                Neues Passwort
              </label>
              <Input
                id="newPassword"
                type="password"
                placeholder="••••••••"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                required
                minLength={8}
                disabled={resetPassword.isPending}
              />
            </div>

            <div className="space-y-2">
              <label htmlFor="confirmPassword" className="text-sm font-medium">
                Passwort bestätigen
              </label>
              <Input
                id="confirmPassword"
                type="password"
                placeholder="••••••••"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                minLength={8}
                disabled={resetPassword.isPending}
              />
            </div>

            <Button
              type="submit"
              className="w-full bg-[#8B5CF6] hover:bg-[#7C3AED]"
              disabled={resetPassword.isPending}
            >
              {resetPassword.isPending ? "Wird gespeichert..." : "Passwort zurücksetzen"}
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
