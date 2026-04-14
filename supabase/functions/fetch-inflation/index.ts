const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const url = 'https://datosmacro.expansion.com/ipc-paises/espana';
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
    let inflation: number | null = null;

    // Try multiple patterns to extract IPC interanual
    const patterns = [
      /interanual[^]*?(\d+[.,]\d+)\s*%/i,
      /IPC[^]*?(\d+[.,]\d{1,2})\s*%/i,
      /Variaci[óo]n\s*anual[^]*?(\d+[.,]\d{1,2})/i,
      />(\d+[.,]\d{1,2})%?\s*<\/td/i,
    ];

    for (const pattern of patterns) {
      const match = html.match(pattern);
      if (match) {
        const val = parseFloat(match[1].replace(',', '.'));
        if (!isNaN(val) && val >= -5 && val < 30) {
          inflation = val;
          break;
        }
      }
    }

    if (inflation === null) {
      console.warn('Could not extract inflation, using default 3%');
      inflation = 3.0;
    }

    console.log('Spanish inflation rate:', inflation);
    return new Response(
      JSON.stringify({ success: true, inflation }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error fetching inflation:', error);
    return new Response(
      JSON.stringify({ success: true, inflation: 3.0, fallback: true }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
