import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { CheckCircle2, Circle, ExternalLink, Loader2 } from "lucide-react";

interface AdvanceModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  bankName?: string;
  bankColor?: string;
  isExternal?: boolean;
}

interface ChecklistItem {
  label: string;
  linkUrl?: string;
  linkLabel?: string;
  isConfirmation?: boolean;
}

const bankChecklist: ChecklistItem[] = [
  {
    label: "Apertura de cuenta",
    linkUrl: "https://www.caixabank.com/home_es.html",
    linkLabel: "Abrir cuenta",
  },
  {
    label: "Firmar documento SUA",
    linkUrl: "https://www.caixabank.com/home_es.html",
    linkLabel: "Ver documento",
  },
  {
    label: "Confirmación de interés",
    isConfirmation: true,
  },
  {
    label: "Documentación completa y actualizada",
    linkUrl: "https://trioteca.com/",
    linkLabel: "Subir documentos",
  },
];

const RequirementItem = ({ item }: { item: ChecklistItem }) => {
  const [checked, setChecked] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);

  const handleSendConfirmation = () => {
    setConfirming(true);
    setTimeout(() => {
      setConfirming(false);
      setShowConfirmDialog(false);
      setChecked(true);
    }, 2000);
  };

  return (
    <>
      <div className="flex items-start gap-3 py-2.5">
        <button
          onClick={() => {
            if (item.isConfirmation) {
              if (!checked) setShowConfirmDialog(true);
            } else {
              setChecked(!checked);
            }
          }}
          className="mt-0.5 flex-shrink-0"
        >
          {checked ? (
            <CheckCircle2 className="h-5 w-5 text-accent" />
          ) : (
            <Circle className="h-5 w-5 text-muted-foreground/40" />
          )}
        </button>
        <div className="flex-1 min-w-0">
          <span className={`text-sm ${checked ? "text-muted-foreground line-through" : "text-card-foreground"}`}>
            {item.label}
          </span>
          <div className="flex flex-wrap gap-2 mt-1">
            {item.linkUrl && (
              <a
                href={item.linkUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-xs text-primary hover:underline"
              >
                {item.linkLabel || "Ver"} <ExternalLink className="h-3 w-3" />
              </a>
            )}
            {item.isConfirmation && !checked && (
              <Button size="sm" variant="outline" className="h-6 text-xs px-2" onClick={() => setShowConfirmDialog(true)}>
                Confirmar interés
              </Button>
            )}
          </div>
        </div>
      </div>

      <Dialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle className="text-base">Confirmar interés</DialogTitle>
          </DialogHeader>
          <div className="text-center py-4">
            {confirming ? (
              <div className="flex flex-col items-center gap-3">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                <p className="text-sm text-muted-foreground">Enviando confirmación al banco…</p>
              </div>
            ) : (
              <div className="space-y-4">
                <p className="text-sm text-muted-foreground">
                  Se enviará una confirmación de interés al banco. Esto no es vinculante.
                </p>
                <Button onClick={handleSendConfirmation} className="w-full">
                  Enviar confirmación
                </Button>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};

const AdvanceModal = ({ open, onOpenChange, bankName, bankColor, isExternal }: AdvanceModalProps) => {
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

        <div className="divide-y divide-border mt-2">
          {bankChecklist.map((item, i) => (
            <RequirementItem key={i} item={item} />
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default AdvanceModal;
