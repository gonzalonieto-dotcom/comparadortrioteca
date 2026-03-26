import { useState, useEffect, useMemo } from "react";
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
import { BankLogo } from "@/lib/bankLogos";
import { toast } from "@/hooks/use-toast";

interface AdvanceModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  bankName?: string;
  bankColor?: string;
  isExternal?: boolean;
}

const AdvanceModal = ({ open, onOpenChange, bankName, bankColor, isExternal }: AdvanceModalProps) => {
  // Memoize checklist by bankName, sort gatekeeper first
  const checklist = useMemo(() => {
    const raw = getBankChecklist(bankName);
    const gatekeeper = raw.filter((i) => i.isGatekeeper);
    const rest = raw.filter((i) => !i.isGatekeeper);
    return [...gatekeeper, ...rest];
  }, [bankName]);

  const [statuses, setStatuses] = useState<boolean[]>([]);

  // Reset statuses every time modal opens or bank changes
  useEffect(() => {
    if (open) {
      setStatuses(new Array(checklist.length).fill(false));
    }
  }, [open, bankName, checklist.length]);

  // Gatekeeper is always index 0 after sorting
  const hasGatekeeper = checklist.length > 0 && checklist[0].isGatekeeper;
  const gatekeeperDone = !hasGatekeeper || statuses[0];

  const handleToggle = (idx: number) => {
    const isGatekeeperItem = idx === 0 && hasGatekeeper;
    // Block non-gatekeeper items if gatekeeper not done
    if (!isGatekeeperItem && hasGatekeeper && !statuses[0]) return;

    const newStatuses = [...statuses];
    newStatuses[idx] = !newStatuses[idx];
    setStatuses(newStatuses);

    const item = checklist[idx];
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
