import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const SYSTEM_PROMPT = `Eres un extractor de datos de ofertas hipotecarias bancarias. Analiza el contenido proporcionado (PDF o texto) y extrae SOLO los datos que aparezcan de forma literal e inequívoca.

Bancos conocidos: CaixaBank, Ibercaja, BBVA, Kutxabank, Bankinter, Santander, Sabadell, Unicaja, ING, Openbank, EVO.
Tipos de hipoteca: Fijo, Mixto, Variable.

REGLA #0 — PROHIBIDO INVENTAR:
- Si un dato NO aparece de forma explícita en el documento, OMITE el campo (no lo incluyas en la respuesta). No uses 0, ni valores "típicos", ni inferencias.
- Usa 0 solo cuando el documento diga literalmente "0 €", "sin comisión", "sin coste", "gratuito" o equivalente.
- Añade al campo missing_fields el nombre de cada campo solicitado que no encontraste.

REGLAS DE EXTRACCIÓN:
1. base_tin: TIN bonificado (con todos los descuentos de vinculaciones aplicados). Si el documento solo muestra el TIN sin bonificaciones, OMITE base_tin y anótalo en missing_fields.
2. Vinculaciones: usa EXACTAMENTE estos labels (no uses variaciones):
   - "Domiciliación de nómina"
   - "Seguro hogar"
   - "Seguro de vida"
   Si hay otras vinculaciones que no encajan, ignóralas. Si el documento no menciona vinculaciones, devuelve linkages: [].
3. Por cada vinculación, solo incluye discount_weight_pct si el documento aporta los datos para calcularlo (TIN base y bonificado, o pesos explícitos). Solo incluye annual_cost si el documento da un coste explícito (anual o mensual; mensual ×12). Si falta uno, omítelo.
4. amortization_fee_pct: incluir SOLO si se menciona; no asumir 0 por defecto.
5. upfront_costs, monthly_account_cost: idem; no inventar.
6. euribor_rate (Variable/Mixto): diferencial sobre Euríbor, solo si está explícito.
7. Para Mixto, identifica tramos con años y tipos solo si están claramente especificados.
8. advantages: incluir SOLO frases literales del documento. Si no hay texto descriptivo de ventajas, devuelve [].

Usa la herramienta extract_offer_data para devolver los datos extraídos.`;

const toolDef = {
  type: "function" as const,
  function: {
    name: "extract_offer_data",
    description: "Extrae los datos estructurados de una oferta hipotecaria bancaria",
    parameters: {
      type: "object",
      properties: {
        bank_name: {
          type: "string",
          description: "Nombre del banco",
        },
        type: {
          type: "string",
          enum: ["Fijo", "Mixto", "Variable"],
          description: "Tipo de hipoteca",
        },
        base_tin: {
          type: "number",
          description: "TIN bonificado en porcentaje (ej: 2.5 para 2.5%). Omitir si no aparece explícito.",
        },
        amortization_fee_pct: {
          type: "number",
          description: "Comisión de amortización anticipada en porcentaje. Omitir si no se menciona.",
        },
        upfront_costs: {
          type: "number",
          description: "Gastos iniciales en euros. Omitir si no se menciona.",
        },
        monthly_account_cost: {
          type: "number",
          description: "Coste mensual de la cuenta en euros. Omitir si no se menciona.",
        },
        euribor_rate: {
          type: "number",
          description: "Diferencial sobre Euríbor en porcentaje (solo Variable/Mixto). Omitir si no se menciona.",
        },
        advantages: {
          type: "array",
          items: { type: "string" },
          description: "Ventajas literales mencionadas en el documento. Vacío si no hay.",
        },
        linkages: {
          type: "array",
          items: {
            type: "object",
            properties: {
              label: {
                type: "string",
                enum: ["Domiciliación de nómina", "Seguro hogar", "Seguro de vida"],
                description: "Nombre exacto de la vinculación",
              },
              discount_weight_pct: {
                type: "number",
                description: "Puntos porcentuales de descuento que aporta al TIN. Omitir si no se puede calcular del documento.",
              },
              annual_cost: {
                type: "number",
                description: "Coste anual en euros. Omitir si no se menciona en el documento.",
              },
            },
            required: ["label"],
            additionalProperties: false,
          },
          description: "Vinculaciones/bonificaciones de la oferta",
        },
        mixed_periods: {
          type: "array",
          items: {
            type: "object",
            properties: {
              from_year: { type: "number" },
              to_year: { type: "number" },
              fixed_tin: { type: "number", description: "TIN fijo del periodo" },
              spread_over_euribor: { type: "number", description: "Diferencial sobre Euríbor del periodo" },
            },
            required: ["from_year", "to_year"],
            additionalProperties: false,
          },
          description: "Periodos de tipo mixto (solo si la hipoteca es Mixto)",
        },
        missing_fields: {
          type: "array",
          items: { type: "string" },
          description: "Nombres de los campos que NO se pudieron extraer del documento (ej: ['base_tin', 'amortization_fee_pct']).",
        },
      },
      required: ["bank_name", "type"],
      additionalProperties: false,
    },
  },
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const body = await req.json();
    const { pdf_base64, text_content, share_token } = body ?? {};

    // ─── Auth gate (same pattern as mortgage-chat) ───
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const admin = createClient(supabaseUrl, serviceRoleKey);

    let authorized = false;
    const authHeader = req.headers.get("Authorization");
    if (authHeader?.startsWith("Bearer ")) {
      const token = authHeader.replace("Bearer ", "");
      if (token && token !== anonKey) {
        const userClient = createClient(supabaseUrl, anonKey, {
          global: { headers: { Authorization: authHeader } },
        });
        const { data, error } = await userClient.auth.getClaims(token);
        if (!error && data?.claims?.sub) authorized = true;
      }
    }
    if (!authorized && typeof share_token === "string" && share_token.length > 0) {
      const { data: op } = await admin
        .from("operations")
        .select("id")
        .eq("share_token", share_token)
        .eq("is_published", true)
        .is("deleted_at", null)
        .maybeSingle();
      if (op) authorized = true;
    }
    if (!authorized) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (!pdf_base64 && !text_content) {
      return new Response(JSON.stringify({ error: "pdf_base64 or text_content is required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // ─── Payload size limits to prevent cost-explosion abuse ───
    if (typeof pdf_base64 === "string" && pdf_base64.length > 7_000_000) {
      // ~5 MB binary
      return new Response(JSON.stringify({ error: "PDF demasiado grande (máx 5 MB)" }), {
        status: 413,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    if (typeof text_content === "string" && text_content.length > 50_000) {
      return new Response(JSON.stringify({ error: "Texto demasiado largo" }), {
        status: 413,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    // Build user message content based on input type
    const userContent = pdf_base64
      ? [
          {
            type: "file",
            file: {
              filename: "oferta.pdf",
              file_data: `data:application/pdf;base64,${pdf_base64}`,
            },
          },
          {
            type: "text",
            text: "Extrae todos los datos de esta oferta hipotecaria bancaria usando la herramienta extract_offer_data.",
          },
        ]
      : [
          {
            type: "text",
            text: `Extrae todos los datos de la siguiente oferta hipotecaria bancaria usando la herramienta extract_offer_data.\n\nTexto de la oferta:\n\n${text_content}`,
          },
        ];

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-pro",
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          { role: "user", content: userContent },
        ],
        tools: [toolDef],
        tool_choice: { type: "function", function: { name: "extract_offer_data" } },
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Límite de peticiones excedido, inténtalo de nuevo en unos segundos." }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "Créditos agotados. Añade créditos en Settings → Workspace → Usage." }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const text = await response.text();
      console.error("AI gateway error:", response.status, text);
      return new Response(JSON.stringify({ error: "Error al procesar la oferta" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const result = await response.json();
    const toolCall = result.choices?.[0]?.message?.tool_calls?.[0];
    if (!toolCall?.function?.arguments) {
      return new Response(JSON.stringify({ error: "No se pudieron extraer datos de la oferta" }), {
        status: 422,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const extracted = JSON.parse(toolCall.function.arguments);

    return new Response(JSON.stringify({ data: extracted }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("parse-offer-pdf error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Error desconocido" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
