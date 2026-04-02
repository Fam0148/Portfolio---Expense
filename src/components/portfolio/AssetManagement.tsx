import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { supabase } from "../../lib/supabase"
import { Pencil, Trash2, History, Plus, X, Search, Calendar, BadgeIndianRupee, Hash } from "lucide-react"

interface Stock {
  id: string
  symbol: string
  name: string
  purchase_date: string
  purchase_price: number
  quantity: number
  current_price?: number
}

const ConfirmationModal = ({ isOpen, onClose, onConfirm, title, message }: {
  isOpen: boolean,
  onClose: () => void,
  onConfirm: () => void,
  title: string,
  message: string
}) => (
  <AnimatePresence>
    {isOpen && (
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 bg-black/20 backdrop-blur-sm"
        />
        <motion.div
          initial={{ scale: 0.95, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.95, opacity: 0, y: 20 }}
          className="relative bg-white p-6 sm:p-8 rounded-[28px] border border-gray-100 shadow-2xl max-w-sm w-full text-center"
        >
          <div className="w-14 h-14 bg-red-50 rounded-2xl flex items-center justify-center mx-auto mb-5 text-red-500">
            <Trash2 size={28} />
          </div>
          <h3 className="text-xl font-serif font-bold text-[#171717] mb-2">{title}</h3>
          <p className="text-sm text-gray-500 mb-8 leading-relaxed">{message}</p>
          <div className="flex flex-col sm:flex-row gap-3">
            <button
              onClick={onClose}
              className="flex-1 px-6 py-2.5 rounded-xl border border-gray-200 text-sm font-bold text-gray-600 hover:bg-gray-50 transition-all active:scale-95"
            >
              Cancel
            </button>
            <button
              onClick={() => { onConfirm(); onClose(); }}
              className="flex-1 px-6 py-2.5 rounded-xl bg-red-600 text-white text-sm font-bold hover:bg-red-700 transition-all shadow-md shadow-red-100 active:scale-95"
            >
              Delete Asset
            </button>
          </div>
        </motion.div>
      </div>
    )}
  </AnimatePresence>
)

interface StockLog {
  id: string
  symbol: string
  quantity: number
  price: number
  transaction_date: string
  type: 'BUY' | 'SELL' | 'UPDATE' | 'DELETE' | 'AVERAGE'
  created_at: string
}

const HistoryModal = ({ isOpen, onClose, stock }: { isOpen: boolean, onClose: () => void, stock: Stock | null }) => {
  const [logs, setLogs] = useState<StockLog[]>([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (isOpen && stock) {
      const fetchLogs = async () => {
        setLoading(true)
        try {
          const { data: { user } } = await supabase.auth.getUser()
          if (!user) return

          const { data, error } = await supabase
            .from('stock_logs')
            .select('*')
            .eq('symbol', stock.symbol)
            .eq('user_id', user.id) // Ensure we only see our own logs
            .order('transaction_date', { ascending: false })
            .order('created_at', { ascending: false })
          
          if (error) throw error
          setLogs(data || [])
        } catch (err) {
          console.error('Error fetching logs:', err)
        } finally {
          setLoading(false)
        }
      }
      fetchLogs()
    }
  }, [isOpen, stock])

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose} className="absolute inset-0 bg-black/20 backdrop-blur-sm" />
          <motion.div initial={{ scale: 0.95, opacity: 0, y: 20 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.95, opacity: 0, y: 20 }} className="relative bg-white p-6 sm:p-8 rounded-[28px] border border-gray-100 shadow-2xl max-w-sm w-full">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-serif font-bold text-[#171717]">Asset History</h3>
              <button onClick={onClose} className="p-1.5 hover:bg-gray-100 rounded-lg text-gray-400"><X size={20} /></button>
            </div>

            <div className="max-h-[40vh] overflow-y-auto mb-8 pr-2 custom-scrollbar">
              <div className="space-y-6 relative before:absolute before:left-3 before:top-2 before:bottom-2 before:w-[1.5px] before:bg-gray-100">
                {loading ? (
                  <div className="pl-10 py-4 text-xs text-gray-400 italic">Fetching transaction history...</div>
                ) : logs.length === 0 ? (
                  <div className="relative pl-10">
                    <div className="absolute left-1.5 top-1.5 w-3 h-3 rounded-full bg-gray-400 ring-4 ring-white" />
                    <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">Initial Position</p>
                    <p className="text-sm font-bold text-[#171717]">{stock?.quantity} Shares of {stock?.symbol}</p>
                    <p className="text-[11px] text-gray-500 mt-0.5">Bought at ₹{stock?.purchase_price.toLocaleString()} per share</p>
                  </div>
                ) : (
                  logs.map((log) => (
                    <div key={log.id} className="relative pl-10">
                      <div className={`absolute left-1.5 top-1.5 w-3 h-3 rounded-full ring-4 ring-white ${
                        log.type === 'BUY' ? 'bg-[#171717]' : 
                        log.type === 'AVERAGE' ? 'bg-blue-500' : 
                        log.type === 'UPDATE' ? 'bg-amber-500' : 
                        'bg-red-500'
                      }`} />
                      <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">
                        {log.type === 'BUY' ? 'Initial Position' : 
                         log.type === 'AVERAGE' ? 'Shares Added (Averaged)' : 
                         log.type === 'UPDATE' ? 'Position Updated' : 
                         'Asset Removed'} - {new Date(log.transaction_date).toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' })}
                      </p>
                      <p className="text-sm font-bold text-[#171717]">{log.quantity} Shares @ ₹{Number(log.price).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
                      <p className="text-[10px] text-gray-500 mt-0.5 italic">Transaction logged successfully</p>
                    </div>
                  ))
                )}
              </div>
            </div>

            <button onClick={onClose} className="w-full px-6 py-2.5 rounded-xl bg-gray-50 border border-gray-100 text-sm font-bold text-gray-600 hover:bg-gray-100 transition-all">Close History</button>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  )
}

export const AssetManagement = () => {
  const [stocks, setStocks] = useState<Stock[]>([])
  const [loading, setLoading] = useState(true)
  const [form, setForm] = useState({
    symbol: "",
    name: "",
    purchase_date: new Date().toISOString().split('T')[0],
    price: "",
    quantity: ""
  })
  const [isAdding, setIsAdding] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)

  const [deleteModal, setDeleteModal] = useState({ isOpen: false, id: "" })
  const [historyModal, setHistoryModal] = useState<{ isOpen: boolean, stock: Stock | null }>({ isOpen: false, stock: null })

  const [suggestions, setSuggestions] = useState<any[]>([])
  const [showSuggestions, setShowSuggestions] = useState(false)

  const fetchStocks = async () => {
    try {
      setLoading(true)
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { data, error } = await supabase
        .from('stocks')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })

      if (error) throw error

      const stocksWithPrice = (data || []).map(s => ({
        ...s,
        current_price: s.purchase_price * (1 + (Math.random() * 0.4 - 0.1))
      }))

      setStocks(stocksWithPrice)
    } catch (err) {
      console.error('Error fetching stocks:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchStocks()
  }, [])

  // Top NSE Stocks — instant local search, zero API dependency
  const NSE_STOCKS = [
    { symbol: 'RELIANCE', shortname: 'Reliance Industries Ltd.', exchange: 'NSE' },
    { symbol: 'TCS', shortname: 'Tata Consultancy Services', exchange: 'NSE' },
    { symbol: 'HDFCBANK', shortname: 'HDFC Bank Ltd.', exchange: 'NSE' },
    { symbol: 'INFY', shortname: 'Infosys Ltd.', exchange: 'NSE' },
    { symbol: 'ICICIBANK', shortname: 'ICICI Bank Ltd.', exchange: 'NSE' },
    { symbol: 'HINDUNILVR', shortname: 'Hindustan Unilever Ltd.', exchange: 'NSE' },
    { symbol: 'SBIN', shortname: 'State Bank of India', exchange: 'NSE' },
    { symbol: 'BAJFINANCE', shortname: 'Bajaj Finance Ltd.', exchange: 'NSE' },
    { symbol: 'BHARTIARTL', shortname: 'Bharti Airtel Ltd.', exchange: 'NSE' },
    { symbol: 'KOTAKBANK', shortname: 'Kotak Mahindra Bank Ltd.', exchange: 'NSE' },
    { symbol: 'ASIANPAINT', shortname: 'Asian Paints Ltd.', exchange: 'NSE' },
    { symbol: 'LT', shortname: 'Larsen & Toubro Ltd.', exchange: 'NSE' },
    { symbol: 'AXISBANK', shortname: 'Axis Bank Ltd.', exchange: 'NSE' },
    { symbol: 'MARUTI', shortname: 'Maruti Suzuki India Ltd.', exchange: 'NSE' },
    { symbol: 'SUNPHARMA', shortname: 'Sun Pharmaceutical Industries', exchange: 'NSE' },
    { symbol: 'TITAN', shortname: 'Titan Company Ltd.', exchange: 'NSE' },
    { symbol: 'ULTRACEMCO', shortname: 'UltraTech Cement Ltd.', exchange: 'NSE' },
    { symbol: 'WIPRO', shortname: 'Wipro Ltd.', exchange: 'NSE' },
    { symbol: 'NESTLEIND', shortname: 'Nestle India Ltd.', exchange: 'NSE' },
    { symbol: 'ONGC', shortname: 'Oil & Natural Gas Corp.', exchange: 'NSE' },
    { symbol: 'POWERGRID', shortname: 'Power Grid Corp. of India', exchange: 'NSE' },
    { symbol: 'NTPC', shortname: 'NTPC Ltd.', exchange: 'NSE' },
    { symbol: 'TATAMOTORS', shortname: 'Tata Motors Ltd.', exchange: 'NSE' },
    { symbol: 'TATASTEEL', shortname: 'Tata Steel Ltd.', exchange: 'NSE' },
    { symbol: 'JSWSTEEL', shortname: 'JSW Steel Ltd.', exchange: 'NSE' },
    { symbol: 'HCLTECH', shortname: 'HCL Technologies Ltd.', exchange: 'NSE' },
    { symbol: 'TECHM', shortname: 'Tech Mahindra Ltd.', exchange: 'NSE' },
    { symbol: 'BPCL', shortname: 'Bharat Petroleum Corp.', exchange: 'NSE' },
    { symbol: 'COALINDIA', shortname: 'Coal India Ltd.', exchange: 'NSE' },
    { symbol: 'DIVISLAB', shortname: "Divi's Laboratories Ltd.", exchange: 'NSE' },
    { symbol: 'DRREDDY', shortname: "Dr. Reddy's Laboratories", exchange: 'NSE' },
    { symbol: 'CIPLA', shortname: 'Cipla Ltd.', exchange: 'NSE' },
    { symbol: 'GRASIM', shortname: 'Grasim Industries Ltd.', exchange: 'NSE' },
    { symbol: 'BAJAJFINSV', shortname: 'Bajaj Finserv Ltd.', exchange: 'NSE' },
    { symbol: 'BAJAJ-AUTO', shortname: 'Bajaj Auto Ltd.', exchange: 'NSE' },
    { symbol: 'HDFCLIFE', shortname: 'HDFC Life Insurance Co.', exchange: 'NSE' },
    { symbol: 'SBILIFE', shortname: 'SBI Life Insurance Co.', exchange: 'NSE' },
    { symbol: 'ADANIENT', shortname: 'Adani Enterprises Ltd.', exchange: 'NSE' },
    { symbol: 'ADANIPORTS', shortname: 'Adani Ports & SEZ Ltd.', exchange: 'NSE' },
    { symbol: 'ITC', shortname: 'ITC Ltd.', exchange: 'NSE' },
    { symbol: 'M&M', shortname: 'Mahindra & Mahindra Ltd.', exchange: 'NSE' },
    { symbol: 'EICHERMOT', shortname: 'Eicher Motors Ltd.', exchange: 'NSE' },
    { symbol: 'HEROMOTOCO', shortname: 'Hero MotoCorp Ltd.', exchange: 'NSE' },
    { symbol: 'APOLLOHOSP', shortname: 'Apollo Hospitals Enterprise', exchange: 'NSE' },
    { symbol: 'INDUSINDBK', shortname: 'IndusInd Bank Ltd.', exchange: 'NSE' },
    { symbol: 'UPL', shortname: 'UPL Ltd.', exchange: 'NSE' },
    { symbol: 'SHREECEM', shortname: 'Shree Cement Ltd.', exchange: 'NSE' },
    { symbol: 'PIDILITIND', shortname: 'Pidilite Industries Ltd.', exchange: 'NSE' },
    { symbol: 'DABUR', shortname: 'Dabur India Ltd.', exchange: 'NSE' },
    { symbol: 'MARICO', shortname: 'Marico Ltd.', exchange: 'NSE' },
    { symbol: 'GODREJCP', shortname: 'Godrej Consumer Products', exchange: 'NSE' },
    { symbol: 'BRITANNIA', shortname: 'Britannia Industries Ltd.', exchange: 'NSE' },
    { symbol: 'TATAPOWER', shortname: 'Tata Power Co. Ltd.', exchange: 'NSE' },
    { symbol: 'VEDL', shortname: 'Vedanta Ltd.', exchange: 'NSE' },
    { symbol: 'HINDALCO', shortname: 'Hindalco Industries Ltd.', exchange: 'NSE' },
    { symbol: 'BANKBARODA', shortname: 'Bank of Baroda', exchange: 'NSE' },
    { symbol: 'PNB', shortname: 'Punjab National Bank', exchange: 'NSE' },
    { symbol: 'CANBK', shortname: 'Canara Bank', exchange: 'NSE' },
    { symbol: 'UNIONBANK', shortname: 'Union Bank of India', exchange: 'NSE' },
    { symbol: 'IDBI', shortname: 'IDBI Bank Ltd.', exchange: 'NSE' },
    { symbol: 'FEDERALBNK', shortname: 'Federal Bank Ltd.', exchange: 'NSE' },
    { symbol: 'IDFCFIRSTB', shortname: 'IDFC First Bank Ltd.', exchange: 'NSE' },
    { symbol: 'BANDHANBNK', shortname: 'Bandhan Bank Ltd.', exchange: 'NSE' },
    { symbol: 'RBLBANK', shortname: 'RBL Bank Ltd.', exchange: 'NSE' },
    { symbol: 'YESBANK', shortname: 'Yes Bank Ltd.', exchange: 'NSE' },
    { symbol: 'IRFC', shortname: 'Indian Railway Finance Corp.', exchange: 'NSE' },
    { symbol: 'HAL', shortname: 'Hindustan Aeronautics Ltd.', exchange: 'NSE' },
    { symbol: 'BEL', shortname: 'Bharat Electronics Ltd.', exchange: 'NSE' },
    { symbol: 'RECLTD', shortname: 'REC Ltd.', exchange: 'NSE' },
    { symbol: 'PFC', shortname: 'Power Finance Corp. Ltd.', exchange: 'NSE' },
    { symbol: 'NHPC', shortname: 'NHPC Ltd.', exchange: 'NSE' },
    { symbol: 'GAIL', shortname: 'GAIL (India) Ltd.', exchange: 'NSE' },
    { symbol: 'IOC', shortname: 'Indian Oil Corp. Ltd.', exchange: 'NSE' },
    { symbol: 'SAIL', shortname: 'Steel Authority of India', exchange: 'NSE' },
    { symbol: 'NMDC', shortname: 'NMDC Ltd.', exchange: 'NSE' },
    { symbol: 'ZOMATO', shortname: 'Zomato Ltd.', exchange: 'NSE' },
    { symbol: 'PAYTM', shortname: 'One 97 Communications Ltd.', exchange: 'NSE' },
    { symbol: 'NYKAA', shortname: 'FSN E-Commerce Ventures Ltd.', exchange: 'NSE' },
    { symbol: 'DELHIVERY', shortname: 'Delhivery Ltd.', exchange: 'NSE' },
    { symbol: 'POLICYBZR', shortname: 'PB Fintech Ltd.', exchange: 'NSE' },
    { symbol: 'IXIGO', shortname: 'Le Travenues Technology Ltd.', exchange: 'NSE' },
    { symbol: 'SWIGGY', shortname: 'Bundl Technologies Ltd.', exchange: 'NSE' },
    { symbol: 'IDEA', shortname: 'Vodafone Idea Ltd.', exchange: 'NSE' },
    { symbol: 'TATACOMM', shortname: 'Tata Communications Ltd.', exchange: 'NSE' },
    { symbol: 'MTNL', shortname: 'MTNL', exchange: 'NSE' },
    { symbol: 'DMART', shortname: 'Avenue Supermarts Ltd.', exchange: 'NSE' },
    { symbol: 'TRENT', shortname: 'Trent Ltd.', exchange: 'NSE' },
    { symbol: 'VMART', shortname: 'V-Mart Retail Ltd.', exchange: 'NSE' },
    { symbol: 'SHOPERSTOP', shortname: 'Shoppers Stop Ltd.', exchange: 'NSE' },
    { symbol: 'JUSTDIAL', shortname: 'Just Dial Ltd.', exchange: 'NSE' },
    { symbol: 'IRCTC', shortname: 'Indian Railway Catering & Tourism', exchange: 'NSE' },
    { symbol: 'LAURUSLABS', shortname: 'Laurus Labs Ltd.', exchange: 'NSE' },
    { symbol: 'AUROPHARMA', shortname: 'Aurobindo Pharma Ltd.', exchange: 'NSE' },
    { symbol: 'BIOCON', shortname: 'Biocon Ltd.', exchange: 'NSE' },
    { symbol: 'TORNTPHARM', shortname: 'Torrent Pharmaceuticals Ltd.', exchange: 'NSE' },
    { symbol: 'ABBOTINDIA', shortname: 'Abbott India Ltd.', exchange: 'NSE' },
    { symbol: 'LUPIN', shortname: 'Lupin Ltd.', exchange: 'NSE' },
    { symbol: 'ALKEM', shortname: 'Alkem Laboratories Ltd.', exchange: 'NSE' },
    { symbol: 'GRANULES', shortname: 'Granules India Ltd.', exchange: 'NSE' },
    { symbol: 'MUTHOOTFIN', shortname: 'Muthoot Finance Ltd.', exchange: 'NSE' },
    { symbol: 'CHOLAFIN', shortname: 'Cholamandalam Investment & Finance', exchange: 'NSE' },
    { symbol: 'LICHSGFIN', shortname: 'LIC Housing Finance Ltd.', exchange: 'NSE' },
    { symbol: 'PNBHOUSING', shortname: 'PNB Housing Finance Ltd.', exchange: 'NSE' },
    { symbol: 'MANAPPURAM', shortname: 'Manappuram Finance Ltd.', exchange: 'NSE' },
    { symbol: 'SBICARD', shortname: 'SBI Cards and Payment Services', exchange: 'NSE' },
    { symbol: 'ICICIPRULI', shortname: 'ICICI Prudential Life Insurance', exchange: 'NSE' },
    { symbol: 'STARHEALTH', shortname: 'Star Health & Allied Insurance', exchange: 'NSE' },
    { symbol: 'NIACL', shortname: 'The New India Assurance Co.', exchange: 'NSE' },
  ]

  const SUPABASE_FUNCTION_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/stock-search`
  const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY

  // Stock Search — instant local preview + live backend results
  useEffect(() => {
    if (!form.symbol || form.symbol.length < 1 || !showSuggestions) {
      setSuggestions([])
      return
    }

    const query = form.symbol.toUpperCase().trim()

    // 1. Instantly show local matches (0ms)
    const localMatches = NSE_STOCKS.filter(s =>
      s.symbol.startsWith(query) ||
      s.shortname.toUpperCase().includes(query) ||
      s.symbol.includes(query)
    ).slice(0, 8)
    setSuggestions(localMatches)

    // 2. Fetch from backend Edge Function (real NSE data)
    const timer = setTimeout(async () => {
      try {
        const resp = await fetch(
          `${SUPABASE_FUNCTION_URL}?action=search&q=${encodeURIComponent(query)}`,
          { headers: { apikey: SUPABASE_ANON_KEY, Authorization: `Bearer ${SUPABASE_ANON_KEY}` } }
        )
        if (!resp.ok) return
        const data = await resp.json()
        if (data?.results?.length > 0) {
          setSuggestions(data.results.slice(0, 8))
        }
      } catch (e) {
        // Keep local results visible on error
      }
    }, 400)

    return () => clearTimeout(timer)
  }, [form.symbol, showSuggestions])

  const handleSelectSuggestion = async (quote: any) => {
    const yahooSymbol = quote.yahooSymbol || `${quote.symbol}.NS`
    const displaySymbol = quote.symbol
    const name = quote.shortname
    setForm({ ...form, symbol: displaySymbol, name })
    setShowSuggestions(false)

    // Fetch live price via Supabase Edge Function (server-side, no CORS)
    try {
      const resp = await fetch(
        `${SUPABASE_FUNCTION_URL}?action=price&q=${encodeURIComponent(yahooSymbol)}`,
        { headers: { apikey: SUPABASE_ANON_KEY, Authorization: `Bearer ${SUPABASE_ANON_KEY}` } }
      )
      if (!resp.ok) throw new Error('Price fetch failed')
      const data = await resp.json()
      if (data?.price) {
        setForm(prev => ({ ...prev, symbol: displaySymbol, name, price: data.price.toString() }))
      }
    } catch (err) {
      console.warn('Backend price fetch failed, trying fallback...', err)
      // Fallback: allorigins proxy
      try {
        const r = await fetch(`https://api.allorigins.win/raw?url=${encodeURIComponent(`https://query1.finance.yahoo.com/v8/finance/chart/${yahooSymbol}?interval=1d&range=1d`)}`)
        const d = await r.json()
        const price = d?.chart?.result?.[0]?.meta?.regularMarketPrice
        if (price) setForm(prev => ({ ...prev, symbol: displaySymbol, name, price: parseFloat(price).toFixed(2) }))
      } catch { /* silent */ }
    }
  }

  // Handle clicking outside suggestions
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (!(e.target as HTMLElement).closest('.stock-search-group')) {
        setShowSuggestions(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleEdit = (stock: Stock) => {
    setForm({
      symbol: stock.symbol,
      name: stock.name,
      purchase_date: stock.purchase_date,
      price: stock.purchase_price.toFixed(2),
      quantity: stock.quantity.toString()
    })
    setEditingId(stock.id)
    setIsAdding(true)
  }

  const handleAddOrUpdate = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.symbol || !form.price || !form.quantity) return

    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const symbolUpper = form.symbol.toUpperCase()
      const inputPrice = parseFloat(form.price)
      const inputQty = parseFloat(form.quantity)
      const existingStock = stocks.find(s => s.symbol === symbolUpper)

      // 1. Transaction Log Entry
      const logEntry: any = {
        user_id: user.id,
        symbol: symbolUpper,
        quantity: inputQty,
        price: inputPrice,
        transaction_date: form.purchase_date,
        type: editingId ? 'UPDATE' : (existingStock ? 'AVERAGE' : 'BUY')
      }

      if (editingId) {
        // Simple Update (Manual edit)
        const { error } = await supabase
          .from('stocks')
          .update({
            symbol: symbolUpper,
            name: form.name || symbolUpper,
            purchase_price: inputPrice,
            quantity: inputQty,
            purchase_date: form.purchase_date
          })
          .eq('id', editingId)
        if (error) throw error
      } else if (existingStock) {
        // 2. Averaging (Merge into existing)
        const totalQty = existingStock.quantity + inputQty
        const weightedAvgPrice = Number((((existingStock.purchase_price * existingStock.quantity) + (inputPrice * inputQty)) / totalQty).toFixed(2))

        const { error } = await supabase
          .from('stocks')
          .update({
            quantity: totalQty,
            purchase_price: weightedAvgPrice,
            purchase_date: form.purchase_date,
            name: form.name || existingStock.name
          })
          .eq('id', existingStock.id)
        if (error) throw error
      } else {
        // 3. New Stock Entry
        const { error } = await supabase
          .from('stocks')
          .insert([{
            user_id: user.id,
            symbol: symbolUpper,
            name: form.name || symbolUpper,
            purchase_date: form.purchase_date,
            purchase_price: inputPrice,
            quantity: inputQty
          }])
        if (error) throw error
      }

      // 4. Always insert a log
      try {
        await supabase.from('stock_logs').insert([logEntry])
      } catch (logErr) {
        console.warn('Logging skipped: stock_logs table issue.', logErr)
      }

      handleCancel()
      fetchStocks()
    } catch (err) {
      console.error('Error handling asset:', err)
    }
  }

  const handleCancel = () => {
    setForm({ symbol: "", name: "", purchase_date: new Date().toISOString().split('T')[0], price: "", quantity: "" })
    setIsAdding(false)
    setEditingId(null)
  }

  const handleDelete = async (id: string) => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const stockToDelete = stocks.find(s => s.id === id)
      
      const { error } = await supabase
        .from('stocks')
        .delete()
        .eq('id', id)
      if (error) throw error

      // Log the deletion (Sell/Remove)
      if (stockToDelete) {
        try {
          await supabase.from('stock_logs').insert([{
            user_id: user.id,
            symbol: stockToDelete.symbol,
            quantity: stockToDelete.quantity,
            price: stockToDelete.purchase_price,
            transaction_date: new Date().toISOString().split('T')[0],
            type: 'DELETE'
          }])
        } catch (lEr) { console.warn('Delete log failed', lEr) }
      }

      fetchStocks()
    } catch (err) {
      console.error('Error deleting stock:', err)
    }
  }

  return (
    <div className="mt-12 bg-white rounded-[24px] border border-gray-100 shadow-sm overflow-hidden text-left">
      <ConfirmationModal
        isOpen={deleteModal.isOpen}
        onClose={() => setDeleteModal({ isOpen: false, id: "" })}
        onConfirm={() => handleDelete(deleteModal.id)}
        title="Remove Asset ?"
        message="Are you sure you want to remove this asset from your portfolio? This action cannot be undone."
      />

      <HistoryModal
        isOpen={historyModal.isOpen}
        onClose={() => setHistoryModal({ isOpen: false, stock: null })}
        stock={historyModal.stock}
      />
      <div className="p-6 sm:p-8">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-5">
          <div>
            <h2 className="text-2xl font-serif font-bold text-[#171717]">Asset Management</h2>
            <p className="text-sm text-gray-500 font-sans mt-1">Manage your holdings and track performance across your portfolio.</p>
          </div>
          <button
            onClick={() => isAdding ? handleCancel() : setIsAdding(true)}
            className="flex items-center justify-center gap-2 bg-[#171717] text-white px-5 py-2.5 rounded-xl text-sm font-bold transition-all hover:bg-black hover:scale-105 active:scale-95 shadow-sm"
          >
            {isAdding ? <X size={18} /> : <Plus size={18} />}
            {isAdding ? "Cancel" : "Add New Stock"}
          </button>
        </div>

        <AnimatePresence>
          {isAdding && (
            <motion.form
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              onSubmit={handleAddOrUpdate}
              className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8 p-6 bg-gray-50/50 rounded-2xl border border-gray-100 overflow-hidden"
            >
              <div className="space-y-1.5 text-left stock-search-group">
                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider ml-1">Symbol</label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                  <input
                    type="text"
                    placeholder="e.g. AAPL"
                    value={form.symbol}
                    onChange={e => {
                      setForm({ ...form, symbol: e.target.value.toUpperCase() })
                      setShowSuggestions(true)
                    }}
                    onFocus={() => setShowSuggestions(true)}
                    className="w-full pl-10 pr-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-black/5 focus:border-black transition-all"
                  />

                  {/* Suggestions Dropdown */}
                  <AnimatePresence>
                    {showSuggestions && form.symbol.length >= 1 && suggestions.length > 0 && (
                      <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 10 }}
                        className="absolute left-0 right-0 top-full mt-2 bg-white border border-gray-100 rounded-2xl shadow-xl z-50"
                      >
                        {suggestions.length > 0 ? (
                          <div className="py-2 max-h-60 overflow-y-auto custom-scrollbar">
                            {suggestions.map((quote, idx) => (
                              <button
                                key={idx}
                                type="button"
                                onClick={() => handleSelectSuggestion(quote)}
                                className="w-full px-4 py-2.5 hover:bg-gray-50 flex items-center justify-between text-left group transition-colors"
                              >
                                <div className="flex flex-col">
                                  <span className="text-sm font-bold text-[#171717]">{quote.symbol}</span>
                                  <span className="text-[10px] text-gray-400 font-medium truncate max-w-[150px]">{quote.shortname || quote.longname}</span>
                                </div>
                                <span className="text-[10px] font-bold text-gray-400 group-hover:text-black transition-colors">{quote.exchange}</span>
                              </button>
                            ))}
                          </div>
                        ) : (
                          <div className="p-4 text-xs text-gray-400 italic">No matches found.</div>
                        )}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </div>
              <div className="space-y-1.5 text-left">
                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider ml-1">Purchase Date</label>
                <div className="relative">
                  <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                  <input
                    type="date"
                    value={form.purchase_date}
                    onChange={e => setForm({ ...form, purchase_date: e.target.value })}
                    className="w-full pl-10 pr-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-black/5 focus:border-black transition-all"
                  />
                </div>
              </div>
              <div className="space-y-1.5 text-left">
                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider ml-1">Price (₹)</label>
                <div className="relative">
                  <BadgeIndianRupee className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                  <input
                    type="number"
                    placeholder="0.00"
                    step="0.01"
                    value={form.price}
                    onChange={e => setForm({ ...form, price: e.target.value })}
                    className="w-full pl-10 pr-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-black/5 focus:border-black transition-all"
                  />
                </div>
              </div>
              <div className="space-y-1.5 text-left">
                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider ml-1">Quantity</label>
                <div className="relative">
                  <Hash className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                  <input
                    type="number"
                    placeholder="0"
                    value={form.quantity}
                    onChange={e => setForm({ ...form, quantity: e.target.value })}
                    className="w-full pl-10 pr-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-black/5 focus:border-black transition-all"
                  />
                </div>
              </div>
              <div className="sm:col-span-2 lg:col-span-4 flex justify-end mt-2">
                <button
                  type="submit"
                  className="bg-[#171717] text-white px-8 py-2.5 rounded-full text-sm font-bold transition-all hover:bg-black"
                >
                  {editingId ? "Update Asset" : "Confirm Asset"}
                </button>
              </div>
            </motion.form>
          )}
        </AnimatePresence>

        <div className="overflow-x-auto">
          <table className="w-full font-sans">
            <thead>
              <tr className="border-b border-gray-100">
                <th className="text-left py-4 px-4 text-[11px] font-bold text-gray-400 uppercase tracking-widest">Asset Name</th>
                <th className="text-left py-4 px-4 text-[11px] font-bold text-gray-400 uppercase tracking-widest">Symbol</th>
                <th className="text-left py-4 px-4 text-[11px] font-bold text-gray-400 uppercase tracking-widest whitespace-nowrap">Purchase Date</th>
                <th className="text-left py-4 px-4 text-[11px] font-bold text-gray-400 uppercase tracking-widest">Holdings</th>
                <th className="text-left py-4 px-4 text-[11px] font-bold text-gray-400 uppercase tracking-widest whitespace-nowrap">Total Value</th>
                <th className="text-left py-4 px-4 text-[11px] font-bold text-gray-400 uppercase tracking-widest">Performance</th>
                <th className="text-right py-4 px-4 text-[11px] font-bold text-gray-400 uppercase tracking-widest">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-gray-400 text-sm italic">Loading your assets...</td>
                </tr>
              ) : stocks.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-gray-400 text-sm italic">No assets found. Add your first stock above.</td>
                </tr>
              ) : (
                stocks.map((stock) => {
                  const totalValue = stock.quantity * (stock.current_price || stock.purchase_price)
                  const pnl = ((stock.current_price || stock.purchase_price) - stock.purchase_price) / stock.purchase_price * 100
                  const isPositive = pnl >= 0

                  return (
                    <tr key={stock.id} className="border-b border-gray-50 hover:bg-gray-50/50 transition-colors group">
                      <td className="py-5 px-4">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-xl bg-gray-100 flex items-center justify-center font-bold text-gray-500 text-sm shadow-sm group-hover:bg-white group-hover:shadow-md transition-all">
                            {stock.symbol[0]}
                          </div>
                          <span className="font-bold text-[#171717]">{stock.name}</span>
                        </div>
                      </td>
                      <td className="py-5 px-4">
                        <span className="text-blue-500 font-bold text-xs uppercase tracking-wider">{stock.symbol}</span>
                      </td>
                      <td className="py-5 px-4 text-sm text-gray-600 font-medium whitespace-nowrap">
                        {new Date(stock.purchase_date).toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' })}
                      </td>
                      <td className="py-5 px-4 font-bold text-[#171717] text-sm whitespace-nowrap">
                        {stock.quantity} <span className="text-gray-400 font-medium text-xs ml-1">Shares</span>
                      </td>
                      <td className="py-5 px-4 font-bold text-[#171717] text-sm whitespace-nowrap">
                        ₹{totalValue.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </td>
                      <td className="py-5 px-4">
                        <span className={`inline-flex px-2.5 py-1 rounded-full text-[11px] font-bold ${isPositive ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-600'
                          }`}>
                          {isPositive ? '+' : ''}{pnl.toFixed(2)}%
                        </span>
                      </td>
                      <td className="py-5 px-4 text-right">
                        <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                          <button
                            onClick={() => setHistoryModal({ isOpen: true, stock: stock })}
                            className="p-2 text-gray-400 hover:text-black hover:bg-gray-100 rounded-lg transition-all"
                            title="Log History"
                          >
                            <History size={16} />
                          </button>
                          <button
                            onClick={() => handleEdit(stock)}
                            className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all"
                            title="Edit Asset"
                          >
                            <Pencil size={16} />
                          </button>
                          <button
                            onClick={() => setDeleteModal({ isOpen: true, id: stock.id })}
                            className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"
                            title="Remove Asset"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
