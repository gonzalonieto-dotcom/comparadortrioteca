import { useState, useEffect, useMemo } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, Circle, ExternalLink, Lock } from "lucide-react";
import { fetchBankChecklist, ChecklistItemConfig } from "@/lib/bankChecklists";
import { BankLogo } from "@/lib/bankLogos";
import { toast } from "@/hooks/use-toast";

interface AdvanceModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  bankName?: string;
  bankColor?: string;
  isExternal?: boolean;
  operationId?: string;
  clientName?: string;
}

const AdvanceModal = ({ open, onOpenChange, bankName, bankColor, isExternal, operationId, clientName }: AdvanceModalProps) => {
  const [checklist, setChecklist] = useState<ChecklistItemConfig[]>([]);
  const [statuses, setStatuses] = useState<boolean[]>([]);
  const [loadingChecklist, setLoadingChecklist] = useState(false);

  // Fetch checklist from DB when modal opens or bank changes
  useEffect(() => {
    if (!open || isExternal) return;
    setLoadingChecklist(true);
    fetchBankChecklist(bankName).then((items) => {
      // Sort gatekeeper first
      const gatekeeper = items.filter((i) => i.isGatekeeper);
      const rest = items.filter((i) => !i.isGatekeeper);
      const sorted = [...gatekeeper, ...rest];
      setChecklist(sorted);
      setStatuses(new Array(sorted.length).fill(false));
      setLoadingChecklist(false);
    });
  }, [open, bankName, isExternal]);

  // Gatekeeper is always index 0 after sorting
  const hasGatekeeper = checklist.length > 0 && checklist[0].isGatekeeper;
  const gatekeeperDone = !hasGatekeeper || statuses[0];

  const handleToggle = (idx: number) => {
    const isGatekeeperItem = idx === 0 && hasGatekeeper;
    if (!isGatekeeperItem && hasGatekeeper && !statuses[0]) return;

    const newStatuses = [...statuses];
    newStatuses[idx] = !newStatuses[idx];
    setStatuses(newStatuses);

    const item = checklist[idx];

    // When gatekeeper is confirmed, notify the gestor via edge function
    if (isGatekeeperItem && newStatuses[idx] && operationId && bankName) {
      const projectId = import.meta.env.VITE_SUPABASE_PROJECT_ID;
      const url = `https://${projectId}.supabase.co/functions/v1/notify-gestor-interest`;
      fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ operationId, bankName, clientName }),
      }).catch((err) => console.warn("Failed to notify gestor:", err));
    }

    if (newStatuses[idx] && item.notifyGestorOnComplete) {
      toast({
        title: "Notificación enviada",
        description: "Tu gestor ha sido notificado de que la documentación está completa.",
      });
    }
  };

  if (isExternal) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <BankLogo bankName={bankName || "Oferta externa"} logoColor={bankColor} size="md" />
            </DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground py-4">
            Esta es una oferta externa. Contacta directamente con el banco para avanzar con el proceso.
          </p>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3">
            <BankLogo bankName={bankName || "este banco"} logoColor={bankColor} size="lg" showName={true} />
          </DialogTitle>
          <p className="text-sm text-muted-foreground mt-1">
            Completa estos pasos para avanzar
          </p>
        </DialogHeader>

        {loadingChecklist ? (
          <p className="text-sm text-muted-foreground py-4">Cargando pasos...</p>
        ) : (
          <div className="space-y-1 mt-2">
            {checklist.map((item, idx) => {
              const done = statuses[idx];
              const isGatekeeperItem = idx === 0 && hasGatekeeper;
              const isLocked = !isGatekeeperItem && hasGatekeeper && !statuses[0];

              return (
                <div
                  key={`${bankName}-${idx}`}
                  className={`flex items-start gap-3 rounded-lg px-3 py-3 transition-opacity ${
                    isLocked ? "opacity-40 cursor-not-allowed" : ""
                  }`}
                >
                  <button
                    onClick={() => handleToggle(idx)}
                    disabled={isLocked}
                    className="mt-0.5 flex-shrink-0 disabled:cursor-not-allowed"
                  >
                    {isLocked ? (
                      <Lock className="h-5 w-5 text-muted-foreground/40" />
                    ) : done ? (
                      <CheckCircle2 className="h-5 w-5 text-accent" />
                    ) : (
                      <Circle className="h-5 w-5 text-muted-foreground/40" />
                    )}
                  </button>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className={`text-sm ${done ? "text-muted-foreground line-through" : "text-card-foreground"}`}>
                        {item.label}
                      </span>
                      <Badge
                        variant={done ? "default" : "outline"}
                        className={`text-[10px] px-1.5 py-0 ${done ? "bg-accent text-accent-foreground" : ""}`}
                      >
                        {done ? "OK" : "Pendiente"}
                      </Badge>
                    </div>

                    {item.linkUrl && !isLocked && (
                      <a
                        href={item.linkUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-xs text-primary hover:underline mt-1"
                      >
                        {item.linkLabel || "Ver enlace"} <ExternalLink className="h-3 w-3" />
                      </a>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {hasGatekeeper && !gatekeeperDone && (
          <p className="text-xs text-muted-foreground text-center mt-2 italic">
            Confirma tu interés para desbloquear los siguientes pasos.
          </p>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default AdvanceModal;
