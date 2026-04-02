import { serve } from "https://deno.land/std@0.177.0/http/server.ts"

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Content-Type": "application/json",
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: CORS })
  }

  const url = new URL(req.url)
  const action = url.searchParams.get("action") // "search" | "price"
  const query = url.searchParams.get("q") || ""

  try {
    if (action === "search") {
      return await handleSearch(query)
    } else if (action === "price") {
      return await handlePrice(query)
    } else {
      return new Response(JSON.stringify({ error: "Unknown action" }), { status: 400, headers: CORS })
    }
  } catch (err) {
    return new Response(JSON.stringify({ error: String(err) }), { status: 500, headers: CORS })
  }
})

// ── Stock Search ──────────────────────────────────────────────────────────────
async function handleSearch(query: string) {
  if (!query || query.length < 1) {
    return new Response(JSON.stringify({ results: [] }), { headers: CORS })
  }

  const results: any[] = []

  // 1. Yahoo Finance Search — server-side, no CORS, reliable
  try {
    const yahooUrl = `https://query1.finance.yahoo.com/v1/finance/search?q=${encodeURIComponent(query)}&quotesCount=20&newsCount=0&listsCount=0`
    const resp = await fetch(yahooUrl, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
        "Accept": "application/json",
      },
      signal: AbortSignal.timeout(5000),
    })

    if (resp.ok) {
      const data = await resp.json()
      const quotes = data?.quotes || []

      // Filter NSE (.NS) and BSE (.BO)
      for (const q of quotes) {
        if (q.symbol && (q.symbol.endsWith(".NS") || q.symbol.endsWith(".BO"))) {
          results.push({
            symbol: q.symbol.replace(/\.(NS|BO)$/, ""),   // clean ticker e.g. RELIANCE
            yahooSymbol: q.symbol,                          // full Yahoo symbol e.g. RELIANCE.NS
            shortname: q.shortname || q.longname || q.symbol,
            exchange: q.symbol.endsWith(".NS") ? "NSE" : "BSE",
            type: q.quoteType || "EQUITY",
          })
        }
      }
    }
  } catch (e) {
    console.warn("Yahoo search failed:", e)
  }

  // 2. NSE India Autocomplete — directly accessible server-side
  if (results.length === 0) {
    try {
      const nseUrl = `https://www.nseindia.com/api/search-autocomplete?q=${encodeURIComponent(query)}`
      const resp = await fetch(nseUrl, {
        headers: {
          "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
          "Accept": "application/json",
          "Referer": "https://www.nseindia.com/",
        },
        signal: AbortSignal.timeout(5000),
      })
      if (resp.ok) {
        const data = await resp.json()
        const items = data?.symbols || []
        for (const s of items) {
          results.push({
            symbol: s.symbol,
            yahooSymbol: `${s.symbol}.NS`,
            shortname: s.symbol_info || s.symbol,
            exchange: "NSE",
            type: s.result_type || "EQUITY",
          })
        }
      }
    } catch (e) {
      console.warn("NSE search failed:", e)
    }
  }

  return new Response(JSON.stringify({ results }), { headers: CORS })
}

// ── Live Price ────────────────────────────────────────────────────────────────
async function handlePrice(yahooSymbol: string) {
  if (!yahooSymbol) {
    return new Response(JSON.stringify({ price: null }), { headers: CORS })
  }

  // Ensure .NS suffix for NSE stocks if not provided
  const sym = yahooSymbol.includes(".") ? yahooSymbol : `${yahooSymbol}.NS`

  try {
    const url = `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(sym)}?interval=1d&range=1d`
    const resp = await fetch(url, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
        "Accept": "application/json",
      },
      signal: AbortSignal.timeout(6000),
    })

    if (!resp.ok) throw new Error(`Yahoo price fetch failed: ${resp.status}`)

    const data = await resp.json()
    const meta = data?.chart?.result?.[0]?.meta
    const price = meta?.regularMarketPrice
    const prevClose = meta?.previousClose || meta?.chartPreviousClose
    const change = price && prevClose ? ((price - prevClose) / prevClose) * 100 : null
    const currency = meta?.currency || "INR"

    return new Response(JSON.stringify({
      price: price ? parseFloat(price.toFixed(2)) : null,
      change: change ? parseFloat(change.toFixed(2)) : null,
      currency,
      symbol: sym,
    }), { headers: CORS })
  } catch (e) {
    return new Response(JSON.stringify({ price: null, error: String(e) }), { headers: CORS })
  }
}
