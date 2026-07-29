import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { supabase } from "../../lib/supabase"
import { getLocalMatches, searchStocks, fetchLivePrice } from "../../lib/stockApi"
import { calculateBondPayouts } from "../../lib/utils"
import {
  Pencil, Trash2, History, X, Search, Calendar,
  BadgeIndianRupee, Hash, ShieldCheck,
  TrendingUp, Timer, Percent, Plus
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
          onClick={onClose} className="absolute inset-0 bg-black/40 backdrop-blur-sm" />
        <motion.div initial={{ scale: 0.95, opacity: 0, y: 16 }} animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.95, opacity: 0, y: 16 }}
          className="relative bg-white p-6 sm:p-8 rounded-2xl border border-[#E5E7EB] shadow-[0_4px_24px_rgba(0,0,0,0.08)] max-w-sm w-full text-center z-10">
          <div className="w-12 h-12 bg-rose-50 rounded-xl flex items-center justify-center mx-auto mb-4 text-rose-600">
            <Trash2 size={24} />
          </div>
          <h3 className="text-lg font-semibold text-[#111827] mb-1.5">{title}</h3>
          <p className="text-xs text-[#6B7280] mb-6 leading-relaxed font-normal">{message}</p>
          <div className="flex flex-col sm:flex-row gap-2.5">
            <button onClick={onClose}
              className="flex-1 h-10 rounded-xl border border-[#E5E7EB] text-xs font-semibold text-[#6B7280] hover:bg-[#F4F5F7] transition-all cursor-pointer">
              Cancel
            </button>
            <button onClick={() => { onConfirm(); onClose() }}
              className="flex-1 h-10 rounded-xl bg-rose-600 text-white text-xs font-semibold hover:bg-rose-700 transition-all shadow-xs cursor-pointer">
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

const HistoryModal = ({ isOpen, onClose, stock, showValues = true }: { isOpen: boolean; onClose: () => void; stock: Stock | null; showValues?: boolean }) => {
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
            onClick={onClose} className="absolute inset-0 bg-black/40 backdrop-blur-sm" />
          <motion.div initial={{ scale: 0.95, opacity: 0, y: 16 }} animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.95, opacity: 0, y: 16 }}
            className="relative bg-white p-6 sm:p-8 rounded-2xl border border-[#E5E7EB] shadow-[0_4px_24px_rgba(0,0,0,0.08)] max-w-sm w-full z-10">
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-lg font-semibold text-[#111827]">Asset History</h3>
              <button onClick={onClose} className="p-1.5 hover:bg-[#F4F5F7] rounded-xl text-[#6B7280] transition-colors"><X size={18} /></button>
            </div>
            <div className="max-h-[40vh] overflow-y-auto mb-6 pr-2">
              <div className="space-y-5 relative before:absolute before:left-3 before:top-2 before:bottom-2 before:w-[1.5px] before:bg-[#E5E7EB]">
                {loading ? (
                  <div className="pl-10 py-4 text-xs text-[#6B7280]">Fetching transaction history...</div>
                ) : logs.length === 0 ? (
                  <div className="relative pl-10">
                    <div className="absolute left-1.5 top-1.5 w-3 h-3 rounded-full bg-[#6B7280] ring-4 ring-white" />
                    <p className="text-xs font-semibold text-[#6B7280] uppercase tracking-wider mb-0.5">Initial Position</p>
                    <p className={`text-sm font-semibold text-[#111827]`}>{showValues ? `${stock?.quantity} units of ${stock?.symbol}` : '**** units'}</p>
                    <p className={`text-[11px] text-[#6B7280] mt-0.5`}>{showValues ? `At ₹${stock?.purchase_price.toLocaleString('en-IN')} per unit` : 'At ₹**** per unit'}</p>
                  </div>
                ) : logs.map((log) => (
                  <div key={log.id} className="relative pl-10">
                    <div className={`absolute left-1.5 top-1.5 w-3 h-3 rounded-full ring-4 ring-white ${log.type === 'BUY' ? 'bg-[#111827]' : log.type === 'AVERAGE' ? 'bg-blue-500' :
                      log.type === 'UPDATE' ? 'bg-amber-500' : 'bg-rose-500'}`} />
                    <p className="text-[11px] font-semibold text-[#6B7280] uppercase tracking-wider mb-0.5">
                      {log.type === 'BUY' ? 'Initial Position' : log.type === 'AVERAGE' ? 'Units Added (Averaged)' :
                        log.type === 'UPDATE' ? 'Position Updated' : 'Asset Removed'} —{' '}
                      {new Date(log.transaction_date).toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' })}
                    </p>
                    <p className={`text-sm font-semibold text-[#111827]`}>
                      {showValues ? `${log.quantity} units @ ₹${Number(log.price).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : '**** units @ ₹****'}
                    </p>
                    <p className="text-[10px] text-[#6B7280] mt-0.5">Transaction logged</p>
                  </div>
                ))}
              </div>
            </div>
            <button onClick={onClose} className="w-full h-10 rounded-xl bg-[#F4F5F7] border border-[#E5E7EB] text-xs font-semibold text-[#111827] hover:bg-[#E5E7EB] transition-all cursor-pointer">
              Close History
            </button>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  )
}

// ── Main Component ─────────────────────────────────────────────────────────────
export const AssetManagement = ({ onUpdate, showValues = true }: { onUpdate?: () => void; showValues?: boolean }) => {
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
  const [activeTab, setActiveTab] = useState<'STOCK' | 'BOND'>('STOCK')
  const [suggestions, setSuggestions] = useState<any[]>([])
  const [showSuggestions, setShowSuggestions] = useState(false)



  // ── Close suggestions on outside click ────────────────────────────────────
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (!(e.target as HTMLElement).closest('.stock-search-group')) setShowSuggestions(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

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

      // Fetch live prices for non-bonds via direct Yahoo Finance API
      const withPrice = await Promise.all(rawStocks.map(async (s: Stock) => {
        const type = s.asset_type || (s.ytm || s.tenure ? 'BOND' : 'STOCK')
        let current = s.purchase_price

        if (type !== 'BOND') {
          try {
            const result = await fetchLivePrice(s.symbol)
            if (result.price) current = result.price
          } catch { /* keep purchase price as fallback */ }
        }

        return { ...s, asset_type: type as any, current_price: current }
      }))

      setStocks(withPrice)
    } catch (err) { console.error('Error fetching stocks:', err) }
    finally { setLoading(false) }
  }





  // calculateBondPayouts imported from utils.ts

  useEffect(() => { fetchStocks() }, [])

  // NSE_STOCKS list is now in stockApi.ts — used via getLocalMatches()



  useEffect(() => {
    if (!showSuggestions || activeTab !== 'STOCK') {
      setSuggestions([]); return
    }
    // Show instant local matches (including default popular stocks if empty)
    const localMatches = getLocalMatches(form.symbol || '')
    setSuggestions(localMatches)

    if (form.symbol && form.symbol.length >= 1) {
      const timer = setTimeout(async () => {
        try {
          const results = await searchStocks(form.symbol)
          if (results.length > 0) setSuggestions(results)
        } catch { /* keep local results */ }
      }, 250)
      return () => clearTimeout(timer)
    }
  }, [form.symbol, showSuggestions, activeTab])

  const handleSelectSuggestion = async (quote: any) => {
    const livePriceStr = quote.price ? quote.price.toString() : ""
    setForm(prev => ({
      ...prev,
      symbol: quote.symbol,
      name: quote.shortname,
      price: livePriceStr || prev.price
    }))
    setShowSuggestions(false)

    if (!livePriceStr) {
      try {
        const result = await fetchLivePrice(quote.symbol)
        if (result.price) {
          setForm(prev => ({
            ...prev,
            symbol: quote.symbol,
            name: quote.shortname,
            price: result.price!.toString()
          }))
        }
      } catch { /* silent fallback */ }
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
      onUpdate?.()
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
          await supabase.from('stock_logs')
            .delete()
            .eq('user_id', user.id)
            .eq('symbol', stockToDelete.symbol)
        } catch { /* skip */ }
      }
      fetchStocks()
      onUpdate?.()
    } catch (err) { console.error('Error deleting stock:', err) }
  }

  // Filter visible assets by active tab
  const visibleStocks = stocks.filter(s => {
    const type = s.asset_type || (s.ytm || s.tenure ? 'BOND' : 'STOCK')
    return type === activeTab
  })

  return (
    <div className="bg-[#F5F5F7] border border-[#E5E7EB] p-4 sm:p-5 rounded-2xl flex flex-col space-y-3 text-left">
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
        showValues={showValues}
      />

      {/* Outer Card Header matching Reference Image */}
      <div className="flex items-center justify-between px-1">
        <h3 className="font-sans text-sm font-semibold text-[#111827]">
          Asset Management & Holdings
        </h3>
      </div>

      {/* Inner Crisp White Card Container */}
      <div className="bg-white p-6 sm:p-8 rounded-xl border border-neutral-100 shadow-[0_2px_8px_rgba(0,0,0,0.03)] flex flex-col">
        {/* ── Sleek Pill Tab Switcher ── */}
        <div className="flex items-center gap-1 p-1 bg-[#E5E7EB] rounded-full w-fit mb-8 shadow-inner relative">
          {([
            { id: 'STOCK', label: 'Stocks', icon: TrendingUp },
            { id: 'BOND', label: 'Bonds', icon: ShieldCheck }
          ] as const).map((tab) => (
            <button key={tab.id} onClick={() => { setActiveTab(tab.id); if (isAdding && !editingId) handleCancel() }}
              className={`relative flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-semibold transition-colors cursor-pointer z-10 ${activeTab === tab.id
                ? 'text-white'
                : 'text-[#6B7280] hover:text-[#111827]'
                }`}>
              {activeTab === tab.id && (
                <motion.div
                  layoutId="activeAssetTab"
                  className="absolute inset-0 bg-[#111827] rounded-full shadow-xs -z-10"
                  transition={{ type: "spring", stiffness: 500, damping: 35 }}
                />
              )}
              <tab.icon size={14} />
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
              <div className="bg-[#F4F5F7] border border-[#E5E7EB] rounded-lg p-5">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <div className="w-1.5 h-5 bg-[#111827] rounded-full" />
                    <span className="text-sm font-bold text-[#111827]">
                      Editing: <span className="text-[#111827]">{form.symbol}</span>
                    </span>
                  </div>
                  <button type="button" onClick={handleCancel}
                    className="p-1.5 hover:bg-[#E5E7EB] rounded-md text-[#6B7280] transition-colors">
                    <X size={16} />
                  </button>
                </div>
                <form onSubmit={handleAddOrUpdate} className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {/* Symbol — read-only when editing */}
                  {/* Symbol / Search with Live Suggestions */}
                  <div className="space-y-1 text-left stock-search-group relative">
                    <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                      {activeTab === 'STOCK' ? 'Symbol' : 'Bond Name'}
                    </label>
                    <div className="relative group/search">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={14} />
                      <input type="text" placeholder={activeTab === 'STOCK' ? "e.g. RELIANCE" : "e.g. HDFC Bond"}
                        autoComplete="off"
                        className="w-full pl-9 pr-3 py-2.5 bg-white border border-gray-200 rounded-md text-sm font-bold focus:outline-none focus:border-[#111827] transition-all"
                        value={form.symbol}
                        onFocus={() => { if (activeTab === 'STOCK') setShowSuggestions(true); }}
                        onClick={() => { if (activeTab === 'STOCK') setShowSuggestions(true); }}
                        onChange={e => {
                          setForm({ ...form, symbol: e.target.value.toUpperCase() })
                          if (activeTab === 'STOCK') setShowSuggestions(true)
                          else setShowSuggestions(false)
                        }}
                      />
                      {showSuggestions && suggestions.length > 0 && activeTab === 'STOCK' && (
                        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                          className="absolute top-[calc(100%+6px)] left-0 right-0 bg-white border border-[#E5E7EB] rounded-xl shadow-[0_8px_24px_rgba(0,0,0,0.12)] z-[120] overflow-hidden py-1.5 min-w-[280px]">
                          <div className="px-3.5 py-1.5 border-b border-[#E5E7EB] bg-[#F4F5F7] flex items-center justify-between">
                            <span className="text-[10px] font-bold text-[#6B7280] uppercase tracking-wider">Live Suggestions</span>
                            <span className="text-[9px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-100">Live Prices</span>
                          </div>
                          <div className="max-h-[220px] overflow-y-auto">
                            {suggestions.map((quote: any) => (
                              <div key={quote.symbol}
                                className="px-4 py-2.5 hover:bg-[#F4F5F7] cursor-pointer flex justify-between items-center transition-colors group"
                                onClick={() => handleSelectSuggestion(quote)}>
                                <div className="flex flex-col">
                                  <div className="flex items-center gap-1.5">
                                    <span className="font-bold text-xs text-[#111827] group-hover:text-emerald-600 transition-colors">{quote.symbol}</span>
                                    <span className="text-[9px] font-semibold bg-[#E5E7EB] text-[#374151] px-1.5 py-0.2 rounded uppercase">{quote.exchange}</span>
                                  </div>
                                  <span className="text-[11px] font-medium text-[#6B7280] truncate max-w-[180px]">{quote.shortname || quote.symbol}</span>
                                </div>
                                <div className="flex flex-col items-end">
                                  {quote.price ? (
                                    <div className="flex flex-col items-end">
                                      <span className="font-bold text-xs text-emerald-600">₹{Number(quote.price).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                                      <span className="text-[8px] font-semibold text-emerald-600 bg-emerald-50 px-1 py-0.2 rounded">Live</span>
                                    </div>
                                  ) : (
                                    <span className="text-[10px] font-semibold text-emerald-600 group-hover:underline">Auto Fill →</span>
                                  )}
                                </div>
                              </div>
                            ))}
                          </div>
                        </motion.div>
                      )}
                    </div>
                  </div>
                  {/* Date */}
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Date</label>
                    <div className="relative">
                      <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={14} />
                      <input type="date"
                        className="w-full pl-9 pr-3 py-2.5 bg-white border border-gray-200 rounded-md text-sm focus:outline-none focus:border-[#111827] transition-all"
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
                        className="w-full pl-9 pr-3 py-2.5 bg-white border border-gray-200 rounded-md text-sm focus:outline-none focus:border-[#111827] transition-all"
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
                            className="w-full pl-9 pr-3 py-2.5 bg-white border border-gray-200 rounded-md text-sm focus:outline-none focus:border-[#111827] transition-all"
                            value={form.tenure} onChange={e => setForm({ ...form, tenure: e.target.value })} />
                        </div>
                      </div>
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">YTM (%)</label>
                        <div className="relative">
                          <Percent className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={14} />
                          <input type="text" placeholder="e.g. 10.25"
                            className="w-full pl-9 pr-3 py-2.5 bg-white border border-gray-200 rounded-md text-sm focus:outline-none focus:border-[#111827] transition-all"
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
                          className="w-full pl-9 pr-3 py-2.5 bg-white border border-gray-200 rounded-md text-sm focus:outline-none focus:border-[#111827] transition-all"
                          value={form.quantity} onChange={e => setForm({ ...form, quantity: e.target.value })} />
                      </div>
                    </div>
                  )}
                  {/* Actions */}
                  <div className="col-span-2 md:col-span-4 flex justify-end gap-2 pt-1">
                    <button type="button" onClick={handleCancel}
                      className="px-5 py-2 rounded-md text-sm font-bold text-gray-400 hover:bg-white transition-all">
                      Cancel
                    </button>
                    <button type="submit"
                      className="px-6 py-2 rounded-md bg-[#171717] hover:bg-black text-white text-sm font-bold transition-all shadow-sm active:scale-95">
                      Save Changes
                    </button>
                  </div>
                </form>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ── ADD NEW FORM (inline) ── */}
        <AnimatePresence>
          {!editingId && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="mb-8 overflow-visible"
            >
              <div className="bg-[#F4F5F7] p-6 sm:p-7 rounded-xl border border-[#E5E7EB] w-full overflow-visible">
                <div className="flex items-center justify-between mb-5">
                  <h3 className="text-base font-semibold text-[#111827]">
                    Add New {activeTab === 'STOCK' ? 'Stock' : 'Bond'}
                  </h3>
                </div>
                <form onSubmit={handleAddOrUpdate} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
                  {/* Symbol */}
                  <div className="space-y-1.5 text-left stock-search-group">
                    <label className="text-[10px] font-semibold text-[#6B7280] uppercase tracking-wider ml-1">
                      {activeTab === 'STOCK' ? 'Symbol' : 'Bond Name'}
                    </label>
                    <div className="relative group/search">
                      <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#6B7280] group-focus-within/search:text-[#111827] transition-colors" size={15} />
                      <input type="text" placeholder={activeTab === 'STOCK' ? "e.g. RELIANCE" : "e.g. HDFC Bond"}
                        autoComplete="off"
                        className="w-full pl-10 pr-4 h-11 bg-white border border-[#E5E7EB] rounded-xl text-sm font-medium focus:ring-2 focus:ring-[#E5E7EB] focus:border-[#D1D5DB] transition-all text-[#111827] placeholder:text-[#9CA3AF] outline-none"
                        value={form.symbol}
                        onFocus={() => { if (activeTab === 'STOCK') setShowSuggestions(true); }}
                        onClick={() => { if (activeTab === 'STOCK') setShowSuggestions(true); }}
                        onChange={e => {
                          setForm({ ...form, symbol: e.target.value.toUpperCase() })
                          if (activeTab === 'STOCK') setShowSuggestions(true)
                          else setShowSuggestions(false)
                        }}
                      />
                      {showSuggestions && suggestions.length > 0 && activeTab === 'STOCK' && (
                        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                          className="absolute top-[calc(100%+6px)] left-0 right-0 bg-white border border-[#E5E7EB] rounded-xl shadow-[0_8px_24px_rgba(0,0,0,0.08)] z-[120] overflow-hidden py-1.5 min-w-[280px]">
                          <div className="px-3.5 py-1.5 border-b border-[#E5E7EB] bg-[#F4F5F7] flex items-center justify-between">
                            <span className="text-[10px] font-bold text-[#6B7280] uppercase tracking-wider">Live Suggestions</span>
                            <span className="text-[9px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-100">Google Finance / Tickertape</span>
                          </div>
                          <div className="max-h-[240px] overflow-y-auto">
                            {suggestions.map((quote: any) => (
                              <div key={quote.symbol}
                                className="px-4 py-2.5 hover:bg-[#F4F5F7] cursor-pointer flex justify-between items-center transition-colors group"
                                onClick={() => handleSelectSuggestion(quote)}>
                                <div className="flex flex-col">
                                  <div className="flex items-center gap-1.5">
                                    <span className="font-bold text-xs text-[#111827] group-hover:text-emerald-600 transition-colors">{quote.symbol}</span>
                                    <span className="text-[9px] font-semibold bg-[#E5E7EB] text-[#374151] px-1.5 py-0.2 rounded uppercase">{quote.exchange}</span>
                                  </div>
                                  <span className="text-[11px] font-medium text-[#6B7280] truncate max-w-[180px]">{quote.shortname || quote.longname}</span>
                                </div>
                                <div className="flex flex-col items-end">
                                  {quote.price ? (
                                    <div className="flex flex-col items-end">
                                      <span className="font-bold text-xs text-emerald-600">₹{Number(quote.price).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                                      <span className="text-[8px] font-semibold text-emerald-600 bg-emerald-50 px-1 py-0.2 rounded">Live</span>
                                    </div>
                                  ) : (
                                    <span className="text-[10px] font-semibold text-emerald-600 group-hover:underline">Auto Fill →</span>
                                  )}
                                </div>
                              </div>
                            ))}
                          </div>
                        </motion.div>
                      )}
                    </div>
                  </div>
                  {/* Date */}
                  <div className="space-y-1.5 text-left">
                    <label className="text-[10px] font-semibold text-[#6B7280] uppercase tracking-wider ml-1">Investment Date</label>
                    <div className="relative group/date">
                      <Calendar className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#6B7280] group-focus-within/date:text-[#111827] transition-colors" size={15} />
                      <input type="date"
                        className="w-full pl-10 pr-4 h-11 bg-white border border-[#E5E7EB] rounded-xl text-sm font-medium focus:ring-2 focus:ring-[#E5E5EB] focus:border-[#D1D5DB] transition-all cursor-pointer text-[#111827] outline-none"
                        value={form.purchase_date} onChange={e => setForm({ ...form, purchase_date: e.target.value })} />
                    </div>
                  </div>
                  {/* Price */}
                  <div className="space-y-1.5 text-left">
                    <label className="text-[10px] font-semibold text-[#6B7280] uppercase tracking-wider ml-1">
                      {activeTab === 'BOND' ? 'Total Investment (₹)' : 'Price (₹)'}
                    </label>
                    <div className="relative group/price">
                      <BadgeIndianRupee className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#6B7280] group-focus-within/price:text-[#111827] transition-colors" size={15} />
                      <input type="text" placeholder="0.00"
                        className="w-full pl-10 pr-4 h-11 bg-white border border-[#E5E7EB] rounded-xl text-sm font-medium focus:ring-2 focus:ring-[#E5E7EB] focus:border-[#D1D5DB] transition-all text-[#111827] placeholder:text-[#9CA3AF] outline-none"
                        value={form.price ? Number(form.price.replace(/,/g, '')).toLocaleString('en-IN') : ""}
                        onChange={e => {
                          const val = e.target.value.replace(/,/g, '');
                          if (!isNaN(Number(val)) || val === "") setForm({ ...form, price: val });
                        }}
                      />
                    </div>
                  </div>
                  {/* Tenure/YTM or Quantity */}
                  {activeTab === 'BOND' ? (
                    <>
                      <div className="space-y-1.5 text-left">
                        <label className="text-[10px] font-semibold text-[#6B7280] uppercase tracking-wider ml-1">Tenure (Months)</label>
                        <div className="relative group/tenure">
                          <Timer className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#6B7280] group-focus-within/tenure:text-[#111827] transition-colors" size={15} />
                          <input type="text" placeholder="e.g. 12 Months"
                            className="w-full pl-10 pr-4 h-11 bg-white border border-[#E5E7EB] rounded-xl text-sm font-medium focus:ring-2 focus:ring-[#E5E7EB] focus:border-[#D1D5DB] transition-all text-[#111827] placeholder:text-[#9CA3AF] outline-none"
                            value={form.tenure} onChange={e => setForm({ ...form, tenure: e.target.value })} />
                        </div>
                      </div>
                      <div className="space-y-1.5 text-left">
                        <label className="text-[10px] font-semibold text-[#6B7280] uppercase tracking-wider ml-1">YTM (%)</label>
                        <div className="relative group/ytm">
                          <Percent className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#6B7280] group-focus-within/ytm:text-[#111827] transition-colors" size={15} />
                          <input type="text" placeholder="e.g. 10.25"
                            className="w-full pl-10 pr-4 h-11 bg-white border border-[#E5E7EB] rounded-xl text-sm font-medium focus:ring-2 focus:ring-[#E5E7EB] focus:border-[#D1D5DB] transition-all text-[#111827] placeholder:text-[#9CA3AF] outline-none"
                            value={form.ytm} onChange={e => setForm({ ...form, ytm: e.target.value })} />
                        </div>
                      </div>
                      <div className="space-y-1.5 text-left lg:col-span-2">
                        <label className="text-[10px] font-semibold text-[#6B7280] uppercase tracking-wider ml-1">Est. Monthly Repayment</label>
                        <div className={`w-full px-4 h-11 bg-white border border-[#E5E7EB] rounded-xl text-xs font-semibold text-emerald-600 flex items-center justify-between transition-all`}>
                          <span>Calculated Repayment</span>
                          <span>{showValues ? `₹${(form.price && form.ytm && !isNaN(parseFloat(form.price)) && !isNaN(parseFloat(form.ytm))
                            ? ((parseFloat(form.price) * (parseFloat(form.ytm) / 100)) / 12).toLocaleString('en-IN', { maximumFractionDigits: 0 })
                            : '0')}` : '₹****'}</span>
                        </div>
                      </div>
                    </>
                  ) : (
                    <div className="space-y-1.5 text-left">
                      <label className="text-[10px] font-semibold text-[#6B7280] uppercase tracking-wider ml-1">
                        Total Quantity
                      </label>
                      <div className="relative group/qty">
                        <Hash className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#6B7280] group-focus-within/qty:text-[#111827] transition-colors" size={15} />
                        <input type="text" placeholder="0"
                          className="w-full pl-10 pr-4 h-11 bg-white border border-[#E5E7EB] rounded-xl text-sm font-medium focus:ring-2 focus:ring-[#E5E7EB] focus:border-[#D1D5DB] transition-all text-[#111827] placeholder:text-[#9CA3AF] outline-none"
                          value={form.quantity ? Number(form.quantity.replace(/,/g, '')).toLocaleString('en-IN') : ""}
                          onChange={e => {
                            const val = e.target.value.replace(/,/g, '');
                            if (!isNaN(Number(val)) || val === "") setForm({ ...form, quantity: val });
                          }}
                        />
                      </div>
                    </div>
                  )}
                  {/* Submit */}
                  <div className="col-span-full flex items-center justify-start pt-3 border-t border-[#E5E7EB] mt-1">
                    <button type="submit"
                      className="w-full sm:w-auto min-w-[200px] flex items-center justify-center gap-2.5 px-6 h-11 rounded-xl bg-[#111827] hover:bg-[#1F2937] text-white text-xs font-semibold transition-all shadow-xs cursor-pointer active:scale-95 group">
                      <Plus size={16} strokeWidth={2.5} className="group-hover:rotate-90 transition-transform duration-300" />
                      <span>Add {activeTab === 'STOCK' ? 'Stock' : 'Bond'}</span>
                    </button>
                  </div>
                </form>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ── Table (Desktop) / Cards (Mobile) ── */}
        <div className="mt-4">
          {/* Desktop Table View */}
          <div className="hidden md:block overflow-x-auto bg-white border border-[#E5E7EB] rounded-xl shadow-[0_1px_2px_rgba(0,0,0,0.02)]">
            <table className="w-full font-sans">
              <thead>
                <tr className="border-b border-[#E5E7EB] bg-white">
                  <th className="text-left py-3.5 px-4 text-[11px] font-semibold text-[#6B7280] uppercase tracking-wider whitespace-nowrap">
                    {activeTab === 'STOCK' ? 'Symbol' : 'Bond Name'}
                  </th>
                  {activeTab === 'BOND' && (
                    <th className="text-left py-3.5 px-4 text-[11px] font-semibold text-[#6B7280] uppercase tracking-wider whitespace-nowrap">Tenure</th>
                  )}
                  <th className="text-left py-3.5 px-4 text-[11px] font-semibold text-[#6B7280] uppercase tracking-wider whitespace-nowrap">Purchase Date</th>
                  <th className="text-left py-3.5 px-4 text-[11px] font-semibold text-[#6B7280] uppercase tracking-wider whitespace-nowrap">
                    {activeTab === 'BOND' ? 'Investment' : 'Holdings'}
                  </th>
                  <th className="text-left py-3.5 px-4 text-[11px] font-semibold text-[#6B7280] uppercase tracking-wider whitespace-nowrap">
                    {activeTab === 'BOND' ? 'YTM' : 'Avg. Price'}
                  </th>
                  {activeTab !== 'BOND' && (
                    <th className="text-left py-3.5 px-4 text-[11px] font-semibold text-[#6B7280] uppercase tracking-wider whitespace-nowrap">Current Price</th>
                  )}
                  {activeTab === 'BOND' && (
                    <th className="text-left py-3.5 px-4 text-[11px] font-semibold text-[#6B7280] uppercase tracking-wider whitespace-nowrap">Monthly Payout</th>
                  )}
                  <th className="text-left py-3.5 px-4 text-[11px] font-semibold text-[#6B7280] uppercase tracking-wider whitespace-nowrap">Total Value</th>
                  <th className="text-right py-3.5 px-4 text-[11px] font-semibold text-[#6B7280] uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E5E7EB]">
                {loading ? (
                  <tr><td colSpan={10} className="py-12 text-center text-[#6B7280] text-xs">Loading your assets...</td></tr>
                ) : visibleStocks.length === 0 ? (
                  <tr><td colSpan={10} className="py-12 text-center text-[#6B7280] text-xs">
                    No {activeTab === 'STOCK' ? 'stocks' : 'bonds'} found. Add one above.
                  </td></tr>
                ) : visibleStocks.map((stock) => {
                  const bondPayout = calculateBondPayouts(stock)
                  const totalValue = (stock.quantity * (stock.current_price || stock.purchase_price)) + bondPayout.tillDate
                  const invested = stock.quantity * stock.purchase_price
                  const absolutePnl = totalValue - invested
                  const pnl = invested > 0 ? (absolutePnl / invested) * 100 : 0

                  return (
                    <tr key={stock.id} className="hover:bg-[#F4F5F7]/60 transition-colors group">
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <div className="flex flex-col">
                          <span className="font-semibold text-[#111827] text-xs uppercase tracking-wider">{stock.symbol}</span>
                          <span className="text-[11px] text-[#6B7280] font-normal">{stock.name || stock.symbol}</span>
                        </div>
                      </td>
                      {activeTab === 'BOND' && (
                        <td className="py-3.5 px-4 text-xs text-[#111827] font-medium whitespace-nowrap">
                          {stock.tenure ? `${stock.tenure} Mon` : '—'}
                        </td>
                      )}
                      <td className="py-3.5 px-4 text-xs text-[#6B7280] font-normal whitespace-nowrap">
                        {new Date(stock.purchase_date).toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' })}
                      </td>
                      <td className="py-3.5 px-4 font-semibold text-[#111827] text-xs whitespace-nowrap">
                        <div>
                          {showValues ? (
                            activeTab === 'BOND'
                              ? `₹${stock.purchase_price.toLocaleString('en-IN')}`
                              : <>{stock.quantity} <span className="text-[#6B7280] font-normal text-[11px] ml-1">Qty</span></>
                          ) : '****'}
                        </div>
                      </td>
                      <td className="py-3.5 px-4 font-normal text-[#111827] text-xs whitespace-nowrap">
                        <div>
                          {showValues ? (
                            activeTab === 'BOND'
                              ? `${stock.ytm || '—'}%`
                              : `₹${stock.purchase_price.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
                          ) : '****'}
                        </div>
                      </td>
                      {activeTab !== 'BOND' && (
                        <td className="py-3.5 px-4 font-semibold text-[#111827] text-xs whitespace-nowrap">
                          <div className="flex items-center gap-1.5">
                            <span>{showValues ? `₹${(stock.current_price || stock.purchase_price).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : '₹****'}</span>
                            <span className="text-[9px] font-bold text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded-full border border-emerald-100/80 flex items-center gap-1">
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                              Live
                            </span>
                          </div>
                        </td>
                      )}
                      {activeTab === 'BOND' && (
                        <td className="py-3.5 px-4 font-semibold text-emerald-600 text-xs whitespace-nowrap">
                          <div className="flex flex-col">
                            <span>{showValues ? `+₹${(bondPayout?.monthly || 0).toLocaleString('en-IN', { maximumFractionDigits: 0 })} / mo` : '+₹****'}</span>
                            <span className="text-[10px] text-[#6B7280] font-normal">
                              {showValues ? `+₹${((bondPayout?.tillDate ?? bondPayout?.total) || 0).toLocaleString('en-IN', { maximumFractionDigits: 0 })} total` : '****'}
                            </span>
                          </div>
                        </td>
                      )}
                      <td className="py-3.5 px-4">
                        <div className="flex flex-col">
                          <span className="font-semibold text-[#111827] text-xs">
                            {showValues ? `₹${totalValue.toLocaleString('en-IN', { maximumFractionDigits: 0 })}` : '₹****'}
                          </span>
                          <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full w-fit mt-0.5 ${pnl >= 0 ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' : 'bg-rose-50 text-rose-600 border border-rose-100'}`}>
                            {showValues ? (
                              <>{pnl >= 0 ? '+' : ''}{pnl.toFixed(1)}%</>
                            ) : '***%'}
                          </span>
                        </div>
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <button onClick={() => setHistoryModal({ isOpen: true, stock })}
                            className="p-1.5 text-[#6B7280] hover:text-[#111827] hover:bg-[#F4F5F7] rounded-xl transition-all cursor-pointer">
                            <History size={15} />
                          </button>
                          <button onClick={() => handleEdit(stock)}
                            className="p-1.5 text-[#6B7280] hover:text-[#111827] hover:bg-[#F4F5F7] rounded-xl transition-all cursor-pointer">
                            <Pencil size={15} />
                          </button>
                          <button onClick={() => setDeleteModal({ isOpen: true, id: stock.id })}
                            className="p-1.5 text-[#6B7280] hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-all cursor-pointer">
                            <Trash2 size={15} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>

          {/* Mobile Card View */}
          <div className="md:hidden space-y-3">
            {loading ? (
              <div className="py-12 text-center text-[#6B7280] text-xs">Loading your assets...</div>
            ) : visibleStocks.length === 0 ? (
              <div className="py-12 text-center text-[#6B7280] text-xs">
                No {activeTab === 'STOCK' ? 'stocks' : 'bonds'} found. Add one above.
              </div>
            ) : visibleStocks.map((stock) => {
              const bondPayout = calculateBondPayouts(stock)
              const totalValue = (stock.quantity * (stock.current_price || stock.purchase_price)) + bondPayout.tillDate
              const invested = stock.quantity * stock.purchase_price
              const absolutePnl = totalValue - invested
              const pnl = invested > 0 ? (absolutePnl / invested) * 100 : 0

              return (
                <div key={stock.id} className="bg-white border border-[#E5E7EB] rounded-2xl p-4 shadow-[0_1px_3px_rgba(0,0,0,0.03)]">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex flex-col">
                      <span className="font-semibold text-xs text-[#111827] uppercase tracking-wider">{stock.symbol}</span>
                      <h4 className="font-medium text-xs text-[#6B7280] mt-0.5">{stock.name || stock.symbol}</h4>
                    </div>
                    <div className="flex flex-col items-end">
                      <span className="font-semibold text-base text-[#111827]">₹{totalValue.toLocaleString('en-IN', { maximumFractionDigits: 0 })}</span>
                      <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full mt-1 ${pnl >= 0 ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' : 'bg-rose-50 text-rose-600 border border-rose-100'}`}>
                        {pnl >= 0 ? '+' : ''}{pnl.toFixed(1)}%
                      </span>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-y-2 border-t border-[#E5E7EB] pt-3 mb-3 text-xs">
                    {activeTab === 'STOCK' ? (
                      <>
                        <div className="flex flex-col">
                          <span className="text-[10px] text-[#6B7280] font-semibold uppercase tracking-wider">Holdings</span>
                          <span className="font-semibold text-[#111827]">{stock.quantity} Qty</span>
                        </div>
                        <div className="flex flex-col">
                          <span className="text-[10px] text-[#6B7280] font-semibold uppercase tracking-wider">Avg Price</span>
                          <span className="font-semibold text-[#111827]">₹{stock.purchase_price.toLocaleString('en-IN', { maximumFractionDigits: 0 })}</span>
                        </div>
                      </>
                    ) : (
                      <>
                        <div className="flex flex-col">
                          <span className="text-[10px] text-[#6B7280] font-semibold uppercase tracking-wider">Tenure</span>
                          <span className="font-semibold text-[#111827]">{stock.tenure} Mon</span>
                        </div>
                        <div className="flex flex-col">
                          <span className="text-[10px] text-[#6B7280] font-semibold uppercase tracking-wider">Monthly Payout</span>
                          <span className="font-semibold text-emerald-600">+₹{bondPayout.monthly.toLocaleString('en-IN', { maximumFractionDigits: 0 })} / mo</span>
                        </div>
                      </>
                    )}
                    <div className="flex flex-col">
                      <span className="text-[10px] text-[#6B7280] font-semibold uppercase tracking-wider">Purchase Date</span>
                      <span className="font-semibold text-[#111827]">{new Date(stock.purchase_date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' })}</span>
                    </div>
                    <div className="flex flex-col">
                      <span className="text-[10px] text-[#6B7280] font-semibold uppercase tracking-wider">Invested</span>
                      <span className="font-semibold text-[#111827]">₹{invested.toLocaleString('en-IN', { maximumFractionDigits: 0 })}</span>
                    </div>
                  </div>

                  <div className="flex items-center justify-end gap-1.5 pt-2.5 border-t border-[#E5E7EB]">
                    <button onClick={() => setHistoryModal({ isOpen: true, stock })}
                      className="p-2 bg-[#F4F5F7] text-[#111827] rounded-xl border border-[#E5E7EB]">
                      <History size={15} />
                    </button>
                    <button onClick={() => handleEdit(stock)}
                      className="p-2 bg-[#F4F5F7] text-[#111827] rounded-xl border border-[#E5E7EB]">
                      <Pencil size={15} />
                    </button>
                    <button onClick={() => setDeleteModal({ isOpen: true, id: stock.id })}
                      className="p-2 bg-rose-50 text-rose-600 rounded-xl border border-rose-100">
                      <Trash2 size={15} />
                    </button>
                  </div>
                </div>
              )
            })}
          </div>


        </div>
      </div>
    </div>
  )
}

