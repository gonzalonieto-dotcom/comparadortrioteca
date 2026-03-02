const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const url = 'https://www.expansion.com/mercados/tipos-interes/euribor.html';
    const res = await fetch(url, {
      headers: { 'User-Agent': 'Mozilla/5.0 (compatible; Trioteca/1.0)' },
    });

    if (!res.ok) {
      throw new Error(`Expansion returned ${res.status}`);
    }

    const html = await res.text();

    // Look for the Euribor value pattern on the page
    // The page shows values like "2,456%" or "-0,123%"
    const match = html.match(/euribor[^]*?(-?\d+[.,]\d+)\s*%/i)
      || html.match(/dato-cotizacion[^>]*>([^<]*(-?\d+[.,]\d+))/i)
      || html.match(/>(-?\d+,\d{2,3})%?<\/span/i);

    if (!match) {
      console.error('Could not extract Euribor value from Expansion page');
      return new Response(
        JSON.stringify({ success: false, error: 'Could not parse Euribor value' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Extract the numeric value, converting comma to dot
    const rawValue = match[1] || match[2];
    const euribor = parseFloat(rawValue.replace(',', '.'));

    if (isNaN(euribor)) {
      return new Response(
        JSON.stringify({ success: false, error: 'Parsed value is not a number' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Euribor fetched:', euribor);
    return new Response(
      JSON.stringify({ success: true, euribor }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error fetching Euribor:', error);
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
