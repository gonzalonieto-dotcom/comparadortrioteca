import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.4";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

const CACHE_KEY = 'inflation';
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
        console.log('Returning cached inflation:', cached.value);
        return new Response(
          JSON.stringify({ success: true, inflation: Number(cached.value), cached: true }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    }

    // Scrape fresh value
    const inflation = await scrapeInflation();
    console.log('Scraped inflation:', inflation);

    // Upsert cache
    await supabase
      .from('cached_rates')
      .upsert({ key: CACHE_KEY, value: inflation, fetched_at: new Date().toISOString() });

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

async function scrapeInflation(): Promise<number> {
  const url = 'https://datosmacro.expansion.com/ipc-paises/espana';
  const res = await fetch(url, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      'Accept': 'text/html,application/xhtml+xml',
      'Accept-Language': 'es-ES,es;q=0.9',
    },
  });

  if (!res.ok) throw new Error(`Page returned ${res.status}`);
  const html = await res.text();

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
        return val;
      }
    }
  }

  throw new Error('Could not extract inflation from page');
}
