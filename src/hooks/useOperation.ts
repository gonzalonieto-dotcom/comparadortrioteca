import { supabase } from "@/integrations/supabase/client";
import type { Offer, Linkage, MixedRatePeriod, OperationDefaults } from "@/data/mortgageData";

// ─── DB row types (manual since types.ts is auto-generated with empty tables initially) ───
export interface DbOperation {
  id: string;
  purchase_price: number;
  appraisal_value: number;
  loan_amount: number;
  term_years: number;
  home_insurance_annual: number;
  life_insurance_annual: number;
  appraisal_cost: number;
  created_by: string;
  share_token: string;
  created_at: string;
}

export interface DbOffer {
  id: string;
  operation_id: string;
  bank_name: string;
  logo_color: string;
  type: string;
  base_tin: number;
  estimated_tae: number;
  monthly_payment: number;
  amortization_fee_pct: number;
  upfront_costs: number;
  monthly_account_cost: number;
  euribor_rate: number | null;
  advantages: string[];
  considerations: string[];
  sort_order: number;
}

export interface DbLinkage {
  id: string;
  offer_id: string;
  label: string;
  is_active_default: boolean;
  discount_weight_pct: number;
  annual_cost: number;
}

export interface DbMixedPeriod {
  id: string;
  offer_id: string;
  from_year: number;
  to_year: number;
  fixed_tin: number | null;
  spread_over_euribor: number | null;
}

// ─── Fetch operation by share token (public) ───
export async function fetchOperationByToken(token: string) {
  const { data: op, error: opErr } = await supabase
    .from("operations")
    .select("*")
    .eq("share_token", token)
    .single();
  if (opErr || !op) throw new Error(opErr?.message || "Operación no encontrada");

  const { data: offers } = await supabase
    .from("offers")
    .select("*")
    .eq("operation_id", op.id)
    .order("sort_order");

  const offerIds = (offers || []).map((o: any) => o.id);

  const [{ data: linkages }, { data: mixedPeriods }] = await Promise.all([
    offerIds.length
      ? supabase.from("offer_linkages").select("*").in("offer_id", offerIds)
      : Promise.resolve({ data: [] }),
    offerIds.length
      ? supabase.from("offer_mixed_periods").select("*").in("offer_id", offerIds)
      : Promise.resolve({ data: [] }),
  ]);

  return mapToAppTypes(op as DbOperation, (offers || []) as DbOffer[], (linkages || []) as DbLinkage[], (mixedPeriods || []) as DbMixedPeriod[]);
}

// ─── Map DB data to app types ───
function mapToAppTypes(
  op: DbOperation,
  offers: DbOffer[],
  linkages: DbLinkage[],
  mixedPeriods: DbMixedPeriod[]
): { defaults: OperationDefaults; offers: Offer[] } {
  const defaults: OperationDefaults = {
    purchasePrice: op.purchase_price,
    appraisalValue: op.appraisal_value,
    loanAmount: op.loan_amount,
    termYears: op.term_years,
    homeInsuranceAnnualDefault: op.home_insurance_annual,
    lifeInsuranceAnnualDefault: op.life_insurance_annual,
    appraisalCostEUR: op.appraisal_cost,
  };

  const mappedOffers: Offer[] = offers.map((o) => ({
    id: o.id,
    bankName: o.bank_name,
    logoColor: o.logo_color,
    type: o.type as Offer["type"],
    baseTIN: o.base_tin,
    amortizationFeePct: o.amortization_fee_pct,
    upfrontCostsEUR: o.upfront_costs,
    monthlyAccountCostEUR: o.monthly_account_cost,
    euriborRate: o.euribor_rate ?? undefined,
    advantages: o.advantages || [],
    considerations: o.considerations || [],
    linkages: linkages
      .filter((l) => l.offer_id === o.id)
      .map((l) => ({
        id: l.id,
        label: l.label,
        isActive: l.is_active_default,
        discountWeightPct: l.discount_weight_pct,
        annualCostEUR: l.annual_cost,
      })),
    mixedPeriods: mixedPeriods
      .filter((m) => m.offer_id === o.id)
      .map((m) => ({
        fromYear: m.from_year,
        toYear: m.to_year,
        fixedTIN: m.fixed_tin ?? undefined,
        spreadOverEuribor: m.spread_over_euribor ?? undefined,
      })),
  }));

  return { defaults, offers: mappedOffers };
}

// ─── CRUD for gestores ───
export async function fetchMyOperations() {
  const { data, error } = await supabase
    .from("operations")
    .select("*")
    .order("created_at", { ascending: false });
  if (error) throw error;
  return data as DbOperation[];
}

export async function createOperation(op: Omit<DbOperation, "id" | "created_at" | "share_token" | "created_by">) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("No autenticado");
  const { data, error } = await supabase
    .from("operations")
    .insert({ ...op, created_by: user.id })
    .select()
    .single();
  if (error) throw error;
  return data as DbOperation;
}

export async function updateOperation(id: string, op: Partial<Omit<DbOperation, "id" | "created_at" | "share_token" | "created_by">>) {
  const { data, error } = await supabase
    .from("operations")
    .update(op)
    .eq("id", id)
    .select()
    .single();
  if (error) throw error;
  return data as DbOperation;
}

export async function deleteOperation(id: string) {
  const { error } = await supabase.from("operations").delete().eq("id", id);
  if (error) throw error;
}

// ─── Offer CRUD ───
export async function fetchOffersByOperation(operationId: string) {
  const { data: offers, error } = await supabase
    .from("offers")
    .select("*")
    .eq("operation_id", operationId)
    .order("sort_order");
  if (error) throw error;

  const offerIds = (offers || []).map((o: any) => o.id);
  const [{ data: linkages }, { data: mixedPeriods }] = await Promise.all([
    offerIds.length
      ? supabase.from("offer_linkages").select("*").in("offer_id", offerIds)
      : Promise.resolve({ data: [] }),
    offerIds.length
      ? supabase.from("offer_mixed_periods").select("*").in("offer_id", offerIds)
      : Promise.resolve({ data: [] }),
  ]);

  return {
    offers: (offers || []) as DbOffer[],
    linkages: (linkages || []) as DbLinkage[],
    mixedPeriods: (mixedPeriods || []) as DbMixedPeriod[],
  };
}

export async function upsertOffer(offer: Omit<DbOffer, "id"> & { id?: string }) {
  const { data, error } = await supabase
    .from("offers")
    .upsert(offer)
    .select()
    .single();
  if (error) throw error;
  return data as DbOffer;
}

export async function deleteOffer(id: string) {
  const { error } = await supabase.from("offers").delete().eq("id", id);
  if (error) throw error;
}

// ─── Linkage CRUD ───
export async function saveLinkages(offerId: string, linkages: Omit<DbLinkage, "id" | "offer_id">[]) {
  // Delete existing and re-insert
  await supabase.from("offer_linkages").delete().eq("offer_id", offerId);
  if (linkages.length === 0) return;
  const { error } = await supabase
    .from("offer_linkages")
    .insert(linkages.map((l) => ({ ...l, offer_id: offerId })));
  if (error) throw error;
}

// ─── Mixed period CRUD ───
export async function saveMixedPeriods(offerId: string, periods: Omit<DbMixedPeriod, "id" | "offer_id">[]) {
  await supabase.from("offer_mixed_periods").delete().eq("offer_id", offerId);
  if (periods.length === 0) return;
  const { error } = await supabase
    .from("offer_mixed_periods")
    .insert(periods.map((p) => ({ ...p, offer_id: offerId })));
  if (error) throw error;
}
