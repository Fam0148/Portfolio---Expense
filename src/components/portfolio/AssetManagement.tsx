import { useState, useEffect, useRef } from "react"
import { createPortal } from "react-dom"
import { motion, AnimatePresence } from "framer-motion"
import { supabase } from "../../lib/supabase"
import {
  Pencil, Trash2, History, Plus, X, Search, Calendar,
  BadgeIndianRupee, Hash, MoreVertical, ShieldCheck,
  TrendingUp, Timer, Percent
} from "lucide-react"

interface Stock {
  id: string
  symbol: string
  name: string
  purchase_date: string
  purchase_price: number
  quantity: number
  current_price?: number
  asset_type?: 'STOCK' | 'BOND'
  tenure?: string
  ytm?: string
}

// ── Confirmation Modal ─────────────────────────────────────────────────────────
const ConfirmationModal = ({ isOpen, onClose, onConfirm, title, message }: {
  isOpen: boolean
  onClose: () => void
  onConfirm: () => void
  title: string
  message: string
}) => (
  <AnimatePresence>
    {isOpen && (
      <div className="fixed inset-0 z-[300] flex items-center justify-center p-4">
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          onClick={onClose} className="absolute inset-0 bg-black/40 backdrop-blur-md" />
        <motion.div initial={{ scale: 0.95, opacity: 0, y: 20 }} animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.95, opacity: 0, y: 20 }}
          className="relative bg-white p-6 sm:p-8 rounded-[28px] border border-gray-100 shadow-2xl max-w-sm w-full text-center z-10">
          <div className="w-14 h-14 bg-red-50 rounded-2xl flex items-center justify-center mx-auto mb-5 text-red-500">
            <Trash2 size={28} />
          </div>
          <h3 className="text-xl font-serif font-bold text-[#171717] mb-2">{title}</h3>
          <p className="text-sm text-gray-500 mb-8 leading-relaxed">{message}</p>
          <div className="flex flex-col sm:flex-row gap-3">
            <button onClick={onClose}
              className="flex-1 px-6 py-2.5 rounded-xl border border-gray-200 text-sm font-bold text-gray-600 hover:bg-gray-50 transition-all active:scale-95">
              Cancel
            </button>
            <button onClick={() => { onConfirm(); onClose() }}
              className="flex-1 px-6 py-2.5 rounded-xl bg-red-600 text-white text-sm font-bold hover:bg-red-700 transition-all shadow-md shadow-red-100 active:scale-95">
              Delete Asset
            </button>
          </div>
        </motion.div>
      </div>
    )}
  </AnimatePresence>
)

// ── History Modal ──────────────────────────────────────────────────────────────
interface StockLog {
  id: string; symbol: string; quantity: number; price: number
  transaction_date: string; type: 'BUY' | 'SELL' | 'UPDATE' | 'DELETE' | 'AVERAGE'; created_at: string
}

const HistoryModal = ({ isOpen, onClose, stock }: { isOpen: boolean; onClose: () => void; stock: Stock | null }) => {
  const [logs, setLogs] = useState<StockLog[]>([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (isOpen && stock) {
      const fetchLogs = async () => {
        setLoading(true)
        try {
          const { data: { user } } = await supabase.auth.getUser()
          if (!user) return
          const { data, error } = await supabase.from('stock_logs').select('*')
            .eq('symbol', stock.symbol).eq('user_id', user.id)
            .order('transaction_date', { ascending: false })
            .order('created_at', { ascending: false })
          if (error) throw error
          setLogs(data || [])
        } catch (err) { console.error('Error fetching logs:', err) }
        finally { setLoading(false) }
      }
      fetchLogs()
    }
  }, [isOpen, stock])

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[300] flex items-center justify-center p-4">
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={onClose} className="absolute inset-0 bg-black/40 backdrop-blur-md" />
          <motion.div initial={{ scale: 0.95, opacity: 0, y: 20 }} animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.95, opacity: 0, y: 20 }}
            className="relative bg-white p-6 sm:p-8 rounded-[28px] border border-gray-100 shadow-2xl max-w-sm w-full z-10">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-serif font-bold text-[#171717]">Asset History</h3>
              <button onClick={onClose} className="p-1.5 hover:bg-gray-100 rounded-lg text-gray-400"><X size={20} /></button>
            </div>
            <div className="max-h-[40vh] overflow-y-auto mb-8 pr-2">
              <div className="space-y-6 relative before:absolute before:left-3 before:top-2 before:bottom-2 before:w-[1.5px] before:bg-gray-100">
                {loading ? (
                  <div className="pl-10 py-4 text-xs text-gray-400 italic">Fetching transaction history...</div>
                ) : logs.length === 0 ? (
                  <div className="relative pl-10">
                    <div className="absolute left-1.5 top-1.5 w-3 h-3 rounded-full bg-gray-400 ring-4 ring-white" />
                    <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">Initial Position</p>
                    <p className="text-sm font-bold text-[#171717]">{stock?.quantity} units of {stock?.symbol}</p>
                    <p className="text-[11px] text-gray-500 mt-0.5">At ₹{stock?.purchase_price.toLocaleString()} per unit</p>
                  </div>
                ) : logs.map((log) => (
                  <div key={log.id} className="relative pl-10">
                    <div className={`absolute left-1.5 top-1.5 w-3 h-3 rounded-full ring-4 ring-white ${log.type === 'BUY' ? 'bg-[#171717]' : log.type === 'AVERAGE' ? 'bg-blue-500' :
                      log.type === 'UPDATE' ? 'bg-amber-500' : 'bg-red-500'}`} />
                    <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">
                      {log.type === 'BUY' ? 'Initial Position' : log.type === 'AVERAGE' ? 'Units Added (Averaged)' :
                        log.type === 'UPDATE' ? 'Position Updated' : 'Asset Removed'} —{' '}
                      {new Date(log.transaction_date).toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' })}
                    </p>
                    <p className="text-sm font-bold text-[#171717]">{log.quantity} units @ ₹{Number(log.price).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
                    <p className="text-[10px] text-gray-500 mt-0.5 italic">Transaction logged</p>
                  </div>
                ))}
              </div>
            </div>
            <button onClick={onClose} className="w-full px-6 py-2.5 rounded-xl bg-gray-50 border border-gray-100 text-sm font-bold text-gray-600 hover:bg-gray-100 transition-all">
              Close History
            </button>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  )
}

// ── Main Component ─────────────────────────────────────────────────────────────
export const AssetManagement = () => {
  const [stocks, setStocks] = useState<Stock[]>([])
  const [loading, setLoading] = useState(true)
  const [form, setForm] = useState({
    symbol: "", name: "",
    purchase_date: new Date().toISOString().split('T')[0],
    price: "", quantity: "", tenure: "", ytm: ""
  })
  const [isAdding, setIsAdding] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [deleteModal, setDeleteModal] = useState({ isOpen: false, id: "" })
  const [historyModal, setHistoryModal] = useState<{ isOpen: boolean; stock: Stock | null }>({ isOpen: false, stock: null })
  const [openMenuId, setOpenMenuId] = useState<string | null>(null)
  const [menuPos, setMenuPos] = useState({ top: 0, right: 0 })
  const menuRef = useRef<HTMLDivElement | null>(null)
  const [activeTab, setActiveTab] = useState<'STOCK' | 'BOND'>('STOCK')
  const [suggestions, setSuggestions] = useState<any[]>([])
  const [showSuggestions, setShowSuggestions] = useState(false)

  // ── Close menu on outside click (reliable ref-based approach) ──────────────
  useEffect(() => {
    if (!openMenuId) return
    const handler = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setOpenMenuId(null)
      }
    }
    const timer = setTimeout(() => document.addEventListener('mousedown', handler), 0)
    return () => { clearTimeout(timer); document.removeEventListener('mousedown', handler) }
  }, [openMenuId])

  // ── Close suggestions on outside click ────────────────────────────────────
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (!(e.target as HTMLElement).closest('.stock-search-group')) setShowSuggestions(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const SUPABASE_FUNCTION_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/stock-search`
  const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || ""

  // ── Fetch stocks ───────────────────────────────────────────────────────────
  const fetchStocks = async () => {
    try {
      setLoading(true)
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      const { data, error } = await supabase.from('stocks').select('*')
        .eq('user_id', user.id).order('created_at', { ascending: false })
      if (error) throw error

      const rawStocks = data || []

      // Fetch live prices for non-bonds
      const withPrice = await Promise.all(rawStocks.map(async (s: Stock) => {
        const type = s.asset_type || (s.ytm || s.tenure ? 'BOND' : 'STOCK')
        let current = s.purchase_price

        if (type !== 'BOND') {
          try {
            const sym = s.symbol.includes('.') ? s.symbol : `${s.symbol}.NS`
            const r = await fetch(`${SUPABASE_FUNCTION_URL}?action=price&q=${encodeURIComponent(sym)}`,
              { headers: { apikey: SUPABASE_ANON_KEY, Authorization: `Bearer ${SUPABASE_ANON_KEY}` } })
            if (r.ok) {
              const d = await r.json()
              if (d?.price) current = d.price
            } else {
              // Second fallback to Yahoo Chart API directly via proxy
              const p = await fetch(`https://api.allorigins.win/raw?url=${encodeURIComponent(`https://query1.finance.yahoo.com/v8/finance/chart/${sym}?interval=1d&range=1d`)}`)
              const d = await p.json()
              const lp = d?.chart?.result?.[0]?.meta?.regularMarketPrice
              if (lp) current = parseFloat(lp)
            }
          } catch { /* keep purchase price as fallback */ }
        }

        return { ...s, asset_type: type as any, current_price: current }
      }))

      setStocks(withPrice)
    } catch (err) { console.error('Error fetching stocks:', err) }
    finally { setLoading(false) }
  }



  const calculateMonthlyRepayment = (stock: Stock) => {
    if (!stock.ytm) return 0;
    const ytm = parseFloat(stock.ytm);
    if (isNaN(ytm)) return 0;
    // Monthly Interest = (Principal * YearlyYTM%) / 12
    return (stock.purchase_price * (ytm / 100)) / 12;
  };

  useEffect(() => { fetchStocks() }, [])

  // ── NSE Stock List for search ──────────────────────────────────────────────
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
    { symbol: 'AXISBANK', shortname: 'Axis Bank Ltd.', exchange: 'NSE' },
    { symbol: 'MARUTI', shortname: 'Maruti Suzuki India Ltd.', exchange: 'NSE' },
    { symbol: 'SUNPHARMA', shortname: 'Sun Pharmaceutical Industries', exchange: 'NSE' },
    { symbol: 'TITAN', shortname: 'Titan Company Ltd.', exchange: 'NSE' },
    { symbol: 'WIPRO', shortname: 'Wipro Ltd.', exchange: 'NSE' },
    { symbol: 'HCLTECH', shortname: 'HCL Technologies Ltd.', exchange: 'NSE' },
    { symbol: 'TATAMOTORS', shortname: 'Tata Motors Ltd.', exchange: 'NSE' },
    { symbol: 'TATASTEEL', shortname: 'Tata Steel Ltd.', exchange: 'NSE' },
    { symbol: 'ZOMATO', shortname: 'Zomato Ltd.', exchange: 'NSE' },
    { symbol: 'IRFC', shortname: 'Indian Railway Finance Corp.', exchange: 'NSE' },
    { symbol: 'HAL', shortname: 'Hindustan Aeronautics Ltd.', exchange: 'NSE' },
    { symbol: 'ITC', shortname: 'ITC Ltd.', exchange: 'NSE' },
    { symbol: 'ADANIENT', shortname: 'Adani Enterprises Ltd.', exchange: 'NSE' },
  ]



  useEffect(() => {
    if (!form.symbol || form.symbol.length < 1 || !showSuggestions || activeTab !== 'STOCK') {
      setSuggestions([]); return
    }
    const query = form.symbol.toUpperCase().trim()
    const localMatches = NSE_STOCKS.filter(s =>
      s.symbol.startsWith(query) || s.shortname.toUpperCase().includes(query)
    ).slice(0, 8)
    setSuggestions(localMatches)
    const timer = setTimeout(async () => {
      try {
        const resp = await fetch(`${SUPABASE_FUNCTION_URL}?action=search&q=${encodeURIComponent(query)}`,
          { headers: { apikey: SUPABASE_ANON_KEY, Authorization: `Bearer ${SUPABASE_ANON_KEY}` } })
        if (!resp.ok) return
        const data = await resp.json()
        if (data?.results?.length > 0) setSuggestions(data.results.slice(0, 8))
      } catch { /* keep local results */ }
    }, 400)
    return () => clearTimeout(timer)
  }, [form.symbol, showSuggestions, activeTab])

  const handleSelectSuggestion = async (quote: any) => {
    const yahooSymbol = quote.yahooSymbol || `${quote.symbol}.NS`
    setForm({ ...form, symbol: quote.symbol, name: quote.shortname })
    setShowSuggestions(false)
    try {
      const resp = await fetch(`${SUPABASE_FUNCTION_URL}?action=price&q=${encodeURIComponent(yahooSymbol)}`,
        { headers: { apikey: SUPABASE_ANON_KEY, Authorization: `Bearer ${SUPABASE_ANON_KEY}` } })
      if (!resp.ok) throw new Error()
      const data = await resp.json()
      if (data?.price) setForm(prev => ({ ...prev, symbol: quote.symbol, name: quote.shortname, price: data.price.toString() }))
    } catch {
      try {
        const r = await fetch(`https://api.allorigins.win/raw?url=${encodeURIComponent(`https://query1.finance.yahoo.com/v8/finance/chart/${yahooSymbol}?interval=1d&range=1d`)}`)
        const d = await r.json()
        const price = d?.chart?.result?.[0]?.meta?.regularMarketPrice
        if (price) setForm(prev => ({ ...prev, symbol: quote.symbol, name: quote.shortname, price: parseFloat(price).toFixed(2) }))
      } catch { /* silent */ }
    }
  }

  const handleEdit = (stock: Stock) => {
    setForm({
      symbol: stock.symbol, name: stock.name, purchase_date: stock.purchase_date,
      price: stock.purchase_price.toFixed(2), quantity: stock.quantity.toString(),
      tenure: stock.tenure || "", ytm: stock.ytm || ""
    })
    setEditingId(stock.id)
    setIsAdding(true)
    // Set tab to match asset type
    const type = stock.asset_type || (stock.ytm || stock.tenure ? 'BOND' : 'STOCK')
    setActiveTab(type as any)
  }

  const handleCancel = () => {
    setForm({ symbol: "", name: "", purchase_date: new Date().toISOString().split('T')[0], price: "", quantity: "", tenure: "", ytm: "" })
    setIsAdding(false)
    setEditingId(null)
  }

  const handleAddOrUpdate = async (e: React.FormEvent) => {
    e.preventDefault()
    const isBond = activeTab === 'BOND'
    if (!form.symbol || !form.price || (!isBond && !form.quantity)) return

    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      const symbolUpper = form.symbol.toUpperCase()
      const inputPrice = parseFloat(form.price)
      const inputQty = isBond ? 1 : parseFloat(form.quantity)
      const existingStock = stocks.find(s => s.symbol === symbolUpper)

      const logEntry: any = {
        user_id: user.id, symbol: symbolUpper, quantity: inputQty, price: inputPrice,
        transaction_date: form.purchase_date,
        type: editingId ? 'UPDATE' : (existingStock ? 'AVERAGE' : 'BUY')
      }

      if (editingId) {
        const { error } = await supabase.from('stocks').update({
          symbol: symbolUpper, name: form.name || symbolUpper,
          purchase_price: inputPrice, quantity: inputQty,
          purchase_date: form.purchase_date,
          asset_type: activeTab,
          tenure: form.tenure || null, ytm: form.ytm || null
        }).eq('id', editingId)
        if (error) throw error
      } else if (existingStock) {
        const totalQty = existingStock.quantity + inputQty
        const weightedAvg = Number((((existingStock.purchase_price * existingStock.quantity) + (inputPrice * inputQty)) / totalQty).toFixed(2))
        const { error } = await supabase.from('stocks').update({
          quantity: totalQty, purchase_price: weightedAvg,
          purchase_date: form.purchase_date, name: form.name || existingStock.name
        }).eq('id', existingStock.id)
        if (error) throw error
      } else {
        const { error } = await supabase.from('stocks').insert([{
          user_id: user.id, symbol: symbolUpper, name: form.name || symbolUpper,
          purchase_date: form.purchase_date, purchase_price: inputPrice, quantity: inputQty,
          asset_type: activeTab, tenure: form.tenure || null, ytm: form.ytm || null
        }])
        if (error) throw error
      }

      try { await supabase.from('stock_logs').insert([logEntry]) } catch { /* skip if table missing */ }
      handleCancel()
      fetchStocks()
    } catch (err) { console.error('Error handling asset:', err) }
  }

  const handleDelete = async (id: string) => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      const stockToDelete = stocks.find(s => s.id === id)
      const { error } = await supabase.from('stocks').delete().eq('id', id)
      if (error) throw error
      if (stockToDelete) {
        try {
          await supabase.from('stock_logs').insert([{
            user_id: user.id, symbol: stockToDelete.symbol,
            quantity: stockToDelete.quantity, price: stockToDelete.purchase_price,
            transaction_date: new Date().toISOString().split('T')[0], type: 'DELETE'
          }])
        } catch { /* skip */ }
      }
      fetchStocks()
    } catch (err) { console.error('Error deleting stock:', err) }
  }

  // Filter visible assets by active tab
  const visibleStocks = stocks.filter(s => {
    const type = s.asset_type || (s.ytm || s.tenure ? 'BOND' : 'STOCK')
    return type === activeTab
  })

  return (
    <div className="bg-white rounded-[24px] border border-gray-100 shadow-sm text-left">
      <ConfirmationModal
        isOpen={deleteModal.isOpen}
        onClose={() => setDeleteModal({ isOpen: false, id: "" })}
        onConfirm={() => handleDelete(deleteModal.id)}
        title="Remove Asset?"
        message="Are you sure you want to remove this asset from your portfolio? This action cannot be undone."
      />
      <HistoryModal
        isOpen={historyModal.isOpen}
        onClose={() => setHistoryModal({ isOpen: false, stock: null })}
        stock={historyModal.stock}
      />

      <div className="p-6 sm:p-8">
        {/* ── Header ── */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-5">
          <div>
            <h2 className="text-2xl font-serif font-bold text-[#171717]">Asset Management</h2>
            <p className="text-sm text-gray-500 font-sans mt-1">Manage your holdings and track performance across your portfolio.</p>
          </div>
          <button
            onClick={() => { if (isAdding && !editingId) { handleCancel() } else if (!isAdding) { setIsAdding(true); setEditingId(null) } }}
            className="flex items-center justify-center gap-2 bg-[#171717] text-white px-5 py-2.5 rounded-xl text-sm font-bold transition-all hover:bg-black hover:scale-105 active:scale-95 shadow-sm"
          >
            {isAdding && !editingId ? <X size={18} /> : <Plus size={18} />}
            {isAdding && !editingId ? "Cancel" : `Add New ${activeTab === 'STOCK' ? 'Stock' : 'Bond'}`}
          </button>
        </div>

        {/* ── Tab Switcher ── */}
        <div className="flex items-center gap-2 p-1.5 bg-gray-50/80 rounded-[18px] w-fit mb-8 border border-gray-100">
          {([
            { id: 'STOCK', label: 'Stocks', icon: TrendingUp },
            { id: 'BOND', label: 'Bonds', icon: ShieldCheck }
          ] as const).map((tab) => (
            <button key={tab.id} onClick={() => { setActiveTab(tab.id); if (isAdding && !editingId) handleCancel() }}
              className={`flex items-center gap-2.5 px-4 py-2 rounded-xl text-xs font-bold transition-all ${activeTab === tab.id
                ? 'bg-white text-[#171717] shadow-sm text-[13px] border border-gray-100'
                : 'text-gray-400 hover:text-gray-600'
                }`}>
              <tab.icon size={15} />
              {tab.label}
            </button>
          ))}
        </div>

        {/* ── INLINE EDIT FORM (slides in inside card) ── */}
        <AnimatePresence>
          {isAdding && editingId && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="overflow-hidden mb-6"
            >
              <div className="bg-blue-50/60 border border-blue-100 rounded-2xl p-5">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <div className="w-1.5 h-5 bg-blue-500 rounded-full" />
                    <span className="text-sm font-bold text-[#171717]">
                      Editing: <span className="text-blue-600">{form.symbol}</span>
                    </span>
                  </div>
                  <button type="button" onClick={handleCancel}
                    className="p-1.5 hover:bg-blue-100 rounded-lg text-gray-400 transition-colors">
                    <X size={16} />
                  </button>
                </div>
                <form onSubmit={handleAddOrUpdate} className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {/* Symbol — read-only when editing */}
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Symbol</label>
                    <div className="px-3 py-2.5 bg-white border border-gray-200 rounded-xl text-sm font-bold text-[#171717]">
                      {form.symbol}
                    </div>
                  </div>
                  {/* Date */}
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Date</label>
                    <div className="relative">
                      <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={14} />
                      <input type="date"
                        className="w-full pl-9 pr-3 py-2.5 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-blue-300 transition-all"
                        value={form.purchase_date} onChange={e => setForm({ ...form, purchase_date: e.target.value })} />
                    </div>
                  </div>
                  {/* Price */}
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                      {activeTab === 'BOND' ? 'Investment (₹)' : 'Avg. Price (₹)'}
                    </label>
                    <div className="relative">
                      <BadgeIndianRupee className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={14} />
                      <input type="number" step="0.01" placeholder="0.00"
                        className="w-full pl-9 pr-3 py-2.5 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-blue-300 transition-all"
                        value={form.price} onChange={e => setForm({ ...form, price: e.target.value })} />
                    </div>
                  </div>
                  {/* Bond fields or Quantity */}
                  {activeTab === 'BOND' ? (
                    <>
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Tenure (Months)</label>
                        <div className="relative">
                          <Timer className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={14} />
                          <input type="text" placeholder="e.g. 12 Months"
                            className="w-full pl-9 pr-3 py-2.5 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-blue-300 transition-all"
                            value={form.tenure} onChange={e => setForm({ ...form, tenure: e.target.value })} />
                        </div>
                      </div>
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">YTM (%)</label>
                        <div className="relative">
                          <Percent className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={14} />
                          <input type="text" placeholder="e.g. 10.25"
                            className="w-full pl-9 pr-3 py-2.5 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-blue-300 transition-all"
                            value={form.ytm} onChange={e => setForm({ ...form, ytm: e.target.value })} />
                        </div>
                      </div>
                    </>
                  ) : (
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                        Quantity
                      </label>
                      <div className="relative">
                        <Hash className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={14} />
                        <input type="number" placeholder="0"
                          className="w-full pl-9 pr-3 py-2.5 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-blue-300 transition-all"
                          value={form.quantity} onChange={e => setForm({ ...form, quantity: e.target.value })} />
                      </div>
                    </div>
                  )}
                  {/* Actions */}
                  <div className="col-span-2 md:col-span-4 flex justify-end gap-2 pt-1">
                    <button type="button" onClick={handleCancel}
                      className="px-5 py-2 rounded-xl text-sm font-bold text-gray-400 hover:bg-white transition-all">
                      Cancel
                    </button>
                    <button type="submit"
                      className="px-6 py-2 rounded-xl bg-blue-600 text-white text-sm font-bold hover:bg-blue-700 transition-all shadow-sm active:scale-95">
                      Save Changes
                    </button>
                  </div>
                </form>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ── ADD NEW MODAL (floating overlay) ── */}
        <AnimatePresence>
          {isAdding && !editingId && (
            <div className="fixed inset-0 z-[400] flex items-center justify-center p-4">
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                onClick={handleCancel} className="absolute inset-0 bg-black/40 backdrop-blur-md" />
              <motion.div initial={{ scale: 0.95, opacity: 0, y: 20 }} animate={{ scale: 1, opacity: 1, y: 0 }}
                exit={{ scale: 0.95, opacity: 0, y: 20 }}
                className="relative bg-white p-6 sm:p-8 rounded-[28px] border border-gray-100 shadow-2xl max-w-4xl w-full overflow-visible z-10">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-xl font-serif font-bold text-[#171717]">
                    Add New {activeTab === 'STOCK' ? 'Stock' : 'Bond'}
                  </h3>
                  <button onClick={handleCancel} className="p-1.5 hover:bg-gray-100 rounded-lg text-gray-400"><X size={20} /></button>
                </div>
                <form onSubmit={handleAddOrUpdate} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
                  {/* Symbol */}
                  <div className="space-y-1.5 text-left stock-search-group">
                    <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider ml-1">
                      {activeTab === 'STOCK' ? 'Symbol' : 'Bond Name'}
                    </label>
                    <div className="relative group/search">
                      <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within/search:text-[#171717] transition-colors" size={16} />
                      <input type="text" placeholder={activeTab === 'STOCK' ? "e.g. RELIANCE" : "e.g. HDFC Bond"}
                        autoComplete="off"
                        className="w-full pl-11 pr-4 py-3 bg-gray-50 border-none rounded-xl text-sm font-medium focus:ring-2 focus:ring-gray-100 transition-all placeholder:text-gray-300"
                        value={form.symbol}
                        onChange={e => {
                          setForm({ ...form, symbol: e.target.value.toUpperCase() })
                          if (activeTab === 'STOCK') setShowSuggestions(true)
                          else setShowSuggestions(false)
                        }}
                      />
                      {showSuggestions && suggestions.length > 0 && activeTab === 'STOCK' && (
                        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                          className="absolute top-[calc(100%+8px)] left-0 right-0 bg-white border border-gray-100 rounded-2xl shadow-xl z-[120] overflow-hidden py-2">
                          {suggestions.map((quote: any) => (
                            <div key={quote.symbol}
                              className="px-4 py-3 hover:bg-gray-50 cursor-pointer flex justify-between items-center transition-colors group"
                              onClick={() => handleSelectSuggestion(quote)}>
                              <div className="flex flex-col">
                                <span className="font-bold text-sm text-[#171717] group-hover:text-blue-600">{quote.symbol}</span>
                                <span className="text-[10px] text-gray-400 truncate max-w-[150px]">{quote.shortname || quote.longname}</span>
                              </div>
                              <span className="text-[10px] font-bold bg-gray-100 text-gray-500 px-1.5 py-0.5 rounded-md uppercase">{quote.exchange}</span>
                            </div>
                          ))}
                        </motion.div>
                      )}
                    </div>
                  </div>
                  {/* Date */}
                  <div className="space-y-1.5 text-left">
                    <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider ml-1">Investment Date</label>
                    <div className="relative group/date">
                      <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within/date:text-[#171717] transition-colors" size={16} />
                      <input type="date"
                        className="w-full pl-11 pr-4 py-3 bg-gray-50 border-none rounded-xl text-sm font-medium focus:ring-2 focus:ring-gray-100 transition-all cursor-pointer"
                        value={form.purchase_date} onChange={e => setForm({ ...form, purchase_date: e.target.value })} />
                    </div>
                  </div>
                  {/* Price */}
                  <div className="space-y-1.5 text-left">
                    <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider ml-1">
                      {activeTab === 'BOND' ? 'Total Investment (₹)' : 'Price (₹)'}
                    </label>
                    <div className="relative group/price">
                      <BadgeIndianRupee className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within/price:text-[#171717] transition-colors" size={16} />
                      <input type="number" placeholder="0.00" step="0.01"
                        className="w-full pl-11 pr-4 py-3 bg-gray-50 border-none rounded-xl text-sm font-medium focus:ring-2 focus:ring-gray-100 transition-all placeholder:text-gray-300"
                        value={form.price} onChange={e => setForm({ ...form, price: e.target.value })} />
                    </div>
                  </div>
                  {/* Tenure/YTM or Quantity */}
                  {activeTab === 'BOND' ? (
                    <>
                      <div className="space-y-1.5 text-left">
                        <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider ml-1">Tenure (Months)</label>
                        <div className="relative group/tenure">
                          <Timer className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within/tenure:text-[#171717] transition-colors" size={16} />
                          <input type="text" placeholder="e.g. 12 Months"
                            className="w-full pl-11 pr-4 py-3 bg-gray-50 border-none rounded-xl text-sm font-medium focus:ring-2 focus:ring-gray-100 transition-all placeholder:text-gray-300"
                            value={form.tenure} onChange={e => setForm({ ...form, tenure: e.target.value })} />
                        </div>
                      </div>
                      <div className="space-y-1.5 text-left">
                        <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider ml-1">YTM (%)</label>
                        <div className="relative group/ytm">
                          <Percent className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within/ytm:text-[#171717] transition-colors" size={16} />
                          <input type="text" placeholder="e.g. 10.25"
                            className="w-full pl-11 pr-4 py-3 bg-gray-50 border-none rounded-xl text-sm font-medium focus:ring-2 focus:ring-gray-100 transition-all placeholder:text-gray-300"
                            value={form.ytm} onChange={e => setForm({ ...form, ytm: e.target.value })} />
                        </div>
                      </div>
                    </>
                  ) : (
                    <div className="space-y-1.5 text-left">
                      <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider ml-1">
                        Total Quantity
                      </label>
                      <div className="relative group/qty">
                        <Hash className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within/qty:text-[#171717] transition-colors" size={16} />
                        <input type="number" placeholder="0"
                          className="w-full pl-11 pr-4 py-3 bg-gray-50 border-none rounded-xl text-sm font-medium focus:ring-2 focus:ring-gray-100 transition-all placeholder:text-gray-300"
                          value={form.quantity} onChange={e => setForm({ ...form, quantity: e.target.value })} />
                      </div>
                    </div>
                  )}
                  {/* Submit */}
                  <div className="lg:col-span-4 mt-2 flex justify-end gap-3">
                    <button type="button" onClick={handleCancel}
                      className="px-6 py-2.5 rounded-xl text-sm font-bold text-gray-400 hover:bg-gray-50 transition-all">
                      Cancel
                    </button>
                    <button type="submit"
                      className="px-8 py-2.5 rounded-xl bg-[#171717] text-white text-sm font-bold hover:bg-gray-800 transition-all shadow-lg active:scale-95">
                      Add {activeTab === 'BOND' ? 'Bond' : 'Stock'}
                    </button>
                  </div>
                </form>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

        {/* ── Table ── */}
        <div className="overflow-x-auto">
          <table className="w-full font-sans">
            <thead>
              <tr className="border-b border-gray-100">
                <th className="text-left py-4 px-4 text-[11px] font-bold text-gray-400 uppercase tracking-widest leading-relaxed">
                  {activeTab === 'STOCK' ? 'Symbol' : 'Bond Name'}
                </th>
                {activeTab === 'BOND' && (
                  <th className="text-left py-4 px-4 text-[11px] font-bold text-gray-400 uppercase tracking-widest whitespace-nowrap">Tenure</th>
                )}
                <th className="text-left py-4 px-4 text-[11px] font-bold text-gray-400 uppercase tracking-widest whitespace-nowrap">Purchase Date</th>
                <th className="text-left py-4 px-4 text-[11px] font-bold text-gray-400 uppercase tracking-widest">
                  {activeTab === 'BOND' ? 'Investment' : 'Holdings'}
                </th>
                <th className="text-left py-4 px-4 text-[11px] font-bold text-gray-400 uppercase tracking-widest whitespace-nowrap">
                  {activeTab === 'BOND' ? 'YTM' : 'Avg. Price'}
                </th>
                {activeTab !== 'BOND' && (
                  <th className="text-left py-4 px-4 text-[11px] font-bold text-gray-400 uppercase tracking-widest whitespace-nowrap">Current Price</th>
                )}
                {activeTab === 'BOND' && (
                  <th className="text-left py-4 px-4 text-[11px] font-bold text-gray-400 uppercase tracking-widest whitespace-nowrap">Monthly Repayment</th>
                )}
                <th className="text-left py-4 px-4 text-[11px] font-bold text-gray-400 uppercase tracking-widest whitespace-nowrap">Total Value</th>
                <th className="text-right py-4 px-4 text-[11px] font-bold text-gray-400 uppercase tracking-widest">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={8} className="py-12 text-center text-gray-400 text-sm italic">Loading your assets...</td></tr>
              ) : visibleStocks.length === 0 ? (
                <tr><td colSpan={8} className="py-12 text-center text-gray-400 text-sm italic">
                  No {activeTab === 'STOCK' ? 'stocks' : 'bonds'} found. Add one above.
                </td></tr>
              ) : visibleStocks.map((stock) => {
                const totalValue = stock.quantity * (stock.current_price || stock.purchase_price)
                const invested = stock.quantity * stock.purchase_price
                const absolutePnl = totalValue - invested
                const pnl = (absolutePnl / invested) * 100

                return (
                  <tr key={stock.id} className="border-b border-gray-50 hover:bg-gray-50/50 transition-colors group">
                    {/* Symbol / Name */}
                    <td className="py-5 px-4">
                      <div className="flex flex-col">
                        <span className="font-bold text-blue-600 text-xs uppercase tracking-wider block">{stock.symbol}</span>
                        <span className="text-[11px] text-gray-400 font-medium">{stock.name || stock.symbol}</span>
                      </div>
                    </td>
                    {/* Tenure (Bonds only) */}
                    {activeTab === 'BOND' && (
                      <td className="py-5 px-4 text-sm text-gray-600 font-medium whitespace-nowrap">
                        {stock.tenure ? `${stock.tenure} Months` : '—'}
                      </td>
                    )}
                    {/* Purchase Date */}
                    <td className="py-5 px-4 text-sm text-gray-600 font-medium whitespace-nowrap">
                      {new Date(stock.purchase_date).toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' })}
                    </td>
                    {/* Holdings / Investment */}
                    <td className="py-5 px-4 font-bold text-[#171717] text-sm whitespace-nowrap">
                      {activeTab === 'BOND'
                        ? `₹${stock.purchase_price.toLocaleString('en-IN')}`
                        : <>{stock.quantity} <span className="text-gray-400 font-medium text-xs ml-1">Shares</span></>
                      }
                    </td>
                    {/* Avg Price / YTM */}
                    <td className="py-5 px-4 font-medium text-gray-700 text-sm whitespace-nowrap">
                      {activeTab === 'BOND'
                        ? `${stock.ytm || '—'}%`
                        : `₹${stock.purchase_price.toLocaleString('en-IN', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`
                      }
                    </td>
                    {/* Current Price (Non-Bonds only) */}
                    {activeTab !== 'BOND' && (
                      <td className="py-5 px-4 font-medium text-gray-700 text-sm whitespace-nowrap">
                        ₹{(stock.current_price || stock.purchase_price).toLocaleString('en-IN', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                      </td>
                    )}
                    {/* Monthly Repayment (Bonds only) */}
                    {activeTab === 'BOND' && (
                      <td className="py-5 px-4 font-bold text-[#171717] text-sm whitespace-nowrap">
                        ₹{calculateMonthlyRepayment(stock).toLocaleString('en-IN', { maximumFractionDigits: 0 })}
                      </td>
                    )}
                    {/* Total Value + P&L */}
                    <td className="py-5 px-4 whitespace-nowrap">
                      <div className="flex items-center gap-3">
                        <span className="font-bold text-[#171717] text-sm tracking-tight">
                          ₹{totalValue.toLocaleString('en-IN', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                        </span>
                        {activeTab !== 'BOND' && (
                          <div className="flex items-center gap-1.5 leading-none">
                            <span className={`text-[11px] font-bold ${absolutePnl >= 0 ? 'text-emerald-500' : 'text-rose-500'}`}>
                              {absolutePnl >= 0 ? '+' : '-'}₹{Math.abs(absolutePnl).toLocaleString('en-IN', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                            </span>
                            <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-[6px] flex items-center gap-0.5 ${absolutePnl >= 0 ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'}`}>
                              <span className="text-[8px]">{pnl >= 0 ? '▲' : '▼'}</span>
                              {Math.abs(pnl).toFixed(1)}%
                            </span>
                          </div>
                        )}
                      </div>
                    </td>
                    {/* Actions */}
                    <td className="py-5 px-4 text-right">
                      <button
                        type="button"
                        onClick={(e) => {
                          const rect = (e.currentTarget as HTMLElement).getBoundingClientRect()
                          const MENU_HEIGHT = 160
                          const spaceBelow = window.innerHeight - rect.bottom
                          const openAbove = spaceBelow < MENU_HEIGHT
                          setMenuPos({
                            top: openAbove ? rect.top - MENU_HEIGHT - 8 : rect.bottom + 8,
                            right: window.innerWidth - rect.right
                          })
                          setOpenMenuId(openMenuId === stock.id ? null : stock.id)
                        }}
                        className="p-2 text-gray-400 hover:text-black hover:bg-gray-100 rounded-lg transition-all"
                      >
                        <MoreVertical size={18} />
                      </button>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── Portal Action Menu ── renders to body to escape overflow clipping ── */}
      {openMenuId && createPortal(
        (() => {
          const activeStock = stocks.find(s => s.id === openMenuId)
          if (!activeStock) return null
          return (
            <div
              ref={menuRef}
              style={{ top: menuPos.top, right: menuPos.right }}
              className="fixed w-52 bg-white rounded-2xl border border-gray-100 shadow-[0_8px_30px_rgba(0,0,0,0.12)] z-[200] py-2 overflow-hidden"
            >
              <button type="button"
                onClick={() => { setHistoryModal({ isOpen: true, stock: activeStock }); setOpenMenuId(null) }}
                className="w-full px-4 py-2.5 flex items-center gap-3 text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors text-left">
                <History size={16} className="text-gray-400 shrink-0" />
                <span>Log History</span>
              </button>
              <button type="button"
                onClick={() => { handleEdit(activeStock); setOpenMenuId(null) }}
                className="w-full px-4 py-2.5 flex items-center gap-3 text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors text-left">
                <Pencil size={16} className="text-gray-400 shrink-0" />
                <span>Edit Asset</span>
              </button>
              <div className="h-px bg-gray-100 mx-3 my-1" />
              <button type="button"
                onClick={() => { setDeleteModal({ isOpen: true, id: activeStock.id }); setOpenMenuId(null) }}
                className="w-full px-4 py-2.5 flex items-center gap-3 text-sm font-medium text-red-500 hover:bg-red-50 transition-colors text-left">
                <Trash2 size={16} className="text-red-400 shrink-0" />
                <span>Delete Asset</span>
              </button>
            </div>
          )
        })()
        , document.body)}
    </div>
  )
}
