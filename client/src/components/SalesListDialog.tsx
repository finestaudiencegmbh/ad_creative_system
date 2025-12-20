import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { Pencil, Trash2, X, Check } from "lucide-react";
import { format } from "date-fns";
import { de } from "date-fns/locale";

interface SalesListDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  entityId: string;
  entityType: "campaign" | "adset" | "ad";
  entityName: string;
}

interface SaleItem {
  id: number;
  orderValue: string;
  cashCollect: string;
  completionDate: Date;
  notes: string | null;
}

export function SalesListDialog({ open, onOpenChange, entityId, entityType, entityName }: SalesListDialogProps) {
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editForm, setEditForm] = useState<{
    orderValue: string;
    cashCollect: string;
    completionDate: string;
    notes: string;
  }>({
    orderValue: "",
    cashCollect: "",
    completionDate: "",
    notes: "",
  });

  const utils = trpc.useUtils();

  // Build query params based on entity type
  const queryParams: any = {};
  if (entityType === "campaign") {
    queryParams.metaCampaignId = entityId;
  } else if (entityType === "adset") {
    queryParams.metaAdSetId = entityId;
  } else {
    queryParams.metaAdId = entityId;
  }

  const { data: sales, isLoading } = trpc.sales.listByEntity.useQuery(queryParams);

  const updateSale = trpc.sales.update.useMutation({
    onSuccess: () => {
      toast.success("Verkauf erfolgreich aktualisiert");
      utils.sales.listByEntity.invalidate();
      // Invalidate relevant metrics queries
      if (entityType === "campaign") {
        utils.campaigns.list.invalidate();
      } else if (entityType === "adset") {
        utils.adsets.listByCampaign.invalidate();
      } else {
        utils.ads.listByAdSet.invalidate();
      }
      setEditingId(null);
    },
    onError: (error) => {
      toast.error(`Fehler: ${error.message}`);
    },
  });

  const deleteSale = trpc.sales.delete.useMutation({
    onSuccess: () => {
      toast.success("Verkauf erfolgreich gelöscht");
      utils.sales.listByEntity.invalidate();
      // Invalidate relevant metrics queries
      if (entityType === "campaign") {
        utils.campaigns.list.invalidate();
      } else if (entityType === "adset") {
        utils.adsets.listByCampaign.invalidate();
      } else {
        utils.ads.listByAdSet.invalidate();
      }
    },
    onError: (error) => {
      toast.error(`Fehler: ${error.message}`);
    },
  });

  const startEdit = (sale: SaleItem) => {
    setEditingId(sale.id);
    setEditForm({
      orderValue: sale.orderValue,
      cashCollect: sale.cashCollect,
      completionDate: format(new Date(sale.completionDate), "yyyy-MM-dd"),
      notes: sale.notes || "",
    });
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditForm({
      orderValue: "",
      cashCollect: "",
      completionDate: "",
      notes: "",
    });
  };

  const saveEdit = () => {
    if (!editingId) return;

    if (!editForm.orderValue || !editForm.cashCollect || !editForm.completionDate) {
      toast.error("Bitte alle Pflichtfelder ausfüllen");
      return;
    }

    updateSale.mutate({
      id: editingId,
      orderValue: parseFloat(editForm.orderValue),
      cashCollect: parseFloat(editForm.cashCollect),
      completionDate: new Date(editForm.completionDate),
      notes: editForm.notes || undefined,
    });
  };

  const handleDelete = (id: number) => {
    if (confirm("Möchten Sie diesen Verkauf wirklich löschen?")) {
      deleteSale.mutate({ id });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[700px] max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Verkäufe verwalten</DialogTitle>
          <DialogDescription>
            Alle erfassten Verkäufe für <strong>{entityName}</strong>
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {isLoading && (
            <div className="text-center text-muted-foreground py-8">
              Lädt Verkäufe...
            </div>
          )}

          {!isLoading && (!sales || sales.length === 0) && (
            <div className="text-center text-muted-foreground py-8">
              Noch keine Verkäufe erfasst
            </div>
          )}

          {!isLoading && sales && sales.length > 0 && sales.map((sale: SaleItem) => (
            <Card key={sale.id}>
              <CardContent className="pt-6">
                {editingId === sale.id ? (
                  // Edit Mode
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor={`edit-orderValue-${sale.id}`}>Auftragswert (€)</Label>
                        <Input
                          id={`edit-orderValue-${sale.id}`}
                          type="number"
                          step="0.01"
                          value={editForm.orderValue}
                          onChange={(e) => setEditForm({ ...editForm, orderValue: e.target.value })}
                        />
                      </div>
                      <div>
                        <Label htmlFor={`edit-cashCollect-${sale.id}`}>Cash Collect (€)</Label>
                        <Input
                          id={`edit-cashCollect-${sale.id}`}
                          type="number"
                          step="0.01"
                          value={editForm.cashCollect}
                          onChange={(e) => setEditForm({ ...editForm, cashCollect: e.target.value })}
                        />
                      </div>
                    </div>
                    <div>
                      <Label htmlFor={`edit-completionDate-${sale.id}`}>Abschlussdatum</Label>
                      <Input
                        id={`edit-completionDate-${sale.id}`}
                        type="date"
                        value={editForm.completionDate}
                        onChange={(e) => setEditForm({ ...editForm, completionDate: e.target.value })}
                      />
                    </div>
                    <div>
                      <Label htmlFor={`edit-notes-${sale.id}`}>Notizen</Label>
                      <Textarea
                        id={`edit-notes-${sale.id}`}
                        value={editForm.notes}
                        onChange={(e) => setEditForm({ ...editForm, notes: e.target.value })}
                        rows={2}
                      />
                    </div>
                    <div className="flex gap-2 justify-end">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={cancelEdit}
                        disabled={updateSale.isPending}
                      >
                        <X className="h-4 w-4 mr-2" />
                        Abbrechen
                      </Button>
                      <Button
                        size="sm"
                        onClick={saveEdit}
                        disabled={updateSale.isPending}
                      >
                        <Check className="h-4 w-4 mr-2" />
                        {updateSale.isPending ? "Speichert..." : "Speichern"}
                      </Button>
                    </div>
                  </div>
                ) : (
                  // View Mode
                  <div className="space-y-3">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-sm text-muted-foreground">Auftragswert</p>
                        <p className="text-lg font-semibold">
                          €{parseFloat(sale.orderValue).toLocaleString('de-DE', { minimumFractionDigits: 2 })}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Cash Collect</p>
                        <p className="text-lg font-semibold">
                          €{parseFloat(sale.cashCollect).toLocaleString('de-DE', { minimumFractionDigits: 2 })}
                        </p>
                      </div>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Abschlussdatum</p>
                      <p className="font-medium">
                        {format(new Date(sale.completionDate), "dd. MMMM yyyy", { locale: de })}
                      </p>
                    </div>
                    {sale.notes && (
                      <div>
                        <p className="text-sm text-muted-foreground">Notizen</p>
                        <p className="text-sm">{sale.notes}</p>
                      </div>
                    )}
                    <div className="flex gap-2 justify-end pt-2 border-t">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => startEdit(sale)}
                      >
                        <Pencil className="h-4 w-4 mr-2" />
                        Bearbeiten
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => handleDelete(sale.id)}
                        disabled={deleteSale.isPending}
                      >
                        <Trash2 className="h-4 w-4 mr-2" />
                        Löschen
                      </Button>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
}
