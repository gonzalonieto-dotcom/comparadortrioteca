export interface ChecklistItemConfig {
  label: string;
  linkUrl?: string;
  linkLabel?: string;
  isGatekeeper?: boolean;
  notifyGestorOnComplete?: boolean;
}

export const BANK_CHECKLISTS: Record<string, ChecklistItemConfig[]> = {
  Abanca: [
    { label: "Confirmar interés del cliente", isGatekeeper: true },
    { label: "Apertura de cuenta", linkUrl: "https://www.abanca.com/es/cuentas/", linkLabel: "Abrir cuenta en Abanca" },
    { label: "Documentación actualizada, completa y enviada al banco", notifyGestorOnComplete: true },
  ],
  CaixaBank: [
    {
      label: "Confirmar interés",
      isGatekeeper: true,
    },
    {
      label: "Apertura de cuenta",
      linkUrl: "https://www.caixabank.es/particular/cuentas.html",
      linkLabel: "Abrir cuenta en CaixaBank",
    },
    {
      label: "Firmar documento SUA",
    },
    {
      label: "Documentación completa, actualizada y enviada al banco",
      notifyGestorOnComplete: true,
    },
  ],
};

const DEFAULT_CHECKLIST: ChecklistItemConfig[] = [
  {
    label: "Confirmar interés",
    isGatekeeper: true,
  },
  {
    label: "Apertura de cuenta",
  },
  {
    label: "Documentación completa y actualizada",
    notifyGestorOnComplete: true,
  },
];

export function getBankChecklist(bankName?: string): ChecklistItemConfig[] {
  if (!bankName) return DEFAULT_CHECKLIST;
  const normalized = Object.keys(BANK_CHECKLISTS).find(
    (k) => k.toLowerCase() === bankName.toLowerCase()
  );
  return normalized ? BANK_CHECKLISTS[normalized] : DEFAULT_CHECKLIST;
}
