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
import { Users, Plus, Edit, Trash2, Building2 } from "lucide-react";
import DashboardLayout from "@/components/DashboardLayout";

export default function Accounts() {
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [selectedAccount, setSelectedAccount] = useState<any>(null);

  const { data: accounts, isLoading } = trpc.accounts.list.useQuery();
  const utils = trpc.useUtils();

  const createMutation = trpc.accounts.create.useMutation({
    onSuccess: () => {
      utils.accounts.list.invalidate();
      setIsCreateDialogOpen(false);
      alert("Account erfolgreich erstellt!");
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

  const handleCreate = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    createMutation.mutate({
      companyName: formData.get("companyName") as string,
      email: formData.get("email") as string,
      password: formData.get("password") as string,
      name: formData.get("name") as string || undefined,
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
      <div className="container py-8">
        <div className="flex items-center gap-2 mb-6">
          <Users className="h-6 w-6" />
          <h1 className="text-3xl font-bold">Accounts</h1>
        </div>
        <p>Lädt...</p>
      </div>
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
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="companyName">Firmenname *</Label>
                  <Input id="companyName" name="companyName" required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="name">Ansprechpartner</Label>
                  <Input id="name" name="name" />
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="email">E-Mail *</Label>
                  <Input id="email" name="email" type="email" required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="password">Passwort *</Label>
                  <Input id="password" name="password" type="password" required minLength={8} />
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
                <Button type="button" variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
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
                      {account.primaryUser?.email || "Kein Benutzer"}
                      {account.primaryUser?.name && ` • ${account.primaryUser.name}`}
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
                  <span className="text-muted-foreground">Meta Ad Account ID:</span>
                  <p className="font-mono">{account.metaAdAccountId || "Nicht konfiguriert"}</p>
                </div>
                <div>
                  <span className="text-muted-foreground">Status:</span>
                  <p>{account.isActive ? "✅ Aktiv" : "❌ Inaktiv"}</p>
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
          {selectedAccount && (
            <form onSubmit={handleUpdate} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="edit-companyName">Firmenname</Label>
                <Input
                  id="edit-companyName"
                  name="companyName"
                  defaultValue={selectedAccount.companyName}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="edit-metaAccessToken">Meta Access Token</Label>
                <Input
                  id="edit-metaAccessToken"
                  name="metaAccessToken"
                  defaultValue={selectedAccount.metaAccessToken || ""}
                  placeholder="EAAG..."
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="edit-metaAdAccountId">Meta Ad Account ID</Label>
                <Input
                  id="edit-metaAdAccountId"
                  name="metaAdAccountId"
                  defaultValue={selectedAccount.metaAdAccountId || ""}
                  placeholder="act_..."
                />
              </div>

              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={() => setIsEditDialogOpen(false)}>
                  Abbrechen
                </Button>
                <Button type="submit" disabled={updateMutation.isPending}>
                  {updateMutation.isPending ? "Wird gespeichert..." : "Speichern"}
                </Button>
              </div>
            </form>
          )}
        </DialogContent>
      </Dialog>
      </div>
    </DashboardLayout>
  );
}
