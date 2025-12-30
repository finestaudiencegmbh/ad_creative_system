import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
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
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { Users, Plus, Edit, Trash2, Building2, RefreshCw, ChevronDown, UserPlus, Key } from "lucide-react";
import DashboardLayout from "@/components/DashboardLayout";

// Available tabs for permission management
const AVAILABLE_TABS = [
  { id: "campaigns", label: "Kampagnen" },
  { id: "creatives", label: "Creatives" },
  { id: "performance", label: "Performance" },
  { id: "generator", label: "Creative Generator" },
];

export default function Accounts() {
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [selectedAccount, setSelectedAccount] = useState<any>(null);
  const [generatedPassword, setGeneratedPassword] = useState("");
  
  // User management state
  const [isAddUserDialogOpen, setIsAddUserDialogOpen] = useState(false);
  const [isEditUserDialogOpen, setIsEditUserDialogOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [selectedAccountForUser, setSelectedAccountForUser] = useState<number | null>(null);
  const [selectedTabPermissions, setSelectedTabPermissions] = useState<string[]>([]);
  const [expandedAccounts, setExpandedAccounts] = useState<Set<number>>(new Set());

  const { data: accounts, isLoading } = trpc.accounts.list.useQuery();
  const utils = trpc.useUtils();

  // Account mutations
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

  // User mutations
  const createUserMutation = trpc.users.create.useMutation({
    onSuccess: (data) => {
      utils.accounts.list.invalidate();
      setIsAddUserDialogOpen(false);
      setSelectedAccountForUser(null);
      setSelectedTabPermissions([]);
      alert(`Benutzer erfolgreich hinzugefügt!\n\nTemporäres Passwort: ${data.temporaryPassword}\n\nDer Benutzer erhält eine E-Mail mit den Zugangsdaten.`);
    },
    onError: (error) => {
      alert(`Fehler: ${error.message}`);
    },
  });

  const updateUserMutation = trpc.users.update.useMutation({
    onSuccess: () => {
      utils.accounts.list.invalidate();
      setIsEditUserDialogOpen(false);
      setSelectedUser(null);
      alert("Benutzer erfolgreich aktualisiert!");
    },
    onError: (error) => {
      alert(`Fehler: ${error.message}`);
    },
  });

  const resetPasswordMutation = trpc.users.resetPassword.useMutation({
    onSuccess: (data) => {
      alert(`Passwort erfolgreich zurückgesetzt!\n\nNeues Passwort: ${data.temporaryPassword}\n\nDer Benutzer erhält eine E-Mail mit dem neuen Passwort.`);
    },
    onError: (error) => {
      alert(`Fehler: ${error.message}`);
    },
  });

  const deleteUserMutation = trpc.users.delete.useMutation({
    onSuccess: () => {
      utils.accounts.list.invalidate();
      alert("Benutzer erfolgreich gelöscht!");
    },
    onError: (error) => {
      alert(`Fehler: ${error.message}`);
    },
  });

  const passwordGeneratorQuery = trpc.passwordGenerator.generate.useQuery(
    undefined,
    { enabled: false }
  );

  const generatePassword = async () => {
    try {
      const result = await passwordGeneratorQuery.refetch();
      if (result.data) {
        setGeneratedPassword(result.data.password);
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

  const handleAddUser = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    
    if (!selectedAccountForUser) {
      alert("Kein Account ausgewählt");
      return;
    }

    createUserMutation.mutate({
      accountId: selectedAccountForUser,
      email: formData.get("email") as string,
      firstName: formData.get("firstName") as string,
      lastName: formData.get("lastName") as string,
      tabPermissions: selectedTabPermissions.length > 0 ? selectedTabPermissions : null,
    });
  };

  const handleUpdateUser = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    
    if (!selectedUser) return;

    updateUserMutation.mutate({
      id: selectedUser.id,
      email: formData.get("email") as string || undefined,
      name: formData.get("name") as string || undefined,
      tabPermissions: selectedTabPermissions.length > 0 ? selectedTabPermissions : null,
    });
  };

  const handleDeleteUser = (userId: number, userName: string) => {
    if (confirm(`Benutzer "${userName}" wirklich löschen? Dies kann nicht rückgängig gemacht werden.`)) {
      deleteUserMutation.mutate({ id: userId });
    }
  };

  const toggleAccountExpansion = (accountId: number) => {
    const newExpanded = new Set(expandedAccounts);
    if (newExpanded.has(accountId)) {
      newExpanded.delete(accountId);
    } else {
      newExpanded.add(accountId);
    }
    setExpandedAccounts(newExpanded);
  };

  const toggleTabPermission = (tabId: string) => {
    setSelectedTabPermissions(prev => 
      prev.includes(tabId) 
        ? prev.filter(id => id !== tabId)
        : [...prev, tabId]
    );
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
          
          {/* Create Account Dialog */}
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
                  <Input id="companyName" name="companyName" required />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="firstName">Vorname *</Label>
                    <Input id="firstName" name="firstName" required />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="lastName">Nachname *</Label>
                    <Input id="lastName" name="lastName" required />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="email">E-Mail *</Label>
                    <Input id="email" name="email" type="email" required />
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

        {/* Accounts List */}
        <div className="grid gap-4">
          {accounts?.map((account) => {
            const isExpanded = expandedAccounts.has(account.id);
            const accountUsers = account.users || [];
            
            return (
              <Card key={account.id}>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3 flex-1">
                      <Building2 className="h-5 w-5 text-muted-foreground" />
                      <div className="flex-1">
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
                          setSelectedAccountForUser(account.id);
                          setSelectedTabPermissions([]);
                          setIsAddUserDialogOpen(true);
                        }}
                        title="Benutzer hinzufügen"
                      >
                        <UserPlus className="h-4 w-4" />
                      </Button>
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
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => toggleAccountExpansion(account.id)}
                      >
                        <ChevronDown className={`h-4 w-4 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-4 text-sm mb-4">
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

                  {/* Users List (Collapsible) */}
                  {isExpanded && (
                    <div className="border-t pt-4 mt-4">
                      <h4 className="font-semibold mb-3 flex items-center gap-2">
                        <Users className="h-4 w-4" />
                        Benutzer ({accountUsers.length})
                      </h4>
                      {accountUsers.length === 0 ? (
                        <p className="text-sm text-muted-foreground">Keine weiteren Benutzer</p>
                      ) : (
                        <div className="space-y-2">
                          {accountUsers.map((user: any) => (
                            <div key={user.id} className="flex items-center justify-between p-3 border rounded-lg">
                              <div className="flex-1">
                                <p className="font-medium">{user.name || user.email}</p>
                                <p className="text-sm text-muted-foreground">{user.email}</p>
                                {user.tabPermissions && (
                                  <p className="text-xs text-muted-foreground mt-1">
                                    Zugriff: {user.tabPermissions.map((tab: string) => 
                                      AVAILABLE_TABS.find(t => t.id === tab)?.label || tab
                                    ).join(", ")}
                                  </p>
                                )}
                                {!user.tabPermissions && (
                                  <p className="text-xs text-muted-foreground mt-1">Zugriff: Alle Bereiche</p>
                                )}
                              </div>
                              <div className="flex gap-2">
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => resetPasswordMutation.mutate({ userId: user.id })}
                                  title="Passwort zurücksetzen"
                                >
                                  <Key className="h-4 w-4" />
                                </Button>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => {
                                    setSelectedUser(user);
                                    setSelectedTabPermissions(user.tabPermissions || []);
                                    setIsEditUserDialogOpen(true);
                                  }}
                                >
                                  <Edit className="h-4 w-4" />
                                </Button>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handleDeleteUser(user.id, user.name || user.email)}
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Edit Account Dialog */}
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

        {/* Add User Dialog */}
        <Dialog open={isAddUserDialogOpen} onOpenChange={setIsAddUserDialogOpen}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Benutzer hinzufügen</DialogTitle>
              <DialogDescription>
                Fügen Sie einen neuen Benutzer zu diesem Account hinzu.
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleAddUser} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="user-firstName">Vorname *</Label>
                  <Input id="user-firstName" name="firstName" required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="user-lastName">Nachname *</Label>
                  <Input id="user-lastName" name="lastName" required />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="user-email">E-Mail *</Label>
                <Input id="user-email" name="email" type="email" required />
              </div>

              <div className="space-y-2">
                <Label>Zugriffsberechtigungen</Label>
                <p className="text-sm text-muted-foreground mb-3">
                  Wählen Sie die Bereiche aus, auf die dieser Benutzer zugreifen darf. Keine Auswahl = Zugriff auf alle Bereiche.
                </p>
                <div className="space-y-2">
                  {AVAILABLE_TABS.map(tab => (
                    <div key={tab.id} className="flex items-center space-x-2">
                      <Checkbox
                        id={`tab-${tab.id}`}
                        checked={selectedTabPermissions.includes(tab.id)}
                        onCheckedChange={() => toggleTabPermission(tab.id)}
                      />
                      <label
                        htmlFor={`tab-${tab.id}`}
                        className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                      >
                        {tab.label}
                      </label>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex justify-end gap-2">
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => {
                    setIsAddUserDialogOpen(false);
                    setSelectedAccountForUser(null);
                    setSelectedTabPermissions([]);
                  }}
                >
                  Abbrechen
                </Button>
                <Button type="submit" disabled={createUserMutation.isPending}>
                  {createUserMutation.isPending ? "Wird hinzugefügt..." : "Benutzer hinzufügen"}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>

        {/* Edit User Dialog */}
        <Dialog open={isEditUserDialogOpen} onOpenChange={setIsEditUserDialogOpen}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Benutzer bearbeiten</DialogTitle>
              <DialogDescription>
                Aktualisieren Sie die Benutzer-Informationen und Berechtigungen.
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleUpdateUser} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="edit-user-name">Name</Label>
                <Input 
                  id="edit-user-name" 
                  name="name" 
                  defaultValue={selectedUser?.name || ""}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="edit-user-email">E-Mail</Label>
                <Input 
                  id="edit-user-email" 
                  name="email" 
                  type="email"
                  defaultValue={selectedUser?.email || ""}
                />
              </div>

              <div className="space-y-2">
                <Label>Zugriffsberechtigungen</Label>
                <p className="text-sm text-muted-foreground mb-3">
                  Wählen Sie die Bereiche aus, auf die dieser Benutzer zugreifen darf. Keine Auswahl = Zugriff auf alle Bereiche.
                </p>
                <div className="space-y-2">
                  {AVAILABLE_TABS.map(tab => (
                    <div key={tab.id} className="flex items-center space-x-2">
                      <Checkbox
                        id={`edit-tab-${tab.id}`}
                        checked={selectedTabPermissions.includes(tab.id)}
                        onCheckedChange={() => toggleTabPermission(tab.id)}
                      />
                      <label
                        htmlFor={`edit-tab-${tab.id}`}
                        className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                      >
                        {tab.label}
                      </label>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex justify-end gap-2">
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => {
                    setIsEditUserDialogOpen(false);
                    setSelectedUser(null);
                    setSelectedTabPermissions([]);
                  }}
                >
                  Abbrechen
                </Button>
                <Button type="submit" disabled={updateUserMutation.isPending}>
                  {updateUserMutation.isPending ? "Wird aktualisiert..." : "Speichern"}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
}
