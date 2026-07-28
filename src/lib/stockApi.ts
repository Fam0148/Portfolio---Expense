/**
 * stockApi.ts — Real-time stock data scraped from TradingView & Tickertape
 *
 * Uses Vite dev proxy to bypass CORS:
 *   /api/tradingview/* → scanner.tradingview.com/*
 *   /api/tickertape/*  → api.tickertape.in/*
 *
 * TradingView scanner covers ALL Indian stocks (NSE + BSE) including
 * newly listed, unpopular, and micro-cap stocks.
 */

// ── Cache ────────────────────────────────────────────────────────────────────
const CACHE_TTL_MS = 3 * 60 * 1000 // 3 minutes

interface CacheEntry<T> {
  data: T
  timestamp: number
}

const priceCache = new Map<string, CacheEntry<PriceResult>>()
const searchCache = new Map<string, CacheEntry<StockSearchResult[]>>()

function getCached<T>(cache: Map<string, CacheEntry<T>>, key: string): T | null {
  const entry = cache.get(key)
  if (entry && Date.now() - entry.timestamp < CACHE_TTL_MS) {
    return entry.data
  }
  cache.delete(key)
  return null
}

function setCache<T>(cache: Map<string, CacheEntry<T>>, key: string, data: T) {
  cache.set(key, { data, timestamp: Date.now() })
}

// ── Types ────────────────────────────────────────────────────────────────────
export interface StockSearchResult {
  symbol: string
  yahooSymbol: string
  shortname: string
  exchange: string
  type: string
  price?: number | null
}

export interface PriceResult {
  price: number | null
  change: number | null
  currency: string
  symbol: string
}

// ── TradingView Scanner (Primary — full coverage) ────────────────────────────

/**
 * Search stocks via TradingView scanner.
 * Covers every single NSE/BSE listed stock with real-time close price.
 */
async function fetchFromTradingView(
  query: string,
  limit: number = 10
): Promise<StockSearchResult[]> {
  try {
    // Request extra results so we can deduplicate NSE vs BSE
    const resp = await fetch('/api/tradingview/india/scan2', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        columns: ['close', 'change', 'description', 'type', 'exchange'],
        filter: [{ left: 'name', operation: 'match', right: query }],
        sort: { sortBy: 'market_cap_basic', sortOrder: 'desc' },
        range: [0, limit * 3],
      }),
      signal: AbortSignal.timeout(4000),
    })

    if (!resp.ok) return []

    const data = await resp.json()
    const entries = data?.symbols || []

    // Group by ticker, prefer NSE over BSE
    const tickerMap = new Map<string, { exchange: string; entry: any }>()
    for (const entry of entries) {
      const fullSym = entry.s || ''
      const [exchange, ticker] = fullSym.split(':')
      if (!ticker) continue
      const cleanTicker = ticker.toUpperCase()

      const existing = tickerMap.get(cleanTicker)
      if (!existing || (exchange === 'NSE' && existing.exchange !== 'NSE')) {
        tickerMap.set(cleanTicker, { exchange, entry })
      }
    }

    const results: StockSearchResult[] = []
    for (const [cleanTicker, { entry }] of tickerMap) {
      const price = entry.f?.[0] ? parseFloat(entry.f[0]) : null
      const changePct = entry.f?.[1] ? parseFloat(entry.f[1]) : null
      const name = entry.f?.[2] || cleanTicker

      // Cache price immediately
      if (price && price > 0) {
        setCache(priceCache, cleanTicker, {
          price: parseFloat(price.toFixed(2)),
          change: changePct ? parseFloat(changePct.toFixed(2)) : 0,
          currency: 'INR',
          symbol: `${cleanTicker}.NS`,
        })
      }

      results.push({
        symbol: cleanTicker,
        yahooSymbol: `${cleanTicker}.NS`,
        shortname: name,
        exchange: 'NSE',
        type: 'EQUITY',
        price: price ? parseFloat(price.toFixed(2)) : null,
      })

      if (results.length >= limit) break
    }

    return results
  } catch {
    return []
  }
}

/**
 * Fetch a single stock's real-time price from TradingView.
 */
async function fetchPriceFromTradingView(symbol: string): Promise<PriceResult | null> {
  try {
    const resp = await fetch('/api/tradingview/india/scan2', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        columns: ['close', 'change', 'description'],
        filter: [{ left: 'name', operation: 'match', right: symbol }],
        sort: { sortBy: 'market_cap_basic', sortOrder: 'desc' },
        range: [0, 5],
      }),
      signal: AbortSignal.timeout(4000),
    })

    if (!resp.ok) return null

    const data = await resp.json()
    const entries = data?.symbols || []

    // Find exact ticker match
    const exact = entries.find((s: any) => {
      const ticker = (s.s || '').split(':')[1] || ''
      return ticker.toUpperCase() === symbol.toUpperCase()
    })
    const best = exact || entries[0]

    if (best?.f?.[0]) {
      const price = parseFloat(best.f[0])
      const changePct = best.f[1] ? parseFloat(best.f[1]) : 0

      if (price > 0) {
        return {
          price: parseFloat(price.toFixed(2)),
          change: parseFloat(changePct.toFixed(2)),
          currency: 'INR',
          symbol: `${symbol}.NS`,
        }
      }
    }

    return null
  } catch {
    return null
  }
}

// ── Tickertape (Secondary — enriches popular stock names) ────────────────────

async function fetchFromTickertape(query: string): Promise<StockSearchResult[]> {
  try {
    const resp = await fetch(`/api/tickertape/search?text=${encodeURIComponent(query)}`, {
      signal: AbortSignal.timeout(3000),
    })

    if (!resp.ok) return []

    const data = await resp.json()
    const stocks = data?.data?.stocks || []

    return stocks.map((s: any) => {
      const price = s.quote?.price ? parseFloat(s.quote.price) : null
      const ticker = (s.ticker || s.sid || '').toUpperCase()

      if (price && ticker) {
        setCache(priceCache, ticker, {
          price,
          change: s.quote?.change ? parseFloat(s.quote.change) : 0,
          currency: 'INR',
          symbol: `${ticker}.NS`,
        })
      }

      return {
        symbol: ticker,
        yahooSymbol: `${ticker}.NS`,
        shortname: s.name || ticker,
        exchange: 'NSE',
        type: 'EQUITY',
        price,
      }
    })
  } catch {
    return []
  }
}

async function fetchPriceFromTickertape(symbol: string): Promise<PriceResult | null> {
  try {
    const resp = await fetch(`/api/tickertape/search?text=${encodeURIComponent(symbol)}`, {
      signal: AbortSignal.timeout(3000),
    })

    if (!resp.ok) return null

    const data = await resp.json()
    const stocks = data?.data?.stocks || []

    const exact = stocks.find(
      (s: any) => (s.ticker || '').toUpperCase() === symbol.toUpperCase()
    )
    const best = exact || stocks[0]

    if (best?.quote?.price) {
      const price = parseFloat(best.quote.price)
      const prevClose = best.quote.close ? parseFloat(best.quote.close) : null
      const changePct = prevClose && prevClose > 0
        ? ((price - prevClose) / prevClose) * 100
        : (best.quote.change ? parseFloat(best.quote.change) : 0)

      return {
        price: parseFloat(price.toFixed(2)),
        change: parseFloat(changePct.toFixed(2)),
        currency: 'INR',
        symbol: `${symbol}.NS`,
      }
    }

    return null
  } catch {
    return null
  }
}

// ── Local Dataset (Instant fallback while APIs load) ─────────────────────────

const LOCAL_STOCKS: StockSearchResult[] = [
  { symbol: 'RELIANCE', yahooSymbol: 'RELIANCE.NS', shortname: 'Reliance Industries Ltd.', exchange: 'NSE', type: 'EQUITY' },
  { symbol: 'TCS', yahooSymbol: 'TCS.NS', shortname: 'Tata Consultancy Services Ltd.', exchange: 'NSE', type: 'EQUITY' },
  { symbol: 'HDFCBANK', yahooSymbol: 'HDFCBANK.NS', shortname: 'HDFC Bank Ltd.', exchange: 'NSE', type: 'EQUITY' },
  { symbol: 'INFY', yahooSymbol: 'INFY.NS', shortname: 'Infosys Ltd.', exchange: 'NSE', type: 'EQUITY' },
  { symbol: 'ICICIBANK', yahooSymbol: 'ICICIBANK.NS', shortname: 'ICICI Bank Ltd.', exchange: 'NSE', type: 'EQUITY' },
  { symbol: 'SBIN', yahooSymbol: 'SBIN.NS', shortname: 'State Bank of India', exchange: 'NSE', type: 'EQUITY' },
  { symbol: 'BHARTIARTL', yahooSymbol: 'BHARTIARTL.NS', shortname: 'Bharti Airtel Ltd.', exchange: 'NSE', type: 'EQUITY' },
  { symbol: 'ITC', yahooSymbol: 'ITC.NS', shortname: 'ITC Ltd.', exchange: 'NSE', type: 'EQUITY' },
  { symbol: 'TATAMOTORS', yahooSymbol: 'TATAMOTORS.NS', shortname: 'Tata Motors Ltd.', exchange: 'NSE', type: 'EQUITY' },
  { symbol: 'KOTAKBANK', yahooSymbol: 'KOTAKBANK.NS', shortname: 'Kotak Mahindra Bank Ltd.', exchange: 'NSE', type: 'EQUITY' },
  { symbol: 'LT', yahooSymbol: 'LT.NS', shortname: 'Larsen & Toubro Ltd.', exchange: 'NSE', type: 'EQUITY' },
  { symbol: 'AXISBANK', yahooSymbol: 'AXISBANK.NS', shortname: 'Axis Bank Ltd.', exchange: 'NSE', type: 'EQUITY' },
  { symbol: 'MARUTI', yahooSymbol: 'MARUTI.NS', shortname: 'Maruti Suzuki India Ltd.', exchange: 'NSE', type: 'EQUITY' },
  { symbol: 'SUNPHARMA', yahooSymbol: 'SUNPHARMA.NS', shortname: 'Sun Pharmaceutical Industries', exchange: 'NSE', type: 'EQUITY' },
  { symbol: 'TITAN', yahooSymbol: 'TITAN.NS', shortname: 'Titan Company Ltd.', exchange: 'NSE', type: 'EQUITY' },
  { symbol: 'WIPRO', yahooSymbol: 'WIPRO.NS', shortname: 'Wipro Ltd.', exchange: 'NSE', type: 'EQUITY' },
  { symbol: 'BAJFINANCE', yahooSymbol: 'BAJFINANCE.NS', shortname: 'Bajaj Finance Ltd.', exchange: 'NSE', type: 'EQUITY' },
  { symbol: 'NTPC', yahooSymbol: 'NTPC.NS', shortname: 'NTPC Ltd.', exchange: 'NSE', type: 'EQUITY' },
  { symbol: 'TATASTEEL', yahooSymbol: 'TATASTEEL.NS', shortname: 'Tata Steel Ltd.', exchange: 'NSE', type: 'EQUITY' },
  { symbol: 'ZOMATO', yahooSymbol: 'ZOMATO.NS', shortname: 'Zomato Ltd.', exchange: 'NSE', type: 'EQUITY' },
  { symbol: 'ADANIENT', yahooSymbol: 'ADANIENT.NS', shortname: 'Adani Enterprises Ltd.', exchange: 'NSE', type: 'EQUITY' },
  { symbol: 'HAL', yahooSymbol: 'HAL.NS', shortname: 'Hindustan Aeronautics Ltd.', exchange: 'NSE', type: 'EQUITY' },
  { symbol: 'NSDL', yahooSymbol: 'NSDL.NS', shortname: 'National Securities Depository Ltd.', exchange: 'NSE', type: 'EQUITY' },
  { symbol: 'SWIGGY', yahooSymbol: 'SWIGGY.NS', shortname: 'Swiggy Ltd.', exchange: 'NSE', type: 'EQUITY' },
  { symbol: 'TATATECH', yahooSymbol: 'TATATECH.NS', shortname: 'Tata Technologies Ltd.', exchange: 'NSE', type: 'EQUITY' },
  { symbol: 'IREDA', yahooSymbol: 'IREDA.NS', shortname: 'Indian Renewable Energy Dev.', exchange: 'NSE', type: 'EQUITY' },
  { symbol: 'LICI', yahooSymbol: 'LICI.NS', shortname: 'Life Insurance Corp. of India', exchange: 'NSE', type: 'EQUITY' },
  { symbol: 'HYUNDAI', yahooSymbol: 'HYUNDAI.NS', shortname: 'Hyundai Motor India Ltd.', exchange: 'NSE', type: 'EQUITY' },
  { symbol: 'WAAREEENER', yahooSymbol: 'WAAREEENER.NS', shortname: 'Waaree Energies Ltd.', exchange: 'NSE', type: 'EQUITY' },
  { symbol: 'CDSL', yahooSymbol: 'CDSL.NS', shortname: 'Central Depository Services Ltd.', exchange: 'NSE', type: 'EQUITY' },
  { symbol: 'SUZLON', yahooSymbol: 'SUZLON.NS', shortname: 'Suzlon Energy Ltd.', exchange: 'NSE', type: 'EQUITY' },
  { symbol: 'PAYTM', yahooSymbol: 'PAYTM.NS', shortname: 'One97 Communications (Paytm)', exchange: 'NSE', type: 'EQUITY' },
  { symbol: 'RVNL', yahooSymbol: 'RVNL.NS', shortname: 'Rail Vikas Nigam Ltd.', exchange: 'NSE', type: 'EQUITY' },
  { symbol: 'IRFC', yahooSymbol: 'IRFC.NS', shortname: 'Indian Railway Finance Corp.', exchange: 'NSE', type: 'EQUITY' },
  { symbol: 'BSE', yahooSymbol: 'BSE.NS', shortname: 'BSE India Ltd.', exchange: 'NSE', type: 'EQUITY' },
  { symbol: 'BEL', yahooSymbol: 'BEL.NS', shortname: 'Bharat Electronics Ltd.', exchange: 'NSE', type: 'EQUITY' },
  { symbol: 'TATAPOWER', yahooSymbol: 'TATAPOWER.NS', shortname: 'Tata Power Company Ltd.', exchange: 'NSE', type: 'EQUITY' },
  { symbol: 'HCLTECH', yahooSymbol: 'HCLTECH.NS', shortname: 'HCL Technologies Ltd.', exchange: 'NSE', type: 'EQUITY' },
  { symbol: 'HINDUNILVR', yahooSymbol: 'HINDUNILVR.NS', shortname: 'Hindustan Unilever Ltd.', exchange: 'NSE', type: 'EQUITY' },
  { symbol: 'POWERGRID', yahooSymbol: 'POWERGRID.NS', shortname: 'Power Grid Corp. of India', exchange: 'NSE', type: 'EQUITY' },
]

export function getLocalMatches(query: string): StockSearchResult[] {
  const q = query.toUpperCase().trim()
  if (!q) return []

  const matches = LOCAL_STOCKS.filter(
    s =>
      s.symbol.includes(q) ||
      s.shortname.toUpperCase().includes(q)
  )

  // If no exact match, add a dynamic entry so user can type any ticker
  if (!matches.some(m => m.symbol === q) && q.length >= 2 && !q.includes(' ')) {
    matches.push({
      symbol: q,
      yahooSymbol: `${q}.NS`,
      shortname: `${q} Stock`,
      exchange: 'NSE',
      type: 'EQUITY',
    })
  }

  return matches.slice(0, 10)
}

// ── Public API ───────────────────────────────────────────────────────────────

/**
 * Search for stocks. Scrapes TradingView + Tickertape in parallel.
 */
export async function searchStocks(query: string): Promise<StockSearchResult[]> {
  const q = query.toUpperCase().trim()
  if (!q || q.length < 1) return []

  const cached = getCached(searchCache, q)
  if (cached) return cached

  // Fire TradingView + Tickertape in parallel
  const [tvResults, ttResults] = await Promise.all([
    fetchFromTradingView(q),
    fetchFromTickertape(q),
  ])

  // Merge: TradingView first (full coverage + live price), then Tickertape, then local
  const localMatches = getLocalMatches(q)
  const merged: StockSearchResult[] = []
  const added = new Set<string>()

  for (const s of tvResults) {
    if (s.symbol && !added.has(s.symbol)) {
      added.add(s.symbol)
      // Enrich name from Tickertape if available
      const tt = ttResults.find(t => t.symbol === s.symbol)
      if (tt?.shortname) s.shortname = tt.shortname
      if (!s.price && tt?.price) s.price = tt.price
      merged.push(s)
    }
  }

  for (const s of ttResults) {
    if (s.symbol && !added.has(s.symbol)) {
      added.add(s.symbol)
      merged.push(s)
    }
  }

  for (const s of localMatches) {
    if (s.symbol && !added.has(s.symbol)) {
      added.add(s.symbol)
      merged.push(s)
    }
  }

  const results = merged.slice(0, 10)
  if (results.length > 0) {
    setCache(searchCache, q, results)
  }
  return results
}

/**
 * Fetch the real-time market price for any stock symbol.
 * Scrapes TradingView first, then Tickertape as fallback.
 */
export async function fetchLivePrice(symbol: string): Promise<PriceResult> {
  const cleanSym = symbol.toUpperCase().replace(/\.(NS|BO)$/, '').trim()

  // Check cache
  const cached = getCached(priceCache, cleanSym)
  if (cached) return cached

  // 1. TradingView (covers every stock)
  const tvPrice = await fetchPriceFromTradingView(cleanSym)
  if (tvPrice && tvPrice.price && tvPrice.price > 0) {
    setCache(priceCache, cleanSym, tvPrice)
    return tvPrice
  }

  // 2. Tickertape (popular stocks)
  const ttPrice = await fetchPriceFromTickertape(cleanSym)
  if (ttPrice && ttPrice.price && ttPrice.price > 0) {
    setCache(priceCache, cleanSym, ttPrice)
    return ttPrice
  }

  // 3. No data available
  return {
    price: null,
    change: null,
    currency: 'INR',
    symbol: `${cleanSym}.NS`,
  }
}

/**
 * Fetch live prices for multiple symbols in parallel.
 */
export async function fetchLivePrices(symbols: string[]): Promise<Map<string, PriceResult>> {
  const results = new Map<string, PriceResult>()
  await Promise.all(
    symbols.map(async (sym) => {
      results.set(sym, await fetchLivePrice(sym))
    })
  )
  return results
}

/**
 * Clear all cached data (useful for manual refresh).
 */
export function clearPriceCache() {
  priceCache.clear()
  searchCache.clear()
}
