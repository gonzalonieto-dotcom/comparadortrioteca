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
  // Try datosmacro first (most reliable for Spain CPI YoY)
  try {
    return await scrapeFromDatosmacro();
  } catch (e) {
    console.warn('Datosmacro failed, trying INE fallback:', e);
  }
  // Fallback to INE (official source)
  return await scrapeFromINE();
}

const HEADERS = {
  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  'Accept': 'text/html,application/xhtml+xml',
  'Accept-Language': 'es-ES,es;q=0.9',
};

function isPlausible(v: number): boolean {
  return !isNaN(v) && v >= -5 && v < 30;
}

async function scrapeFromDatosmacro(): Promise<number> {
  const url = 'https://datosmacro.expansion.com/ipc-paises/espana';
  const res = await fetch(url, { headers: HEADERS });
  if (!res.ok) throw new Error(`datosmacro returned ${res.status}`);
  const html = await res.text();

  // Strategy: find the most recent row in the main IPC table.
  // Datosmacro typically renders rows like:
  //   <td><a>IPC España Marzo 2026</a></td><td>2,6%</td><td>...</td>
  // We grab the first row (top = most recent) and extract the second cell.
  const rowMatch = html.match(
    /IPC\s+Espa[ñn]a[^<]{0,40}<\/a>\s*<\/td>\s*<td[^>]*>\s*(-?\d+[.,]\d{1,2})\s*%/i
  );
  if (rowMatch) {
    const val = parseFloat(rowMatch[1].replace(',', '.'));
    if (isPlausible(val)) return val;
  }

  // Fallback: explicit "Variación anual" label
  const varMatch = html.match(/Variaci[óo]n\s+anual[^]*?(-?\d+[.,]\d{1,2})\s*%/i);
  if (varMatch) {
    const val = parseFloat(varMatch[1].replace(',', '.'));
    if (isPlausible(val)) return val;
  }

  throw new Error('Could not extract inflation from datosmacro');
}

async function scrapeFromINE(): Promise<number> {
  // INE publishes IPC YoY at this stable resource.
  const url = 'https://www.ine.es/dyngs/Prensa/IPC.htm';
  const res = await fetch(url, { headers: HEADERS });
  if (!res.ok) throw new Error(`INE returned ${res.status}`);
  const html = await res.text();

  // INE writes things like: "tasa de variación anual ... 2,6%"
  const patterns = [
    /variaci[óo]n\s+anual[^%]{0,200}?(-?\d+[.,]\d{1,2})\s*%/i,
    /IPC[^%]{0,200}?(-?\d+[.,]\d{1,2})\s*%/i,
  ];
  for (const p of patterns) {
    const m = html.match(p);
    if (m) {
      const val = parseFloat(m[1].replace(',', '.'));
      if (isPlausible(val)) return val;
    }
  }
  throw new Error('Could not extract inflation from INE');
}
