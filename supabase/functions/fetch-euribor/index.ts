import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.4";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

const CACHE_KEY = 'euribor';
const CACHE_TTL_MS = 24 * 60 * 60 * 1000; // 24 hours

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  );

  try {
    // Check cache first
    const { data: cached } = await supabase
      .from('cached_rates')
      .select('value, fetched_at')
      .eq('key', CACHE_KEY)
      .maybeSingle();

    if (cached) {
      const age = Date.now() - new Date(cached.fetched_at).getTime();
      if (age < CACHE_TTL_MS) {
        console.log('Returning cached Euribor:', cached.value);
        return new Response(
          JSON.stringify({ success: true, euribor: Number(cached.value), cached: true }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    }

    // Scrape fresh value
    const euribor = await scrapeEuribor();
    console.log('Scraped Euribor:', euribor);

    // Upsert cache
    await supabase
      .from('cached_rates')
      .upsert({ key: CACHE_KEY, value: euribor, fetched_at: new Date().toISOString() });

    return new Response(
      JSON.stringify({ success: true, euribor }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error fetching Euribor:', error);
    return new Response(
      JSON.stringify({ success: true, euribor: 2.45, fallback: true }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

async function scrapeEuribor(): Promise<number> {
  const url = 'https://datosmacro.expansion.com/hipotecas/euribor';
  const res = await fetch(url, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      'Accept': 'text/html,application/xhtml+xml',
      'Accept-Language': 'es-ES,es;q=0.9',
    },
  });

  if (!res.ok) throw new Error(`Page returned ${res.status}`);
  const html = await res.text();

  // Priority patterns for monthly average (media mensual)
  const patterns = [
    // "Último" summary block with the official monthly average
    /[ÚU]ltimo[^<]*<[^>]*>[^<]*<[^>]*>\s*(\d+[.,]\d{2,3})\s*%/i,
    // Table cell after month name with value
    /(?:enero|febrero|marzo|abril|mayo|junio|julio|agosto|septiembre|octubre|noviembre|diciembre)\s+\d{4}[^<]*<\/td>\s*<td[^>]*>\s*(\d+[.,]\d{2,3})%?\s*<\/td/i,
    // First data row in the Euribor Mensual table
    /Euribor\s+Mensual[^]*?<td[^>]*>\s*(\d+[.,]\d{2,3})%?\s*<\/td/i,
    // Generic table cell with reasonable Euribor value (last resort)
    /<td[^>]*>\s*(\d+[.,]\d{3})\s*%?\s*<\/td/i,
  ];

  for (const pattern of patterns) {
    const match = html.match(pattern);
    if (match) {
      const val = parseFloat(match[1].replace(',', '.'));
      if (!isNaN(val) && val > 0 && val < 10) {
        return val;
      }
    }
  }

  // Fallback: try expansion.com
  const fallbackRes = await fetch('https://www.expansion.com/mercados/euribor.html', {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      'Accept': 'text/html',
    },
  });

  if (fallbackRes.ok) {
    const fallbackHtml = await fallbackRes.text();
    const fallbackMatch = fallbackHtml.match(/(\d+[.,]\d{2,3})\s*%/);
    if (fallbackMatch) {
      const val = parseFloat(fallbackMatch[1].replace(',', '.'));
      if (!isNaN(val) && val > 0 && val < 10) return val;
    }
  } else {
    await fallbackRes.text(); // consume body
  }

  throw new Error('Could not extract Euribor from any source');
}
