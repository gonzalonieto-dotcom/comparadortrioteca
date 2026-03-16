import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;

    // Verify caller is admin
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: corsHeaders });
    }

    const userClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
    });

    const { data: claimsData, error: claimsError } = await userClient.auth.getClaims(authHeader.replace("Bearer ", ""));
    if (claimsError || !claimsData?.claims) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: corsHeaders });
    }
    const callerId = claimsData.claims.sub;

    const adminClient = createClient(supabaseUrl, serviceRoleKey);
    const { data: adminRole } = await adminClient
      .from("user_roles")
      .select("id")
      .eq("user_id", callerId)
      .eq("role", "admin")
      .maybeSingle();

    if (!adminRole) {
      return new Response(JSON.stringify({ error: "Forbidden" }), { status: 403, headers: corsHeaders });
    }

    const body = await req.json();
    const { action, email, user_id, password } = body;

    if (action === "create") {
      if (!email || !password) {
        return new Response(JSON.stringify({ error: "Email y contraseña requeridos" }), { status: 400, headers: corsHeaders });
      }

      // Create user via admin API
      const { data: newUser, error: createError } = await adminClient.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
      });

      if (createError) {
        return new Response(JSON.stringify({ error: createError.message }), { status: 400, headers: corsHeaders });
      }

      // Assign gestor role
      await adminClient.from("user_roles").insert({ user_id: newUser.user.id, role: "gestor" });

      return new Response(JSON.stringify({ success: true, user_id: newUser.user.id }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (action === "delete") {
      if (!user_id) {
        return new Response(JSON.stringify({ error: "user_id requerido" }), { status: 400, headers: corsHeaders });
      }

      // Don't allow deleting yourself
      if (user_id === callerId) {
        return new Response(JSON.stringify({ error: "No puedes eliminarte a ti mismo" }), { status: 400, headers: corsHeaders });
      }

      // Remove roles
      await adminClient.from("user_roles").delete().eq("user_id", user_id);

      // Delete the auth user
      const { error: deleteError } = await adminClient.auth.admin.deleteUser(user_id);
      if (deleteError) {
        return new Response(JSON.stringify({ error: deleteError.message }), { status: 400, headers: corsHeaders });
      }

      return new Response(JSON.stringify({ success: true }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ error: "Acción no válida" }), { status: 400, headers: corsHeaders });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), { status: 500, headers: corsHeaders });
  }
});
