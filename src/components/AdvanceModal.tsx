import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, Circle, ExternalLink, Lock } from "lucide-react";
import { getBankChecklist, ChecklistItemConfig } from "@/lib/bankChecklists";
import { toast } from "@/hooks/use-toast";

interface AdvanceModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  bankName?: string;
  bankColor?: string;
  isExternal?: boolean;
}

const AdvanceModal = ({ open, onOpenChange, bankName, bankColor, isExternal }: AdvanceModalProps) => {
  const checklist = getBankChecklist(bankName);
  const [statuses, setStatuses] = useState<boolean[]>([]);

  // Reset statuses when modal opens or bank changes
  useEffect(() => {
    if (open) {
      setStatuses(new Array(checklist.length).fill(false));
    }
  }, [open, bankName, checklist.length]);

  // Find gatekeeper index (-1 if none)
  const gatekeeperIdx = checklist.findIndex((item) => item.isGatekeeper);
  const gatekeeperDone = gatekeeperIdx === -1 || statuses[gatekeeperIdx];

  const handleToggle = (idx: number) => {
    const item = checklist[idx];

    // If locked, do nothing
    if (gatekeeperIdx !== -1 && idx !== gatekeeperIdx && !statuses[gatekeeperIdx]) return;

    const newStatuses = [...statuses];
    newStatuses[idx] = !newStatuses[idx];
    setStatuses(newStatuses);

    // Notify gestor simulation
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
              {bankColor && <div className="w-3 h-3 rounded-full" style={{ backgroundColor: bankColor }} />}
              Avanzar con {bankName || "este banco"}
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
          <DialogTitle className="flex items-center gap-2">
            {bankColor && <div className="w-3 h-3 rounded-full" style={{ backgroundColor: bankColor }} />}
            Para avanzar con {bankName || "este banco"}
          </DialogTitle>
        </DialogHeader>

        <p className="text-sm text-muted-foreground">
          Completa estos pasos para que podamos elevar tu operación al departamento de riesgos.
        </p>

        <div className="space-y-1 mt-2">
          {checklist.map((item, idx) => {
            const done = statuses[idx];
            const isLocked = gatekeeperIdx !== -1 && idx !== gatekeeperIdx && !statuses[gatekeeperIdx];

            return (
              <div
                key={idx}
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

        {gatekeeperIdx !== -1 && !gatekeeperDone && (
          <p className="text-xs text-muted-foreground text-center mt-2 italic">
            Confirma tu interés para desbloquear los siguientes pasos.
          </p>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default AdvanceModal;
