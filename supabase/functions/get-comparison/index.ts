import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { token } = await req.json();
    if (!token || typeof token !== "string") {
      return new Response(
        JSON.stringify({ error: "Token requerido" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Fetch operation by share_token, must be published
    const { data: op, error: opErr } = await supabase
      .from("operations")
      .select("id, client_name, purchase_price, loan_amount, appraisal_value, term_years, home_insurance_annual, life_insurance_annual, appraisal_cost, is_published, inflation_rate, share_token, created_at")
      .eq("share_token", token)
      .eq("is_published", true)
      .is("deleted_at", null)
      .single();

    if (opErr || !op) {
      return new Response(
        JSON.stringify({ error: "Comparativa no encontrada o no publicada" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Fetch offers
    const { data: offers } = await supabase
      .from("offers")
      .select("*")
      .eq("operation_id", op.id)
      .order("sort_order");

    const offerIds = (offers || []).map((o: any) => o.id);

    // Fetch linkages and mixed periods
    const [{ data: linkages }, { data: mixedPeriods }] = await Promise.all([
      offerIds.length
        ? supabase.from("offer_linkages").select("*").in("offer_id", offerIds)
        : Promise.resolve({ data: [] }),
      offerIds.length
        ? supabase.from("offer_mixed_periods").select("*").in("offer_id", offerIds)
        : Promise.resolve({ data: [] }),
    ]);

    return new Response(
      JSON.stringify({
        operation: op,
        offers: offers || [],
        linkages: linkages || [],
        mixedPeriods: mixedPeriods || [],
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    return new Response(
      JSON.stringify({ error: "Error interno del servidor" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
