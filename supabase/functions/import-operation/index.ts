import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-api-key",
};

/** French amortisation monthly payment */
function calcMonthlyPayment(
  principal: number,
  annualRate: number,
  years: number,
): number {
  if (annualRate === 0) return principal / (years * 12);
  const r = annualRate / 100 / 12;
  const n = years * 12;
  return (principal * r) / (1 - Math.pow(1 + r, -n));
}

/** Simplified TAE ≈ using the standard formula for loans with no extra costs */
function calcEstimatedTAE(
  principal: number,
  monthlyPayment: number,
  years: number,
): number {
  // Newton-Raphson to solve for monthly rate
  const n = years * 12;
  let r = 0.002; // initial guess
  for (let i = 0; i < 100; i++) {
    const pv = (r === 0)
      ? monthlyPayment * n
      : monthlyPayment * (1 - Math.pow(1 + r, -n)) / r;
    const pvDeriv = (r === 0)
      ? 0
      : monthlyPayment *
        ((-1 / (r * r)) * (1 - Math.pow(1 + r, -n)) +
          (1 / r) * n * Math.pow(1 + r, -n - 1));
    const diff = pv - principal;
    if (Math.abs(diff) < 0.01) break;
    r = r - diff / pvDeriv;
    if (r <= 0) r = 0.0001;
  }
  return (Math.pow(1 + r, 12) - 1) * 100;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // 1. Validate API key
    const apiKey = req.headers.get("x-api-key");
    const expectedKey = Deno.env.get("IMPORT_API_KEY");
    if (!expectedKey || apiKey !== expectedKey) {
      return new Response(
        JSON.stringify({ error: "Invalid or missing API key" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const body = await req.json();
    const {
      gestor_email,
      client_name = "",
      purchase_price = 0,
      loan_amount = 0,
      term_years = 30,
      appraisal_value = 0,
      home_insurance_annual = 0,
      life_insurance_annual = 0,
      appraisal_cost = 0,
      is_published = false,
      inflation_rate = 3.0,
      offers = [],
    } = body;

    if (!gestor_email) {
      return new Response(
        JSON.stringify({ error: "gestor_email is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    // 2. Create service-role client
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, serviceRoleKey);

    // 3. Find gestor by email
    const { data: usersData, error: usersErr } =
      await supabase.auth.admin.listUsers({ perPage: 1000 });
    if (usersErr) throw usersErr;

    const gestor = usersData.users.find(
      (u: any) => u.email?.toLowerCase() === gestor_email.toLowerCase(),
    );
    if (!gestor) {
      return new Response(
        JSON.stringify({ error: `Gestor not found: ${gestor_email}` }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    // 4. Insert operation
    const { data: op, error: opErr } = await supabase
      .from("operations")
      .insert({
        created_by: gestor.id,
        client_name,
        purchase_price,
        loan_amount,
        term_years,
        appraisal_value,
        home_insurance_annual,
        life_insurance_annual,
        appraisal_cost,
        is_published,
        inflation_rate,
      })
      .select()
      .single();
    if (opErr) throw opErr;

    // 5. Insert offers with linkages and mixed periods
    let offersCreated = 0;
    for (let i = 0; i < offers.length; i++) {
      const o = offers[i];
      const offerTermYears = o.term_years ?? term_years;
      const monthlyPayment = calcMonthlyPayment(
        loan_amount,
        o.base_tin ?? 0,
        offerTermYears,
      );
      const estimatedTae = calcEstimatedTAE(
        loan_amount,
        monthlyPayment,
        offerTermYears,
      );

      const { data: offer, error: offerErr } = await supabase
        .from("offers")
        .insert({
          operation_id: op.id,
          bank_name: o.bank_name,
          logo_color: o.logo_color || "hsl(200, 70%, 50%)",
          type: o.type || "Fijo",
          base_tin: o.base_tin ?? 0,
          estimated_tae: Math.round(estimatedTae * 100) / 100,
          monthly_payment: Math.round(monthlyPayment * 100) / 100,
          amortization_fee_pct: o.amortization_fee_pct ?? 0,
          upfront_costs: o.upfront_costs ?? 0,
          monthly_account_cost: o.monthly_account_cost ?? 0,
          euribor_rate: o.euribor_rate ?? null,
          term_years: o.term_years ?? null,
          advantages: o.advantages || [],
          considerations: o.considerations || [],
          sort_order: i,
        })
        .select()
        .single();
      if (offerErr) throw offerErr;
      offersCreated++;

      // Linkages
      if (o.linkages?.length) {
        const { error: linkErr } = await supabase
          .from("offer_linkages")
          .insert(
            o.linkages.map((l: any) => ({
              offer_id: offer.id,
              label: l.label,
              is_active_default: l.is_active_default ?? true,
              discount_weight_pct: l.discount_weight_pct ?? 0,
              annual_cost: l.annual_cost ?? 0,
            })),
          );
        if (linkErr) throw linkErr;
      }

      // Mixed periods
      if (o.mixed_periods?.length) {
        const { error: mpErr } = await supabase
          .from("offer_mixed_periods")
          .insert(
            o.mixed_periods.map((m: any) => ({
              offer_id: offer.id,
              from_year: m.from_year,
              to_year: m.to_year,
              fixed_tin: m.fixed_tin ?? null,
              spread_over_euribor: m.spread_over_euribor ?? null,
            })),
          );
        if (mpErr) throw mpErr;
      }
    }

    const shareUrl = `https://comparadortrioteca.lovable.app/c/${op.share_token}`;

    return new Response(
      JSON.stringify({
        success: true,
        operation_id: op.id,
        share_token: op.share_token,
        share_url: shareUrl,
        offers_created: offersCreated,
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (err: any) {
    console.error("import-operation error:", err);
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});
