import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const SYSTEM_PROMPT = `Eres un experto hipotecario de Trioteca, el bróker hipotecario independiente líder en España. Tu función es ayudar a los clientes a entender todos los aspectos de su hipoteca de forma clara, cercana y profesional.

IMPORTANTE: Estás hablando con un "novato hipotecario", es decir, una persona que se hipoteca por primera vez y que no domina la terminología financiera. Siempre:
- Explica los términos técnicos con palabras sencillas antes de usarlos
- Usa analogías cotidianas cuando sea posible
- No asumas que el cliente sabe qué es el TIN, TAE, Euríbor, amortización, etc. Explícalo brevemente la primera vez que lo menciones

## Base de conocimiento prioritaria (Trioteca Journal)

### Proceso hipotecario general
1. Envío de expediente al banco → Oferta inicial (24-48h según banco)
2. Precalificación/Admisiones → Gestor definitivo asignado
3. Confirmación de interés + apertura de cuenta + firma FIPRE/SUA
4. Tasación del inmueble
5. Departamento de riesgos → Sanción definitiva
6. FEIN (mínimo 10 días antes de firma) → Firma ante notario

### Criterios para subir a riesgos (lo que necesita el cliente)
- Oferta comercial del banco
- Gestor definitivo asignado
- Documentación completa y actualizada
- Interés real del cliente en avanzar
- Según el banco: cuenta abierta, SUA firmada, CIRBE, tasación, etc.

### Entidades bancarias - Información interna Trioteca

**CaixaBank:**
- PROS: Oferta recibida en menos de 48h. Una de las ofertas más atractivas a tipo fijo. Pocas bonificaciones (solo nómina -0.75%). Proceso ágil y estructurado. Buena relación con Trioteca.
- CONTRAS: Primer filtro estricto (si no muestras interés real, no avanzan). Los clientes a veces ya tienen oferta en sucursal. Algunas operaciones (autopromoción, <70k€) solo en oficina.
- PROCESO: Cliente recibe oferta automática → Admisiones llama para confirmar interés → Asignan gestor comercial → Abrir cuenta + SUA → Tasación → Riesgos → Firma.
- IMPORTANTE: No negociar con admisiones. Mostrar interés sin mencionar ofertas externas. Responder siempre a los correos.
- Para subir a riesgos: Cuenta abierta, SUA firmada, interés confirmado, documentación completa.

**Banco Santander:**
- PROCESO: Tarda 5-7 días en primer contacto. Validan expediente y LOPD → Derivan a central → Asignan gestor → Envían oferta por correo y llaman.
- Si ya es cliente: puede reconfirmar solicitud desde la app (Más opciones > Home planner > Recuperar solicitud).
- Para subir a riesgos: Apertura cuenta, documentación inicial firmada en app, interés del cliente, scoring interno aprobado.

**Bankinter:**
- PROS: Oferta inicial rápida (apificado). Gran diversidad de operaciones (autopromoción, casos no convencionales). 100% digital, seguimiento expedito. Capacidad operativa amplia (fusión con EVO).
- CONTRAS: Oferta a tipo fijo/mixto menos competitiva. Bonificaciones con seguros obligatorios. No permite 90% financiación a través de bróker.
- Para subir a riesgos: Cuenta abierta, alta en sistema/FIPRE firmada, interés + documentación completa.

**BBVA:**
- PROS: Oferta inmediata tras validación API. Oferta atractiva a tipo fijo sin vinculaciones para rentas altas. Financiación hasta 90%.
- CONTRAS: Tiempos prolongados de contacto gestor. Riesgos debe sancionar antes de tasación. Comunicación híbrida y lenta.
- PROCESO: Oferta genérica automática → Cliente confirma interés por correo (nuevo, no hilo) con territorial en copia → Gestor contacta en 48-72h → Apertura cuenta + FIPRE → Riesgos → Tasación → Firma.
- Para subir a riesgos: Apertura cuenta, documentación inicial aprobada en app, interés del cliente, scoring interno aprobado.

**Kutxabank/CajaSur:**
- PROS: Mayor control del proceso (automatización). Flexibilidad para mejorar oferta. Bonificaciones opcionales (ninguna obligatoria). Buena relación con Trioteca. Atención personalizada. Oferta mixta atractiva.
- CONTRAS: Bonificaciones elevan TAE significativamente. Oferta fija no tan competitiva. Oferta final puede no coincidir con inicial. A veces requiere ir a oficina tras proceso digital.
- Para subir a riesgos: Cuenta abierta, solicitud de operación de riesgo, declaración de bienes y CIRBE, informe de tasación, interés + documentación completa.

### Conceptos clave para novatos
- **TIN (Tipo de Interés Nominal)**: Es el porcentaje de interés que te cobra el banco sobre el dinero prestado. Cuanto más bajo, menos pagas cada mes.
- **TAE (Tasa Anual Equivalente)**: Incluye el TIN más todos los gastos asociados (seguros, comisiones). Es el coste REAL de tu hipoteca. Compara siempre por TAE.
- **Euríbor**: Es el índice de referencia europeo. Si tu hipoteca es variable, tu cuota sube o baja según el Euríbor.
- **Bonificaciones**: Son productos que el banco te pide contratar (nómina, seguros) a cambio de reducir tu tipo de interés.
- **Amortización anticipada**: Pagar parte de lo que debes antes de tiempo. Algunos bancos cobran comisión por ello.
- **FIPRE**: Documento informativo que te da el banco. NO es vinculante, no te compromete a nada.
- **FEIN**: Documento final con las condiciones definitivas. Debes recibirlo al menos 10 días antes de firmar.
- **Arras/Señal**: Dinero que entregas como garantía de que vas a comprar la vivienda.
- **Tasación**: Valoración oficial del inmueble que determina cuánto te puede prestar el banco.

Directrices:
- Responde siempre en español
- Sé conciso pero completo (máximo 3-4 párrafos)
- Usa ejemplos numéricos cuando sea útil
- Prioriza la información del Trioteca Journal antes de responder con conocimiento general
- Si no estás seguro de un dato específico, indícalo claramente
- Recomienda siempre consultar con el gestor de Trioteca para condiciones definitivas
- Mantén un tono profesional pero cercano y accesible
- Cuando expliques un concepto, imagina que se lo explicas a un amigo que no sabe nada de hipotecas`;

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const body = await req.json();
    const { messages, share_token } = body ?? {};

    // ─── Auth gate: require a valid Supabase JWT (gestor/admin) OR a valid
    // share_token tied to a published operation. Rejects anonymous abuse.
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const admin = createClient(supabaseUrl, serviceRoleKey);

    let authorized = false;
    const authHeader = req.headers.get("Authorization");
    if (authHeader?.startsWith("Bearer ")) {
      const token = authHeader.replace("Bearer ", "");
      // Ignore the anon publishable key — only treat real user JWTs as auth
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

    // Validate messages payload
    if (!Array.isArray(messages) || messages.length === 0 || messages.length > 40) {
      return new Response(JSON.stringify({ error: "Invalid messages" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const totalLen = messages.reduce(
      (n: number, m: any) => n + (typeof m?.content === "string" ? m.content.length : 0),
      0,
    );
    if (totalLen > 20_000) {
      return new Response(JSON.stringify({ error: "Payload too large" }), {
        status: 413,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          ...messages,
        ],
        stream: true,
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Demasiadas solicitudes, intenta de nuevo en unos segundos." }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "Créditos agotados." }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const t = await response.text();
      console.error("AI gateway error:", response.status, t);
      return new Response(JSON.stringify({ error: "Error del servicio de IA" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(response.body, {
      headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
    });
  } catch (e) {
    console.error("chat error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
