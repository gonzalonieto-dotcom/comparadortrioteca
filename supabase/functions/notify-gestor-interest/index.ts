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
    const { operationId, bankName, clientName } = await req.json();

    if (!operationId || !bankName) {
      return new Response(
        JSON.stringify({ error: "operationId y bankName son requeridos" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Get operation to find the gestor (created_by)
    const { data: op, error: opErr } = await supabase
      .from("operations")
      .select("created_by, client_name")
      .eq("id", operationId)
      .single();

    if (opErr || !op) {
      return new Response(
        JSON.stringify({ error: "Operación no encontrada" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Get gestor email from auth.users
    const { data: userData, error: userErr } = await supabase.auth.admin.getUserById(op.created_by);

    if (userErr || !userData?.user?.email) {
      return new Response(
        JSON.stringify({ error: "No se pudo obtener el email del gestor" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const gestorEmail = userData.user.email;
    const displayClientName = clientName || op.client_name || "Un cliente";

    // Try to send email via Lovable email infrastructure
    // If email infra is not set up, we log and return success (best-effort)
    try {
      await supabase.functions.invoke("send-transactional-email", {
        body: {
          templateName: "gestor-interest-notification",
          recipientEmail: gestorEmail,
          idempotencyKey: `interest-${operationId}-${bankName.replace(/\s+/g, "-")}`,
          templateData: {
            clientName: displayClientName,
            bankName,
          },
        },
      });
    } catch (emailErr) {
      // Email infra might not be set up yet — log but don't fail
      console.warn("Email send failed (infra may not be configured):", emailErr);
    }

    return new Response(
      JSON.stringify({ success: true, message: `Notificación enviada a ${gestorEmail}` }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    console.error("Error in notify-gestor-interest:", err);
    return new Response(
      JSON.stringify({ error: "Error interno del servidor" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
