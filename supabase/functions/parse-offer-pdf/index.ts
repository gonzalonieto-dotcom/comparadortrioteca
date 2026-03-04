import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const SYSTEM_PROMPT = `Eres un extractor de datos de ofertas hipotecarias bancarias. Analiza el contenido proporcionado (PDF o texto) y extrae los datos de la oferta.

Bancos conocidos: CaixaBank, Ibercaja, BBVA, Kutxabank, Bankinter, Santander, Sabadell, Unicaja, ING, Openbank, EVO.
Tipos de hipoteca: Fijo, Mixto, Variable.

REGLAS CRÍTICAS:
1. base_tin debe ser el TIN bonificado (con todos los descuentos de vinculaciones ya aplicados).
2. Para las vinculaciones, usa EXACTAMENTE estos labels (no uses variaciones):
   - "Domiciliación de nómina" (para nómina, domiciliación, recibos, etc.)
   - "Seguro hogar" (para seguro de hogar, seguro multirriesgo hogar, etc.)
   - "Seguro de vida" (para seguro de vida, seguro vida, etc.)
   Si hay otras vinculaciones que no encajan en estas 3 categorías, ignóralas.
3. Para cada vinculación extraída:
   - discount_weight_pct: cuántos puntos porcentuales (pp) de descuento aporta al TIN. Ejemplo: si sin vinculaciones el TIN es 3.45% y con todas baja a 2.85%, el descuento total es 0.60 pp repartido entre las vinculaciones.
   - annual_cost: el coste ANUAL en euros de esa vinculación. Si el documento dice un coste mensual (ej: 45€/mes), multiplica por 12.
4. Si el documento muestra un TIN "sin bonificaciones" y un TIN "con bonificaciones", usa esa diferencia para calcular los pesos de descuento.
5. Para hipotecas Mixto o Variable, extrae el diferencial sobre Euríbor (spread_over_euribor).
6. Para Mixto, identifica los tramos con sus años y tipos.
7. Si no hay vinculaciones explícitas en el documento, devuelve un array vacío de linkages.
8. amortization_fee_pct: comisión de amortización anticipada. Si no se menciona, pon 0.

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
          description: "TIN bonificado en porcentaje (ej: 2.5 para 2.5%)",
        },
        amortization_fee_pct: {
          type: "number",
          description: "Comisión de amortización anticipada en porcentaje",
        },
        upfront_costs: {
          type: "number",
          description: "Gastos iniciales en euros",
        },
        monthly_account_cost: {
          type: "number",
          description: "Coste mensual de la cuenta en euros",
        },
        euribor_rate: {
          type: "number",
          description: "Diferencial sobre Euríbor en porcentaje (solo para Variable/Mixto)",
        },
        advantages: {
          type: "array",
          items: { type: "string" },
          description: "Lista de ventajas o características destacadas de la oferta",
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
                description: "Porcentaje de descuento que aporta esta vinculación al TIN",
              },
              annual_cost: {
                type: "number",
                description: "Coste anual de esta vinculación en euros",
              },
            },
            required: ["label", "discount_weight_pct", "annual_cost"],
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
      },
      required: ["bank_name", "type", "base_tin"],
      additionalProperties: false,
    },
  },
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { pdf_base64, text_content } = await req.json();
    if (!pdf_base64 && !text_content) {
      return new Response(JSON.stringify({ error: "pdf_base64 or text_content is required" }), {
        status: 400,
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
        model: "google/gemini-2.5-flash",
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
