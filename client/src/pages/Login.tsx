import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Link } from "wouter";
import { AnimatedBackground } from "@/components/AnimatedBackground";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const utils = trpc.useUtils();

  const loginMutation = trpc.auth.login.useMutation({
    onSuccess: (data) => {
      // Store token in localStorage
      localStorage.setItem("auth_token", data.token);
      
      // Update auth state
      utils.auth.me.setData(undefined, data.user as any);
      
      // Redirect to dashboard
      window.location.href = "/";
    },
    onError: (error) => {
      alert(`Login fehlgeschlagen: ${error.message}`);
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    loginMutation.mutate({ email, password });
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4 relative">
      <AnimatedBackground />
      
      <div className="relative z-10 w-full max-w-md animate-in fade-in duration-500">
        {/* Logo */}
        <div className="flex justify-center mb-12">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-xl bg-foreground flex items-center justify-center">
              <div className="text-background font-bold text-xl">F</div>
            </div>
            <span className="text-2xl font-semibold tracking-tight">Finest Ads</span>
          </div>
        </div>

        {/* Login Card */}
        <div className="bg-card border border-border rounded-2xl shadow-sm p-8 md:p-10">
          <div className="mb-8 text-center">
            <h1 className="text-3xl font-semibold tracking-tight mb-2 text-balance">Anmelden</h1>
            <p className="text-muted-foreground text-sm">Melden Sie sich bei Ihrem Account an</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="email" className="text-sm font-medium">
                E-Mail-Adresse
              </Label>
              <Input
                id="email"
                type="email"
                placeholder="name@beispiel.de"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoComplete="email"
                className="h-12 px-4 bg-input border-border focus:border-ring transition-colors"
              />
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="password" className="text-sm font-medium">
                  Passwort
                </Label>
                <Link href="/forgot-password">
                  <button type="button" className="text-sm text-accent-foreground hover:text-accent-foreground/80 transition-colors">
                    Vergessen?
                  </button>
                </Link>
              </div>
              <Input
                id="password"
                type="password"
                placeholder="Ihr Passwort"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                autoComplete="current-password"
                className="h-12 px-4 bg-input border-border focus:border-ring transition-colors"
              />
            </div>

            <Button
              type="submit"
              disabled={loginMutation.isPending}
              className="w-full h-12 text-base font-medium bg-primary text-primary-foreground hover:bg-primary/90 transition-all duration-200 active:scale-[0.98]"
            >
              {loginMutation.isPending ? (
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
                  <span>Wird angemeldet...</span>
                </div>
              ) : (
                "Anmelden"
              )}
            </Button>
          </form>
        </div>

        {/* Footer */}
        <div className="mt-6 text-center text-sm text-muted-foreground">
          <p>Powered by Finest Audience GmbH</p>
        </div>
      </div>
    </div>
  );
}
