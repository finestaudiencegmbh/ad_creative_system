import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Users, Plus, Edit, Trash2, Building2, RefreshCw } from "lucide-react";
import DashboardLayout from "@/components/DashboardLayout";

export default function Accounts() {
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [selectedAccount, setSelectedAccount] = useState<any>(null);
  const [generatedPassword, setGeneratedPassword] = useState("");

  const { data: accounts, isLoading } = trpc.accounts.list.useQuery();
  const utils = trpc.useUtils();

  const createMutation = trpc.accounts.create.useMutation({
    onSuccess: () => {
      utils.accounts.list.invalidate();
      setIsCreateDialogOpen(false);
      setGeneratedPassword("");
      alert("Account erfolgreich erstellt! Der Benutzer erhält eine E-Mail mit den Zugangsdaten.");
    },
    onError: (error) => {
      alert(`Fehler: ${error.message}`);
    },
  });

  const updateMutation = trpc.accounts.update.useMutation({
    onSuccess: () => {
      utils.accounts.list.invalidate();
      setIsEditDialogOpen(false);
      alert("Account erfolgreich aktualisiert!");
    },
    onError: (error) => {
      alert(`Fehler: ${error.message}`);
    },
  });

  const deleteMutation = trpc.accounts.delete.useMutation({
    onSuccess: () => {
      utils.accounts.list.invalidate();
      alert("Account erfolgreich gelöscht!");
    },
    onError: (error) => {
      alert(`Fehler: ${error.message}`);
    },
  });

  const passwordGeneratorQuery = trpc.passwordGenerator.generate.useQuery(
    undefined,
    { enabled: false } // Don't auto-fetch
  );

  const generatePassword = async () => {
    try {
      const result = await passwordGeneratorQuery.refetch();
      if (result.data) {
        setGeneratedPassword(result.data.password);
        // Update password input field
        const passwordInput = document.getElementById("password") as HTMLInputElement;
        if (passwordInput) {
          passwordInput.value = result.data.password;
        }
      }
    } catch (error) {
      console.error("Failed to generate password:", error);
    }
  };

  const handleCreate = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    createMutation.mutate({
      companyName: formData.get("companyName") as string,
      firstName: formData.get("firstName") as string,
      lastName: formData.get("lastName") as string,
      email: formData.get("email") as string,
      password: formData.get("password") as string,
      metaAccessToken: formData.get("metaAccessToken") as string || undefined,
      metaAdAccountId: formData.get("metaAdAccountId") as string || undefined,
    });
  };

  const handleUpdate = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    updateMutation.mutate({
      id: selectedAccount.id,
      companyName: formData.get("companyName") as string || undefined,
      metaAccessToken: formData.get("metaAccessToken") as string || undefined,
      metaAdAccountId: formData.get("metaAdAccountId") as string || undefined,
    });
  };

  const handleDelete = (accountId: number, companyName: string) => {
    if (confirm(`Account "${companyName}" wirklich löschen? Dies kann nicht rückgängig gemacht werden.`)) {
      deleteMutation.mutate({ id: accountId });
    }
  };

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="container py-8">
          <div className="flex items-center gap-2 mb-6">
            <Users className="h-6 w-6" />
            <h1 className="text-3xl font-bold">Accounts</h1>
          </div>
          <p>Lädt...</p>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="container py-8">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            <Users className="h-6 w-6" />
            <h1 className="text-3xl font-bold">Accounts</h1>
          </div>
          <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Neuer Account
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Neuen Account anlegen</DialogTitle>
                <DialogDescription>
                  Erstellen Sie einen neuen Kunden-Account mit Zugangsdaten und Meta API Credentials.
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleCreate} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="companyName">Firmenname *</Label>
                  <Input id="companyName" name="companyName" placeholder="Finest Audience GmbH" required />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="firstName">Vorname *</Label>
                    <Input id="firstName" name="firstName" placeholder="Jan" required />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="lastName">Nachname *</Label>
                    <Input id="lastName" name="lastName" placeholder="Ortmüller" required />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="email">E-Mail *</Label>
                    <Input id="email" name="email" type="email" placeholder="jan@marketing-estate.de" required />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="password">Passwort *</Label>
                    <div className="flex gap-2">
                      <Input 
                        id="password" 
                        name="password" 
                        type="text" 
                        placeholder="Mindestens 8 Zeichen"
                        required 
                        minLength={8}
                        className="flex-1"
                      />
                      <Button
                        type="button"
                        variant="outline"
                        size="icon"
                        onClick={generatePassword}
                        title="Passwort generieren"
                      >
                        <RefreshCw className="h-4 w-4" />
                      </Button>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Tipp: Klicken Sie auf das Symbol um ein sicheres Passwort zu generieren
                    </p>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="metaAccessToken">Meta Access Token</Label>
                  <Input id="metaAccessToken" name="metaAccessToken" placeholder="EAAG..." />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="metaAdAccountId">Meta Ad Account ID</Label>
                  <Input id="metaAdAccountId" name="metaAdAccountId" placeholder="act_..." />
                </div>

                <div className="flex justify-end gap-2">
                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={() => {
                      setIsCreateDialogOpen(false);
                      setGeneratedPassword("");
                    }}
                  >
                    Abbrechen
                  </Button>
                  <Button type="submit" disabled={createMutation.isPending}>
                    {createMutation.isPending ? "Wird erstellt..." : "Account erstellen"}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        <div className="grid gap-4">
          {accounts?.map((account) => (
            <Card key={account.id}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <Building2 className="h-5 w-5 text-muted-foreground" />
                    <div>
                      <CardTitle>{account.companyName}</CardTitle>
                      <CardDescription>
                        {account.email || "Keine E-Mail"}
                        {account.firstName && account.lastName && ` • ${account.firstName} ${account.lastName}`}
                      </CardDescription>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setSelectedAccount(account);
                        setIsEditDialogOpen(true);
                      }}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDelete(account.id, account.companyName)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-muted-foreground">Meta Access Token</p>
                    <p className="font-mono text-xs truncate">
                      {account.metaAccessToken ? `${account.metaAccessToken.substring(0, 20)}...` : "Nicht konfiguriert"}
                    </p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Meta Ad Account ID</p>
                    <p className="font-mono text-xs">
                      {account.metaAdAccountId || "Nicht konfiguriert"}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Edit Dialog */}
        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Account bearbeiten</DialogTitle>
              <DialogDescription>
                Aktualisieren Sie die Meta API Credentials für diesen Account.
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleUpdate} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="edit-companyName">Firmenname</Label>
                <Input 
                  id="edit-companyName" 
                  name="companyName" 
                  defaultValue={selectedAccount?.companyName}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="edit-metaAccessToken">Meta Access Token</Label>
                <Input 
                  id="edit-metaAccessToken" 
                  name="metaAccessToken" 
                  placeholder="EAAG..."
                  defaultValue={selectedAccount?.metaAccessToken || ""}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="edit-metaAdAccountId">Meta Ad Account ID</Label>
                <Input 
                  id="edit-metaAdAccountId" 
                  name="metaAdAccountId" 
                  placeholder="act_..."
                  defaultValue={selectedAccount?.metaAdAccountId || ""}
                />
              </div>

              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={() => setIsEditDialogOpen(false)}>
                  Abbrechen
                </Button>
                <Button type="submit" disabled={updateMutation.isPending}>
                  {updateMutation.isPending ? "Wird aktualisiert..." : "Speichern"}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
}
