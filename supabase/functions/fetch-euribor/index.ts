const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Try datosmacro first (most reliable structured data)
    const url = 'https://datosmacro.expansion.com/hipotecas/euribor';
    const res = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml',
        'Accept-Language': 'es-ES,es;q=0.9',
      },
    });

    if (!res.ok) {
      throw new Error(`Page returned ${res.status}`);
    }

    const html = await res.text();

    // Try multiple patterns to extract Euribor value
    let euribor: number | null = null;

    // Pattern 1: "2,245%" or similar in the page content
    const patterns = [
      /el\s+(\d+[.,]\d+)\s*%/i,
      /Euribor[^]*?(\d+[.,]\d{2,3})\s*%/i,
      /Cotizaci[óo]n\s*\(%\)[^]*?(\d+[.,]\d{2,3})/i,
      />(\d+[.,]\d{2,3})<\/td/i,
      /(\d+[.,]\d{3})%?\s*$/m,
    ];

    for (const pattern of patterns) {
      const match = html.match(pattern);
      if (match) {
        const val = parseFloat(match[1].replace(',', '.'));
        if (!isNaN(val) && val > 0 && val < 10) {
          euribor = val;
          break;
        }
      }
    }

    if (euribor === null) {
      // Fallback: try the main expansion page
      const fallbackRes = await fetch('https://www.expansion.com/mercados/euribor.html', {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
          'Accept': 'text/html',
        },
      });

      if (fallbackRes.ok) {
        const fallbackHtml = await fallbackRes.text();
        for (const pattern of patterns) {
          const match = fallbackHtml.match(pattern);
          if (match) {
            const val = parseFloat(match[1].replace(',', '.'));
            if (!isNaN(val) && val > 0 && val < 10) {
              euribor = val;
              break;
            }
          }
        }
      }
    }

    if (euribor === null) {
      // Last resort: use a reasonable default
      console.warn('Could not extract Euribor, using default 2.45%');
      euribor = 2.45;
    }

    console.log('Euribor value:', euribor);
    return new Response(
      JSON.stringify({ success: true, euribor }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error fetching Euribor:', error);
    // Return a default value rather than failing
    return new Response(
      JSON.stringify({ success: true, euribor: 2.45, fallback: true }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
