import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import { supabase } from "../../lib/supabase"
import { 
  SignOut, 
  FileText, 
  CaretDown, 
  CaretLeft, 
  CaretRight, 
  Plus, 
  X, 
  Hamburger, 
  Car, 
  FilmStrip, 
  TShirt, 
  Laptop, 
  CreditCard, 
  Warning, 
  ChartLineUp, 
  Coins, 
  Wallet, 
  Bank,
  DeviceMobile,
  PencilLine,
  Check,
  Sparkle,
  CalendarBlank
} from "@phosphor-icons/react"

const NumberTicker = ({ value }: { value: number }) => {
  return (
    <span>{value.toLocaleString('en-IN', { maximumFractionDigits: 0 })}</span>
  )
}

const StatCard = ({ title, numericValue, illustration, badgeText, badgeColor = "emerald", delay = 0 }: any) => {
  const isNegative = numericValue < 0
  const colorMap: any = {
    emerald: "text-[#171717] bg-gray-100",
    amber: "text-gray-500 bg-gray-50",
    indigo: "text-[#171717] bg-gray-100",
    rose: "text-gray-500 bg-gray-50"
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: delay, ease: [0.21, 0.47, 0.32, 0.98] }}
      className="bg-white p-5 sm:p-6 rounded-2xl border border-gray-200/80 flex flex-row items-center justify-between gap-4 group transition-all duration-300"
    >
      <div className="flex flex-col space-y-1.5 flex-1 min-w-0">
        <h3 className="font-serif text-[16px] text-gray-500 leading-tight truncate">
          {title}
        </h3>
        <div className="flex flex-row items-baseline gap-2 mt-1">
          <div className="flex items-baseline font-display font-bold text-[26px] sm:text-[30px] tracking-tight text-[#171717]">
            <span className="text-[18px] sm:text-[22px] mr-1 font-bold">{isNegative ? '-₹' : '₹'}</span>
            <NumberTicker value={Math.abs(numericValue)} />
          </div>
          {badgeText && (
            <span className={`text-[11px] font-display font-normal px-2 py-0.5 rounded-full ${colorMap[badgeColor]}`}>
              {badgeText}
            </span>
          )}
        </div>
      </div>

      <div className="w-16 h-16 sm:w-20 sm:h-20 md:w-24 md:h-24 flex-shrink-0 flex items-center justify-center relative">
        <img
          src={illustration}
          alt={title}
          className="w-full h-full object-contain transition-all duration-500 hover:scale-105 rotate-[5deg]"
          onError={(e: any) => {
            e.target.style.display = 'none'
          }}
        />
      </div>
    </motion.div>
  )
}

export const ExpenseDashboard = ({ onSwitch }: { onSwitch: (val: 'portfolio' | 'expense') => void }) => {
  const [userName, setUserName] = useState<string>("there")
  const [income, setIncome] = useState({ salary: "", sideHustle: "" })
  const [fixedExpenses, setFixedExpenses] = useState({
    rent: "", cook: "", travel: "", insurance: "", communication: ""
  })
  const [loading, setLoading] = useState(false)
  const [transactions, setTransactions] = useState<any[]>([])
  const [categoryMappings, setCategoryMappings] = useState<any[]>([])
  const [txForm, setTxForm] = useState({ name: "", amount: "", category: "Variable Expense", date: new Date().toISOString().split('T')[0] })
  const [mappingForm, setMappingForm] = useState({ itemName: "", category: "Activity" })
  const [activeTab, setActiveTab] = useState('All')
  const [showCatManager, setShowCatManager] = useState(false)
  const [isEditingIncome, setIsEditingIncome] = useState(false)
  const [isEditingFixed, setIsEditingFixed] = useState(false)
  const [isIncomeCollapsed, setIsIncomeCollapsed] = useState(false)
  const [isFixedCollapsed, setIsFixedCollapsed] = useState(false)
  const [isLogsCollapsed, setIsLogsCollapsed] = useState(false)
  const [viewDate, setViewDate] = useState(new Date())
  const [editingMappingId, setEditingMappingId] = useState<string | null>(null)

  const handleLogOut = async () => {
    await supabase.auth.signOut()
    window.location.href = '/'
  }

  // Auto-Categorization Logic
  useEffect(() => {
    const match = categoryMappings.find(m =>
      txForm.name.toLowerCase().includes(m.item_name.toLowerCase()) ||
      m.item_name.toLowerCase().includes(txForm.name.toLowerCase())
    )
    if (match && txForm.name.length > 2) {
      setTxForm(prev => ({ ...prev, category: match.category }))
    }
  }, [txForm.name, categoryMappings])

  const selectedMonth = viewDate.getMonth()
  const selectedYear = viewDate.getFullYear()

  const totalIncome = Number(income.salary || 0) + Number(income.sideHustle || 0)
  const totalFixed = Number(fixedExpenses.rent || 0) +
    Number(fixedExpenses.cook || 0) +
    Number(fixedExpenses.travel || 0) +
    Number(fixedExpenses.insurance || 0) +
    Number(fixedExpenses.communication || 0)

  const monthTxs = transactions.filter(tx => {
    const d = new Date(tx.created_at)
    return d.getMonth() === selectedMonth && d.getFullYear() === selectedYear
  })

  const totalVariable = monthTxs
    .filter(tx => tx.category !== 'Income/Return' && tx.category !== 'Investment')
    .reduce((sum, tx) => sum + Number(tx.amount), 0)

  const totalInvestments = monthTxs
    .filter(tx => tx.category === 'Investment')
    .reduce((sum, tx) => sum + Number(tx.amount), 0)

  const totalIncomeReturns = monthTxs
    .filter(tx => tx.category === 'Income/Return')
    .reduce((sum, tx) => sum + Number(tx.amount), 0)

  const availableBudget = (totalIncome + totalIncomeReturns) - (totalFixed + totalVariable + totalInvestments)


  const saveConfig = async () => {
    if (loading) return
    setLoading(true)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { error } = await supabase
        .from('budgets')
        .upsert({
          user_id: user.id,
          salary: Number(income.salary),
          side_hustle: Number(income.sideHustle),
          fixed_rent: Number(fixedExpenses.rent),
          fixed_cook: Number(fixedExpenses.cook),
          fixed_travel: Number(fixedExpenses.travel),
          fixed_insurance: Number(fixedExpenses.insurance),
          fixed_comms: Number(fixedExpenses.communication),
          total_income: totalIncome,
          available_budget: availableBudget,
          updated_at: new Date().toISOString()
        }, { onConflict: 'user_id' })

      if (error) throw error
      setIsEditingIncome(false)
      setIsEditingFixed(false)
    } catch (err: any) {
      console.error('Error saving config:', err)
      localStorage.setItem('user_finance_config', JSON.stringify({ income, fixedExpenses }))
      alert(`Config saved locally, but failed to sync with Cloud: ${err.message || 'Check connection'}`)
      setIsEditingIncome(false)
      setIsEditingFixed(false)
    } finally {
      setLoading(false)
    }
  }

  const handleIncomeToggle = () => {
    if (isEditingIncome) saveConfig()
    else setIsEditingIncome(true)
  }

  const handleFixedToggle = () => {
    if (isEditingFixed) saveConfig()
    else setIsEditingFixed(true)
  }

  const addTransaction = async () => {
    if (!txForm.name || !txForm.amount || loading) return
    setLoading(true)

    const newTx: any = {
      name: txForm.name,
      amount: Number(txForm.amount),
      category: txForm.category,
      created_at: new Date(txForm.date + 'T' + new Date().toTimeString().split(' ')[0]).toISOString()
    }

    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        // Insert
        const { data, error } = await supabase
          .from('transactions')
          .insert([{ ...newTx, user_id: user.id }])
          .select()
        if (error) throw error
        if (data && data.length > 0) setTransactions([data[0], ...transactions])
      } else {
        // Local fallback
        const newTxs = [{ ...newTx, id: Date.now() }, ...transactions]
        setTransactions(newTxs)
        localStorage.setItem('user_transactions', JSON.stringify(newTxs))
      }
      setTxForm({ name: "", amount: "", category: "Variable Expense", date: new Date().toISOString().split('T')[0] })
    } catch (err: any) {
      console.error('Error adding transaction:', err)
      alert(`Failed to save transaction: ${err.message || 'Unknown error'}`)
    } finally {
      setLoading(false)
    }
  }

  const deleteTransaction = async (id: any) => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        await supabase.from('transactions').delete().eq('id', id)
      }
      const filtered = transactions.filter(t => t.id !== id)
      setTransactions(filtered)
      localStorage.setItem('user_transactions', JSON.stringify(filtered))
    } catch (err) {
      console.error('Error deleting transaction:', err)
    }
  }

  const addMapping = async () => {
    if (!mappingForm.itemName || loading) return
    setLoading(true)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        if (editingMappingId) {
          const { error } = await supabase
            .from('category_mappings')
            .update({ item_name: mappingForm.itemName, category: mappingForm.category })
            .eq('id', editingMappingId)
          if (error) throw error
          setCategoryMappings(categoryMappings.map(m => m.id === editingMappingId ? { ...m, item_name: mappingForm.itemName, category: mappingForm.category } : m))
        } else {
          const { data, error } = await supabase
            .from('category_mappings')
            .insert({ item_name: mappingForm.itemName, category: mappingForm.category, user_id: user.id })
            .select().single()
          if (error) throw error
          setCategoryMappings([data, ...categoryMappings])
        }
      } else {
        let all;
        if (editingMappingId) {
          all = categoryMappings.map(m => m.id === editingMappingId ? { ...m, item_name: mappingForm.itemName, category: mappingForm.category } : m)
        } else {
          all = [{ id: Date.now(), item_name: mappingForm.itemName, category: mappingForm.category }, ...categoryMappings]
        }
        setCategoryMappings(all)
        localStorage.setItem('user_category_mappings', JSON.stringify(all))
      }
      setMappingForm({ itemName: "", category: "Activity" })
      setEditingMappingId(null)
    } catch (err) { console.error(err) } finally { setLoading(false) }
  }

  const editMapping = (m: any) => {
    setMappingForm({
      itemName: m.item_name,
      category: m.category
    })
    setEditingMappingId(m.id)
  }

  const deleteMapping = async (id: any) => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (user) await supabase.from('category_mappings').delete().eq('id', id)
      const filtered = categoryMappings.filter(m => m.id !== id)
      setCategoryMappings(filtered)
      localStorage.setItem('user_category_mappings', JSON.stringify(filtered))
    } catch (err) { console.error(err) }
  }

  useEffect(() => {
    const getData = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        const name = user.user_metadata?.full_name || user.email?.split('@')[0]
        if (name) setUserName(name.charAt(0).toUpperCase() + name.slice(1))

        const { data: budgetData } = await supabase.from('budgets').select('*').eq('user_id', user.id).single()
        if (budgetData) {
          setIncome({ salary: budgetData.salary.toString(), sideHustle: budgetData.side_hustle.toString() })
          setFixedExpenses({
            rent: (budgetData.fixed_rent || "").toString(),
            cook: (budgetData.fixed_cook || "").toString(),
            travel: (budgetData.fixed_travel || "").toString(),
            insurance: (budgetData.fixed_insurance || "").toString(),
            communication: (budgetData.fixed_comms || "").toString()
          })
          setIsEditingIncome(false)
          setIsEditingFixed(false)
        } else {
          setIsEditingIncome(true)
          setIsEditingFixed(true)
        }

        const { data: txData } = await supabase.from('transactions').select('*').eq('user_id', user.id).order('created_at', { ascending: false })
        if (txData) setTransactions(txData)

        const { data: mapData } = await supabase.from('category_mappings').select('*').eq('user_id', user.id)
        if (mapData) setCategoryMappings(mapData)
      } else {
        const localConfig = localStorage.getItem('user_finance_config')
        if (localConfig) {
          const parsed = JSON.parse(localConfig)
          setIncome(parsed.income); setFixedExpenses(parsed.fixedExpenses)
        }
        const localTxs = localStorage.getItem('user_transactions')
        if (localTxs) setTransactions(JSON.parse(localTxs))
        const localMaps = localStorage.getItem('user_category_mappings')
        if (localMaps) setCategoryMappings(JSON.parse(localMaps))
      }
    }
    getData()
  }, [])

  const cards = [
    {
      title: "Monthly Total Income",
      numericValue: totalIncome,
      illustration: "/assets/income.png",
      badgeText: "100%",
      badgeColor: "emerald",
      delay: 0.1
    },
    {
      title: "Fixed Monthly Deductions",
      numericValue: totalFixed,
      illustration: "/assets/expense.png",
      badgeText: totalIncome > 0 ? `${Math.round((totalFixed / totalIncome) * 100)}%` : "0%",
      badgeColor: "rose",
      delay: 0.2
    },
    {
      title: "Monthly Investment Log",
      numericValue: totalInvestments,
      illustration: "/assets/investment.png",
      badgeText: totalIncome > 0 ? `${Math.round((totalInvestments / totalIncome) * 100)}%` : "0%",
      badgeColor: "indigo",
      delay: 0.3
    },
    {
      title: "Current Available Savings",
      numericValue: availableBudget,
      illustration: "/assets/savings.png",
      badgeText: totalIncome > 0 ? `${Math.round((availableBudget / totalIncome) * 100)}%` : "0%",
      badgeColor: "amber",
      delay: 0.4
    }
  ]

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 pt-8 sm:pt-12 min-h-screen font-sans selection:bg-gray-50 selection:text-gray-500">
      <div className="no-print">
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-6 mb-8 pt-2">
          <div className="flex flex-col space-y-1 text-center sm:text-left">
            <h1 className="text-[28px] sm:text-[34px] font-serif font-bold text-[#171717] leading-tight flex items-center justify-center sm:justify-start gap-2">
              Hi, {userName}
            </h1>
            <p className="text-gray-500 text-xs sm:text-sm font-sans">Manage your personal finance system in one place.</p>
          </div>

          <div className="flex flex-col sm:flex-row items-center gap-4 self-center sm:self-auto">
            <div className="flex items-center gap-4 p-1 bg-gray-50 rounded-xl border border-gray-100 shadow-sm">
              <button 
                onClick={() => setViewDate(prev => new Date(prev.getFullYear(), prev.getMonth() - 1, 1))}
                className="p-1.5 hover:bg-white hover:shadow-sm rounded-lg text-gray-400 hover:text-gray-600 transition-all font-bold group"
              >
                <CaretLeft size={16} weight="bold" />
              </button>
              <div className="px-2 flex flex-col items-center min-w-[100px]">
                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{viewDate.getFullYear()}</span>
                <span className="text-[13px] font-bold text-[#171717]">{viewDate.toLocaleString('default', { month: 'long' })}</span>
              </div>
              <button 
                onClick={() => setViewDate(prev => new Date(prev.getFullYear(), prev.getMonth() + 1, 1))}
                className="p-1.5 hover:bg-white hover:shadow-sm rounded-lg text-gray-400 hover:text-gray-600 transition-all font-bold"
              >
                <CaretRight size={16} weight="bold" />
              </button>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => { setTimeout(() => { window.print(); }, 500); }}
                className="flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-[#111827] text-white hover:bg-black transition-all font-bold text-[12px] active:scale-95 group border border-[#111827]"
              >
                <FileText size={14} className="text-gray-300 group-hover:text-white transition-colors" />
                Statement
              </button>
              <button
                onClick={handleLogOut}
                className="flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-white border border-gray-200 text-gray-500 hover:text-gray-500 hover:bg-gray-50 hover:border-gray-200 transition-all font-bold text-[12px] active:scale-95 group"
              >
                <SignOut size={16} weight="bold" className="text-red-400 group-hover:text-red-500 transition-colors" />
                Sign Out
              </button>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-8 border-b border-gray-200 mb-10 overflow-x-auto no-scrollbar scroll-smooth">
          <button
            onClick={() => onSwitch('portfolio')}
            className="relative pb-4 text-[13px] font-bold tracking-tight text-gray-400 hover:text-gray-600 transition-all whitespace-nowrap"
          >
            Portfolio Overview
          </button>
          <button
            onClick={() => onSwitch('expense')}
            className="relative pb-4 text-[13px] font-bold tracking-tight text-[#171717] transition-all"
          >
            Expense Tracker
            <motion.div
              layoutId="active-nav-tab"
              className="absolute bottom-0 left-0 right-0 h-[2px] bg-[#171717]"
              transition={{ type: "spring", bounce: 0.1, duration: 0.5 }}
            />
          </button>
        </div>

        {/* Quick Stats Grid with Illustrations */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-10">
          {cards.map((card, idx) => (
            <StatCard key={idx} {...card} />
          ))}
        </div>

        {/* Income & Mandatory Expenses Setup Section */}
        <div className="max-w-4xl mx-auto space-y-8 mb-12">
          {/* Monthly Income Card */}
          <div className="bg-white p-6 sm:p-8 rounded-3xl border border-gray-200 relative overflow-hidden group">
            <div className="flex items-start justify-between cursor-pointer group/header" onClick={() => setIsIncomeCollapsed(!isIncomeCollapsed)}>
              <div className="flex flex-col gap-1">
                <h2 className="text-2xl font-serif font-bold text-[#171717]">Monthly Cashflow</h2>
                <p className="text-sm text-gray-500">Configure your primary and secondary income streams.</p>
              </div>
              <motion.div
                animate={{ rotate: isIncomeCollapsed ? -90 : 0 }}
                className="w-8 h-8 rounded-full bg-gray-50 border border-gray-200 flex items-center justify-center text-gray-400 group-hover/header:bg-gray-100 group-hover/header:text-gray-600 transition-all"
              >
                <CaretDown size={18} weight="bold" />
              </motion.div>
            </div>

            <motion.div
              initial={false}
              animate={{ height: isIncomeCollapsed ? 0 : 'auto', opacity: isIncomeCollapsed ? 0 : 1, marginTop: isIncomeCollapsed ? 0 : 32 }}
              transition={{ duration: 0.3, ease: [0.23, 1, 0.32, 1] }}
              className="overflow-hidden"
            >
              <div className="flex flex-col sm:flex-row items-end gap-4 lg:gap-6">
                <div className={`space-y-2 flex-1 w-full transition-all duration-500 ${!isEditingIncome ? 'opacity-50 grayscale pointer-events-none' : ''}`}>
                  <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest ml-1">Monthly Salary (Primary)</label>
                  <div className="relative group/input">
                    <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within/input:text-[#171717] transition-colors font-bold text-sm">₹</div>
                    <input type="number" placeholder="0.00" disabled={!isEditingIncome}
                      className="w-full pl-9 pr-4 py-3.5 bg-gray-50/50 border border-gray-200 rounded-2xl text-sm font-bold focus:ring-2 focus:ring-gray-100 focus:bg-white transition-all outline-none"
                      value={income.salary} onChange={(e) => setIncome({ ...income, salary: e.target.value })} />
                  </div>
                </div>
                <div className={`space-y-2 flex-1 w-full transition-all duration-500 ${!isEditingIncome ? 'opacity-50 grayscale pointer-events-none' : ''}`}>
                  <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest ml-1">Side Hustle (Optional)</label>
                  <div className="relative group/input">
                    <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within/input:text-[#171717] transition-colors font-bold text-sm">₹</div>
                    <input type="number" placeholder="0.00" disabled={!isEditingIncome}
                      className="w-full pl-9 pr-4 py-3.5 bg-gray-50/50 border border-gray-200 rounded-2xl text-sm font-bold focus:ring-2 focus:ring-gray-100 focus:bg-white transition-all outline-none"
                      value={income.sideHustle} onChange={(e) => setIncome({ ...income, sideHustle: e.target.value })} />
                  </div>
                </div>

                <div className="w-full sm:w-auto">
                  <button
                    onClick={handleIncomeToggle} disabled={loading}
                    className={`w-full sm:w-auto px-8 py-3.5 bg-[#171717] text-white rounded-2xl text-[12px] font-bold transition-all active:scale-95 whitespace-nowrap ${loading ? 'opacity-50 cursor-not-allowed' : 'hover:scale-105'}`}
                  >
                    {loading ? '...' : isEditingIncome ? 'Save Changes' : 'Edit Income'}
                  </button>
                </div>
              </div>
            </motion.div>
          </div>

          {/* Mandatory Monthly Expenses Card */}
          <div className="bg-white p-6 sm:p-8 rounded-3xl border border-gray-200 relative overflow-hidden group">
            <div className="flex items-start justify-between cursor-pointer group/header" onClick={() => setIsFixedCollapsed(!isFixedCollapsed)}>
              <div className="flex flex-col gap-1">
                <h2 className="text-2xl font-serif font-bold text-[#171717]">Fixed Monthly Expenses</h2>
                <p className="text-sm text-gray-500">Essential obligations to be deducted from your total income.</p>
              </div>
              <motion.div
                animate={{ rotate: isFixedCollapsed ? -90 : 0 }}
                className="w-8 h-8 rounded-full bg-gray-50 border border-gray-200 flex items-center justify-center text-gray-400 group-hover/header:bg-gray-100 group-hover/header:text-gray-600 transition-all"
              >
                <CaretDown size={18} weight="bold" />
              </motion.div>
            </div>

            <motion.div
              initial={false}
              animate={{ height: isFixedCollapsed ? 0 : 'auto', opacity: isFixedCollapsed ? 0 : 1, marginTop: isFixedCollapsed ? 0 : 32 }}
              transition={{ duration: 0.3, ease: [0.23, 1, 0.32, 1] }}
              className="overflow-hidden"
            >
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-5">
                {[
                  { key: 'rent', label: 'House Rent' },
                  { key: 'cook', label: 'Cook Cost' },
                  { key: 'travel', label: 'Travel Allowance' },
                  { key: 'insurance', label: 'Insurance' },
                  { key: 'communication', label: 'Communication Bill' },
                ].map((item) => (
                  <div key={item.key} className={`space-y-2 transition-all duration-500 ${!isEditingFixed ? 'opacity-50 grayscale pointer-events-none' : ''}`}>
                    <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest ml-1">{item.label}</label>
                    <div className="relative group/input">
                      <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within/input:text-gray-500 transition-colors font-bold text-sm">₹</div>
                      <input type="number" placeholder="0.00" disabled={!isEditingFixed}
                        className="w-full pl-9 pr-4 py-3.5 bg-gray-50/50 border border-gray-200 rounded-2xl text-sm font-medium focus:ring-2 focus:ring-gray-50 focus:bg-white transition-all outline-none"
                        value={fixedExpenses[item.key as keyof typeof fixedExpenses]}
                        onChange={(e) => setFixedExpenses({ ...fixedExpenses, [item.key]: e.target.value })} />
                    </div>
                  </div>
                ))}

                <div className="sm:col-span-2 mt-4 flex items-center justify-between p-5 bg-gray-50/50 border border-gray-200 rounded-2xl">
                  <div className="flex flex-col">
                    <span className="text-[10px] font-bold text-rose-400 uppercase tracking-widest">Total Fixed Deductions</span>
                    <span className="text-xl font-display font-bold text-gray-500">₹{totalFixed.toLocaleString('en-IN')}</span>
                  </div>
                  <button
                    onClick={handleFixedToggle} disabled={loading}
                    className={`px-8 py-3 bg-[#171717] text-white rounded-xl text-[12px] font-bold transition-all ${loading ? 'opacity-50 cursor-not-allowed' : 'hover:scale-105 active:scale-95'}`}
                  >
                    {loading ? 'Saving...' : isEditingFixed ? 'Save Changes' : 'Edit Expenses'}
                  </button>
                </div>
              </div>
            </motion.div>
          </div>

          {/* Daily Spend Log & Transactions Table */}
          <div className="bg-white p-6 sm:p-8 rounded-3xl border border-gray-200 relative overflow-hidden group">
            <div className="flex items-start justify-between cursor-pointer group/header" onClick={() => setIsLogsCollapsed(!isLogsCollapsed)}>
              <div className="flex flex-col gap-1">
                <h2 className="text-2xl font-serif font-bold text-[#171717]">Daily Spending Logs</h2>
                <p className="text-sm text-gray-500">Log every minor and major expense to track exactly where your money goes.</p>
              </div>
              <div className="flex items-center gap-4">
                <div className="hidden sm:flex items-center gap-2 bg-gray-50 p-1 rounded-xl" onClick={(e) => e.stopPropagation()}>
                  {['All', 'Expenses', 'Income'].map((tab) => (
                    <button
                      key={tab}
                      onClick={() => setActiveTab(tab)}
                      className={`px-4 py-2 text-[11px] font-bold rounded-lg transition-all ${activeTab === tab ? 'bg-white text-[#171717]' : 'text-gray-400 hover:text-gray-600'}`}
                    >
                      {tab}
                    </button>
                  ))}
                </div>
                <motion.div
                  animate={{ rotate: isLogsCollapsed ? -90 : 0 }}
                  className="w-8 h-8 rounded-full bg-gray-50 border border-gray-200 flex items-center justify-center text-gray-400 group-hover/header:bg-gray-100 group-hover/header:text-gray-600 transition-all"
                >
                  <CaretDown size={18} weight="bold" />
                </motion.div>
              </div>
            </div>

            <motion.div
              initial={false}
              animate={{ height: isLogsCollapsed ? 0 : 'auto', opacity: isLogsCollapsed ? 0 : 1, marginTop: isLogsCollapsed ? 0 : 32 }}
              transition={{ duration: 0.3, ease: [0.23, 1, 0.32, 1] }}
              className="overflow-hidden"
            >

            {/* Smart Categorization (Internal Collapsible) */}
            <div className="mb-8 border border-gray-100 rounded-2xl overflow-hidden bg-gray-50/20">
              <div 
                className="flex items-center justify-between p-4 cursor-pointer hover:bg-gray-50/50 transition-colors"
                onClick={() => setShowCatManager(!showCatManager)}
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-xl bg-white border border-gray-100 flex items-center justify-center text-[#171717]">
                    <Sparkle size={16} weight="bold" />
                  </div>
                  <div className="flex flex-col">
                    <h3 className="text-sm font-serif font-bold text-[#171717]">Smart Categorization</h3>
                    <p className="text-[10px] text-gray-400">Automate your transaction tagging.</p>
                  </div>
                </div>
                <motion.div
                  animate={{ rotate: showCatManager ? 0 : -90 }}
                  className="w-6 h-6 rounded-lg flex items-center justify-center text-gray-400"
                >
                  <CaretDown size={14} weight="bold" />
                </motion.div>
              </div>

              <motion.div
                initial={false}
                animate={{ height: showCatManager ? 'auto' : 0, opacity: showCatManager ? 1 : 0 }}
                className="overflow-hidden"
              >
                <div className="p-6 pt-0">
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest ml-1">Keyword</label>
                      <input type="text" placeholder="e.g. Swiggy, Netflix..."
                        value={mappingForm.itemName} onChange={(e) => setMappingForm({ ...mappingForm, itemName: e.target.value })}
                        className="w-full px-4 py-3 bg-white border border-gray-200/50 rounded-xl text-sm font-medium outline-none focus:ring-2 focus:ring-gray-200 transition-all" />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest ml-1">Auto-Select Category</label>
                      <input 
                        type="text" 
                        placeholder="Type custom category..."
                        autoComplete="off"
                        value={mappingForm.category} 
                        onChange={(e) => setMappingForm({ ...mappingForm, category: e.target.value })}
                        className="w-full px-4 py-3 bg-white border border-gray-200/50 rounded-xl text-sm font-medium outline-none focus:ring-2 focus:ring-gray-200 transition-all" 
                      />
                    </div>
                    <div className="flex items-end">
                      <div className="w-full">
                        <button onClick={addMapping} className={`w-full py-3 text-white rounded-xl text-[11px] font-bold transition-all flex items-center justify-center gap-2 ${editingMappingId ? 'bg-indigo-600 hover:bg-indigo-700' : 'bg-[#171717] hover:bg-black'}`}>
                          {editingMappingId ? <Check size={14} weight="bold" /> : <Plus size={14} weight="bold" />}
                          {editingMappingId ? 'Update Rule' : 'Add Rule'}
                        </button>
                        {editingMappingId && (
                          <button onClick={() => { setEditingMappingId(null); setMappingForm({ itemName: "", category: "Activity" }); }} className="w-full mt-2 py-1 text-[10px] font-bold text-gray-400 hover:text-gray-600">
                            Cancel
                          </button>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="max-h-40 overflow-y-auto pr-2 custom-scrollbar">
                    <table className="w-full text-left">
                      <tbody className="divide-y divide-gray-100">
                        {categoryMappings.map((m) => (
                          <tr key={m.id} className="group/row">
                            <td className="py-2.5 font-serif font-bold text-[13px] text-gray-700">{m.item_name}</td>
                            <td className="py-2.5">
                              <span className="px-2 py-0.5 bg-gray-50 border border-gray-100 rounded text-[9px] font-bold text-gray-400 uppercase tracking-wider">
                                {m.category}
                              </span>
                            </td>
                            <td className="py-2.5 text-right">
                              <div className="flex items-center justify-end gap-2">
                                <button onClick={() => editMapping(m)} className="p-1 text-gray-300 hover:text-[#171717] transition-colors">
                                  <PencilLine size={14} weight="bold" />
                                </button>
                                <button onClick={() => deleteMapping(m.id)} className="p-1 text-gray-300 hover:text-red-400 transition-colors">
                                  <X size={14} weight="bold" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </motion.div>
            </div>

            {/* Add Transaction Inline Form */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 mb-8 p-5 bg-gray-50/50 border border-gray-200 rounded-2xl items-end">
              <div className="space-y-2">
                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest ml-1">Spent On / From</label>
                <input type="text" placeholder="e.g. Starbucks, Uber..."
                  value={txForm.name} onChange={(e) => setTxForm({ ...txForm, name: e.target.value })}
                  className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl text-sm font-medium outline-none focus:ring-2 focus:ring-gray-100 transition-all" />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest ml-1">Amount</label>
                <div className="relative">
                  <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 font-bold text-xs">₹</div>
                  <input type="number" placeholder="0.00"
                    value={txForm.amount} onChange={(e) => setTxForm({ ...txForm, amount: e.target.value })}
                    className="w-full pl-8 pr-4 py-3 bg-white border border-gray-200 rounded-xl text-sm font-bold outline-none focus:ring-2 focus:ring-gray-100 transition-all" />
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest ml-1">Date</label>
                <div className="relative">
                  <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none">
                    <CalendarBlank size={16} weight="bold" />
                  </div>
                  <input type="date"
                    value={txForm.date} 
                    onChange={(e) => setTxForm({ ...txForm, date: e.target.value })}
                    onClick={(e) => e.currentTarget.showPicker?.()}
                    className="w-full pl-9 pr-2 py-3 bg-white border border-gray-200 rounded-xl text-[13px] font-bold outline-none focus:ring-2 focus:ring-gray-100 transition-all cursor-pointer" />
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest ml-1">Category</label>
                <input 
                  type="text" 
                  autoComplete="off"
                  placeholder="Category..."
                  value={txForm.category} 
                  onChange={(e) => setTxForm({ ...txForm, category: e.target.value })}
                  className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl text-sm font-bold outline-none focus:ring-2 focus:ring-gray-100 transition-all" 
                />
              </div>
              <button
                onClick={addTransaction} disabled={loading}
                className={`flex items-center justify-center gap-2 px-6 py-3.5 bg-[#171717] hover:bg-black text-white rounded-xl text-[12px] font-bold transition-all ${loading ? 'opacity-50' : 'active:scale-95'} lg:mt-0`}
              >
                {loading ? 'Processing...' : (
                  <>
                    <Plus size={16} weight="bold" />
                    <span>Add Log</span>
                  </>
                )}
              </button>
            </div>

            {/* Transactions Table */}
            <div className="mt-4">
              {monthTxs
                .filter(tx => {
                  if (activeTab === 'Expenses') return tx.category !== 'Income/Return'
                  if (activeTab === 'Income') return tx.category === 'Income/Return'
                  return true
                })
                .map((tx) => {
                  const isIncome = tx.category === 'Income/Return'
                  const dateObj = new Date(tx.created_at)

                  const iconMap: any = {
                    "Food": <Hamburger size={20} weight="bold" className="text-[#171717]" />,
                    "Commute": <Car size={20} weight="bold" className="text-[#171717]" />,
                    "Entertainment": <FilmStrip size={20} weight="bold" className="text-[#171717]" />,
                    "Clothing": <TShirt size={20} weight="bold" className="text-[#171717]" />,
                    "Gadgets": <Laptop size={20} weight="bold" className="text-[#171717]" />,
                    "Charges": <CreditCard size={20} weight="bold" className="text-[#171717]" />,
                    "Cash Withdrawal": <Bank size={20} weight="bold" className="text-[#171717]" />,
                    "Activity": <DeviceMobile size={20} weight="bold" className="text-[#171717]" />,
                    "Unexpected": <Warning size={20} weight="bold" className="text-[#171717]" />,
                    "Investment": <ChartLineUp size={20} weight="bold" className="text-[#171717]" />,
                    "Income/Return": <Coins size={20} weight="bold" className="text-[#171717]" />,
                    "Variable Expense": <Wallet size={20} weight="bold" className="text-[#171717]" />
                  }

                  return (
                    <motion.div
                      layout
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      key={tx.id}
                      className="group flex flex-col sm:flex-row items-center justify-between p-4 sm:p-5 bg-white border border-gray-100/80 rounded-2xl mb-3 hover:border-gray-300 transition-all duration-300 relative"
                    >
                      <div className="flex items-center gap-4 w-full sm:w-1/3 min-w-0">
                        {/* Compact Icon Box */}
                        <div className="w-10 h-10 rounded-xl border border-gray-100 flex items-center justify-center text-lg shrink-0 bg-gray-50/30">
                          {iconMap[tx.category] || <Wallet size={20} weight="bold" className="text-[#171717]" />}
                        </div>
                        
                        <div className="flex flex-col min-w-0">
                          <span className="font-serif font-bold text-[17px] text-[#171717] tracking-tight">
                            {tx.name}
                          </span>
                          <span className="text-[11px] font-medium text-gray-400">
                            {dateObj.toLocaleDateString('en-GB', { day: '2-digit', month: 'short' })} • {tx.category}
                          </span>
                        </div>
                      </div>

                      {/* Centered Status (As seen in 2nd image) */}
                      <div className="hidden sm:flex items-center justify-center flex-1">
                        <div className="flex items-center gap-2 px-3 py-1 bg-gray-50/50 rounded-full border border-gray-100/50">
                          <div className={`w-1.5 h-1.5 rounded-full ${isIncome ? 'bg-emerald-500' : 'bg-emerald-500'}`} />
                          <span className="text-[11px] font-bold text-gray-600 uppercase tracking-wider">
                            {isIncome ? 'Completed' : 'Completed'}
                          </span>
                        </div>
                      </div>

                      <div className="flex flex-col items-end w-full sm:w-1/3 mt-3 sm:mt-0">
                        <span className="font-serif font-bold text-[18px] text-[#171717] tracking-tight">
                          {isIncome ? '+' : '-'}₹{Number(tx.amount).toLocaleString('en-IN')}
                        </span>
                        <span className="text-[11px] font-bold text-gray-300 uppercase tracking-widest">
                          {isIncome ? 'Direct Deposit' : 'Digital Payment'}
                        </span>
                      </div>

                      {/* Compact Delete Trigger */}
                      <button
                        onClick={(e) => { e.stopPropagation(); deleteTransaction(tx.id); }}
                        className="absolute right-2 top-2 opacity-0 group-hover:opacity-100 p-1 text-gray-300 hover:text-red-400 transition-all border border-transparent hover:border-gray-100 rounded-lg"
                      >
                        <X size={14} weight="bold" />
                      </button>
                    </motion.div>
                  )
                })}

              {monthTxs.length === 0 && (
                <div className="py-20 text-center text-gray-400 font-bold text-sm bg-gray-50/20 rounded-2xl border border-dashed border-gray-200 mt-4">
                  No transactions this month.
                </div>
              )}
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  </div>
  )
}
