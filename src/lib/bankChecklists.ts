import { supabase } from "@/integrations/supabase/client";

export interface ChecklistItemConfig {
  label: string;
  linkUrl?: string;
  linkLabel?: string;
  isGatekeeper?: boolean;
  notifyGestorOnComplete?: boolean;
}

const DEFAULT_CHECKLIST: ChecklistItemConfig[] = [
  { label: "Confirmar interés", isGatekeeper: true },
  { label: "Apertura de cuenta" },
  { label: "Documentación completa y actualizada", notifyGestorOnComplete: true },
];

/**
 * Fetch checklist items from the database for a given bank.
 * Falls back to a generic default if nothing is configured.
 */
export async function fetchBankChecklist(bankName?: string): Promise<ChecklistItemConfig[]> {
  if (!bankName) return DEFAULT_CHECKLIST;

  try {
    const { data, error } = await supabase
      .from("bank_checklist_items")
      .select("*")
      .eq("bank_name", bankName)
      .order("sort_order");

    if (error || !data || data.length === 0) return DEFAULT_CHECKLIST;

    return data.map((d: any) => ({
      label: d.label,
      linkUrl: d.link_url || undefined,
      linkLabel: d.link_label || undefined,
      isGatekeeper: d.is_gatekeeper,
      notifyGestorOnComplete: d.notify_gestor_on_complete,
    }));
  } catch {
    return DEFAULT_CHECKLIST;
  }
}

/** @deprecated Use fetchBankChecklist instead */
export function getBankChecklist(bankName?: string): ChecklistItemConfig[] {
  return DEFAULT_CHECKLIST;
}
