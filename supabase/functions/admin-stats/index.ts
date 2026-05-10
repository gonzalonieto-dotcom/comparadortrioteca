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

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: corsHeaders });
    }

    const userClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
    });

    const { data: claimsData, error: claimsError } = await userClient.auth.getClaims(
      authHeader.replace("Bearer ", "")
    );
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

    // ─── Date ranges (UTC) ───
    const now = new Date();
    const startOfMonth = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1)).toISOString();
    const startOfPrevMonth = new Date(
      Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - 1, 1)
    ).toISOString();

    // ─── Last operation ───
    const { data: lastOpRows } = await adminClient
      .from("operations")
      .select("id, client_name, created_at, created_by, is_published")
      .is("deleted_at", null)
      .order("created_at", { ascending: false })
      .limit(1);
    const lastOp = lastOpRows?.[0] ?? null;

    let lastOpAuthorEmail: string | null = null;
    if (lastOp?.created_by) {
      const { data: authorData } = await adminClient.auth.admin.getUserById(lastOp.created_by);
      lastOpAuthorEmail = authorData?.user?.email ?? null;
    }

    // ─── Operations from this and previous month (single query, then split) ───
    const { data: recentOps } = await adminClient
      .from("operations")
      .select("id, created_at, created_by, is_published")
      .is("deleted_at", null)
      .gte("created_at", startOfPrevMonth);

    const ops = recentOps ?? [];
    const opsThisMonth = ops.filter((o) => o.created_at >= startOfMonth);
    const opsPrevMonth = ops.filter((o) => o.created_at < startOfMonth);

    const monthCount = opsThisMonth.length;
    const prevMonthCount = opsPrevMonth.length;
    const monthPublishedCount = opsThisMonth.filter((o) => o.is_published).length;
    const publishRate = monthCount === 0 ? 0 : monthPublishedCount / monthCount;
    const monthDelta =
      prevMonthCount === 0 ? null : (monthCount - prevMonthCount) / prevMonthCount;

    // ─── Per-gestor breakdown for current month ───
    const byGestorMap = new Map<
      string,
      { created: number; published: number; lastCreatedAt: string | null }
    >();
    for (const o of opsThisMonth) {
      const entry = byGestorMap.get(o.created_by) ?? {
        created: 0,
        published: 0,
        lastCreatedAt: null,
      };
      entry.created += 1;
      if (o.is_published) entry.published += 1;
      if (!entry.lastCreatedAt || o.created_at > entry.lastCreatedAt) {
        entry.lastCreatedAt = o.created_at;
      }
      byGestorMap.set(o.created_by, entry);
    }

    // Resolve emails for each gestor
    const byGestor: Array<{
      user_id: string;
      email: string | null;
      created: number;
      published: number;
      last_created_at: string | null;
    }> = [];
    for (const [userId, stats] of byGestorMap.entries()) {
      const { data: u } = await adminClient.auth.admin.getUserById(userId);
      byGestor.push({
        user_id: userId,
        email: u?.user?.email ?? null,
        created: stats.created,
        published: stats.published,
        last_created_at: stats.lastCreatedAt,
      });
    }
    byGestor.sort((a, b) => b.created - a.created);

    return new Response(
      JSON.stringify({
        last_operation: lastOp
          ? {
              id: lastOp.id,
              client_name: lastOp.client_name,
              created_at: lastOp.created_at,
              author_email: lastOpAuthorEmail,
              is_published: lastOp.is_published,
            }
          : null,
        month_count: monthCount,
        prev_month_count: prevMonthCount,
        month_delta_pct: monthDelta,
        month_published_count: monthPublishedCount,
        publish_rate: publishRate,
        by_gestor: byGestor,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    return new Response(JSON.stringify({ error: (err as Error).message }), {
      status: 500,
      headers: corsHeaders,
    });
  }
});
