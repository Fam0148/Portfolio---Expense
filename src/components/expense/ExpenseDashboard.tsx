import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import { supabase } from "../../lib/supabase"
import {
  SignOut,
  FilePdf,
  CaretDown,
  CaretLeft,
  CaretRight,
  Plus,
  X,
  PencilLine,
  Check,
  Sparkle,
  CalendarBlank
} from "@phosphor-icons/react"
import { NumberTicker } from "../ui/NumberTicker"

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
      className="bg-white p-5 sm:p-6 rounded-lg border border-gray-200/80 flex flex-row items-center justify-between gap-4 group transition-all duration-300 shadow-sm"
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

export const ExpenseDashboard = ({ onSwitch, userName }: { onSwitch: (val: 'portfolio' | 'expense') => void, userName: string }) => {
  const [income, setIncome] = useState({ salary: "", sideHustle: "" })
  const [fixedExpenses, setFixedExpenses] = useState({
    rent: "", cook: "", travel: "", insurance: "", communication: ""
  })
  const [loading, setLoading] = useState(false)
  const [transactions, setTransactions] = useState<any[]>([])
  const [categoryMappings, setCategoryMappings] = useState<any[]>([])
  const [txForm, setTxForm] = useState({ name: "", amount: "", category: "Variable Expense", date: new Date().toISOString().split('T')[0], note: "" })
  const [mappingForm, setMappingForm] = useState({ itemName: "", category: "" })
  const [activeTab, setActiveTab] = useState('All')
  const [showCatManager, setShowCatManager] = useState(false)
  const [isEditingIncome, setIsEditingIncome] = useState(false)
  const [isEditingFixed, setIsEditingFixed] = useState(false)
  const [isIncomeCollapsed, setIsIncomeCollapsed] = useState(true)
  const [isFixedCollapsed, setIsFixedCollapsed] = useState(true)
  const [isLogsCollapsed, setIsLogsCollapsed] = useState(true)
  const [viewDate, setViewDate] = useState(new Date())
  const [editingMappingId, setEditingMappingId] = useState<string | null>(null)
  const [showCategoryDropdown, setShowCategoryDropdown] = useState(false)
  const [showMappingCategoryDropdown, setShowMappingCategoryDropdown] = useState(false)
  const [catSearch, setCatSearch] = useState("")
  const [mappingCatSearch, setMappingCatSearch] = useState("")

  const defaultCategories = [
    "Food & Dining", "Transport", "Shopping", "Entertainment", "Health",
    "Gift", "Education", "Variable Expense", "Fixed Expense", "Investment",
    "Income/Return", "Salary", "Bonus", "Rental Income", "Dividend"
  ]

  const existingCategories: string[] = (Array.from(
    ([...defaultCategories, ...transactions.map(t => t.category), ...categoryMappings.map(m => m.category)] as any[])
      .filter(Boolean)
      .reduce((map: Map<string, string>, cat: any) => {
        const catStr = String(cat).trim()
        const lower = catStr.toLowerCase()
        if (!map.has(lower)) {
          map.set(lower, catStr)
        }
        return map
      }, new Map<string, string>())
      .values()
  ) as string[]).sort((a: string, b: string) => a.localeCompare(b))

  const filteredCategories = existingCategories.filter(cat =>
    cat.toLowerCase().includes(catSearch.toLowerCase())
  )

  const filteredMappingCategories = existingCategories.filter(cat =>
    cat.toLowerCase().includes(mappingCatSearch.toLowerCase())
  )

  const isAlreadyMapped = categoryMappings.some(m =>
    m.item_name.toLowerCase() === txForm.name.toLowerCase() && m.category === txForm.category
  )

  const sortedMappings = [...categoryMappings].sort((a, b) =>
    (a.item_name || "").localeCompare(b.item_name || "")
  )

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
  const currentMonthYear = `${(selectedMonth + 1).toString().padStart(2, '0')}-${selectedYear}`

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

  const isIncomeCategory = (cat: string) => {
    const c = cat.toLowerCase()
    return c === 'income/return' || c.includes('hustle') || c.includes('salary')
  }

  const totalVariable = monthTxs
    .filter(tx => !isIncomeCategory(tx.category) && tx.category !== 'Investment')
    .reduce((sum, tx) => sum + Number(tx.amount), 0)

  const totalInvestments = monthTxs
    .filter(tx => tx.category === 'Investment')
    .reduce((sum, tx) => sum + Number(tx.amount), 0)

  const totalIncomeReturns = monthTxs
    .filter(tx => isIncomeCategory(tx.category))
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
          month_year: currentMonthYear,
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
        }, { onConflict: 'user_id,month_year' })

      if (error) throw error
      setIsEditingIncome(false)
      setIsEditingFixed(false)
    } catch (err: any) {
      console.error('Error saving config:', err)
      const localKey = `user_finance_config_${currentMonthYear}`
      localStorage.setItem(localKey, JSON.stringify({ income, fixedExpenses }))
      alert(`Config saved locally for ${currentMonthYear}, but failed to sync with Cloud: ${err.message || 'Check connection'}`)
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
      note: txForm.note,
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
      setTxForm({ name: "", amount: "", category: "Variable Expense", date: new Date().toISOString().split('T')[0], note: "" })
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
      setMappingForm({ itemName: "", category: "" })
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

  const handleExportStatement = () => {
    window.print()
  }

  useEffect(() => {
    const getData = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        // 1. Fetch Budget for current month
        const { data: budgetData } = await supabase
          .from('budgets')
          .select('*')
          .eq('user_id', user.id)
          .eq('month_year', currentMonthYear)
          .maybeSingle()

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
          // If current month is empty, start fresh as requested
          setIncome({ salary: "", sideHustle: "" })
          setFixedExpenses({ rent: "", cook: "", travel: "", insurance: "", communication: "" })
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
  }, [selectedMonth, selectedYear])

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
    <>
      <div className="max-w-5xl mx-auto px-4 sm:px-6 pt-8 sm:pt-12 min-h-screen font-sans selection:bg-gray-50 selection:text-gray-500">
        <div className="no-print">
          {/* Centered Greeting & Global Actions */}
          <div className="flex flex-col items-center gap-6 pb-6 border-b border-gray-100 text-center">
            <div className="flex flex-col space-y-1">
              <h1 className="text-[28px] sm:text-[34px] font-serif font-bold text-[#171717] leading-tight flex items-center justify-center gap-2">
                Hi, {userName}
              </h1>
              <p className="text-gray-500 text-xs sm:text-sm font-sans tracking-tight">Monitor your daily spending and manage monthly cashflows.</p>
            </div>

            <div className="flex items-center gap-3">
              {/* Parallel Year Month Picker (Sharpened Corners) */}
              <div className="flex items-center gap-1 p-0.5 bg-gray-50 rounded-sm border border-gray-100 shadow-[0_1px_2px_rgba(0,0,0,0.05)] transition-all hover:border-gray-200">
                <button
                  onClick={() => setViewDate(prev => new Date(prev.getFullYear(), prev.getMonth() - 1, 1))}
                  className="p-1 hover:bg-white hover:shadow-xs rounded-sm text-gray-400 hover:text-gray-600 transition-all font-bold"
                >
                  <CaretLeft size={14} weight="bold" />
                </button>
                
                <div className="px-2 flex items-center gap-2 min-w-[90px] select-none justify-center">
                  <span className="text-[11px] font-bold text-[#111827]">{viewDate.getFullYear()}</span>
                  <span className="text-[10px] font-medium text-gray-500 tracking-tight">{viewDate.toLocaleString('default', { month: 'long' })}</span>
                </div>

                <button
                  onClick={() => setViewDate(prev => new Date(prev.getFullYear(), prev.getMonth() + 1, 1))}
                  className="p-1 hover:bg-white hover:shadow-xs rounded-sm text-gray-400 hover:text-gray-600 transition-all font-bold"
                >
                  <CaretRight size={14} weight="bold" />
                </button>
              </div>

              <div className="h-6 w-[1px] bg-gray-100 mx-1" />

              <button
                onClick={handleExportStatement}
                className="flex items-center justify-center gap-2 px-4 py-2 rounded-sm bg-[#111827] text-white hover:bg-black transition-all font-bold text-[12px] active:scale-95 group border border-[#111827] shadow-sm"
              >
                <FilePdf size={14} className="text-gray-300 group-hover:text-white transition-colors" />
                Export Statement
              </button>
              
              <button
                onClick={handleLogOut}
                className="flex items-center justify-center gap-2 px-4 py-2 rounded-sm bg-white border border-gray-100 text-gray-500 hover:text-gray-600 hover:bg-gray-50 transition-all font-bold text-[12px] active:scale-95 group shadow-sm"
              >
                <SignOut size={16} weight="bold" className="text-red-400 group-hover:text-red-500 transition-colors" />
                Sign Out
              </button>
            </div>
          </div>

          {/* Secondary Navigation Row: Centered Tabs */}
          <div className="flex flex-row items-start justify-center gap-8 mt-4 mb-10">
            <div className="flex items-center gap-8 overflow-x-auto no-scrollbar scroll-smooth">
              <button
                onClick={() => onSwitch('portfolio')}
                className="relative pb-4 text-[13px] font-bold tracking-tight text-gray-400 hover:text-gray-600 transition-all whitespace-nowrap"
              >
                Portfolio Overview
              </button>
              <button
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
            <div className="flex items-start justify-between group/header">
              <div className="flex flex-col gap-1">
                <h2 className="text-2xl font-serif font-bold text-[#171717]">Monthly Cashflow</h2>
                <p className="text-sm text-gray-500">Configure your primary and secondary income streams.</p>
              </div>
              <button
                onClick={() => setIsIncomeCollapsed(!isIncomeCollapsed)}
                className="w-8 h-8 rounded-full bg-gray-50 border border-gray-200 flex items-center justify-center text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition-all cursor-pointer"
              >
                <motion.div
                  animate={{ rotate: isIncomeCollapsed ? -90 : 0 }}
                >
                  <CaretDown size={18} weight="bold" />
                </motion.div>
              </button>
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
                      className="w-full pl-9 pr-4 py-3.5 bg-gray-50/50 border border-gray-200 rounded-md text-sm font-bold focus:ring-2 focus:ring-gray-100 focus:bg-white transition-all outline-none"
                      value={income.salary} onChange={(e) => setIncome({ ...income, salary: e.target.value })} />
                  </div>
                </div>
                <div className={`space-y-2 flex-1 w-full transition-all duration-500 ${!isEditingIncome ? 'opacity-50 grayscale pointer-events-none' : ''}`}>
                  <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest ml-1">Side Hustle (Optional)</label>
                  <div className="relative group/input">
                    <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within/input:text-[#171717] transition-colors font-bold text-sm">₹</div>
                    <input type="number" placeholder="0.00" disabled={!isEditingIncome}
                      className="w-full pl-9 pr-4 py-3.5 bg-gray-50/50 border border-gray-200 rounded-md text-sm font-bold focus:ring-2 focus:ring-gray-100 focus:bg-white transition-all outline-none"
                      value={income.sideHustle} onChange={(e) => setIncome({ ...income, sideHustle: e.target.value })} />
                  </div>
                </div>

                <div className="w-full sm:w-auto">
                  <button
                    onClick={handleIncomeToggle} disabled={loading}
                    className={`w-full sm:w-auto px-8 py-3.5 bg-[#171717] text-white rounded-md text-[12px] font-bold transition-all active:scale-95 whitespace-nowrap ${loading ? 'opacity-50 cursor-not-allowed' : 'hover:scale-105'}`}
                  >
                    {loading ? '...' : isEditingIncome ? 'Save Changes' : 'Edit Income'}
                  </button>
                </div>
              </div>
            </motion.div>
          </div>

          {/* Mandatory Monthly Expenses Card */}
          <div className="bg-white p-6 sm:p-8 rounded-3xl border border-gray-200 relative overflow-hidden group">
            <div className="flex items-start justify-between group/header">
              <div className="flex flex-col gap-1">
                <h2 className="text-2xl font-serif font-bold text-[#171717]">Fixed Monthly Expenses</h2>
                <p className="text-sm text-gray-500">Essential obligations to be deducted from your total income.</p>
              </div>
              <button
                onClick={() => setIsFixedCollapsed(!isFixedCollapsed)}
                className="w-8 h-8 rounded-full bg-gray-50 border border-gray-200 flex items-center justify-center text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition-all cursor-pointer"
              >
                <motion.div
                  animate={{ rotate: isFixedCollapsed ? -90 : 0 }}
                >
                  <CaretDown size={18} weight="bold" />
                </motion.div>
              </button>
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
                        className="w-full pl-9 pr-4 py-3.5 bg-gray-50/50 border border-gray-200 rounded-lg text-sm font-medium focus:ring-2 focus:ring-gray-50 focus:bg-white transition-all outline-none"
                        value={fixedExpenses[item.key as keyof typeof fixedExpenses]}
                        onChange={(e) => setFixedExpenses({ ...fixedExpenses, [item.key]: e.target.value })} />
                    </div>
                  </div>
                ))}

                <div className="sm:col-span-2 mt-4 flex items-center justify-between p-5 bg-gray-50/50 border border-gray-200 rounded-lg">
                  <div className="flex flex-col">
                    <span className="text-[10px] font-bold text-rose-400 uppercase tracking-widest">Total Fixed Deductions</span>
                    <span className="text-xl font-display font-bold text-gray-500">₹{totalFixed.toLocaleString('en-IN')}</span>
                  </div>
                  <button
                    onClick={handleFixedToggle} disabled={loading}
                    className={`px-8 py-3 bg-[#171717] text-white rounded-md text-[12px] font-bold transition-all ${loading ? 'opacity-50 cursor-not-allowed' : 'hover:scale-105 active:scale-95'}`}
                  >
                    {loading ? 'Saving...' : isEditingFixed ? 'Save Changes' : 'Edit Expenses'}
                  </button>
                </div>
              </div>
            </motion.div>
          </div>

          {/* Daily Spend Log & Transactions Table */}
          <div className="bg-white p-6 sm:p-8 rounded-xl border border-gray-200 relative overflow-hidden group shadow-sm shadow-black/5">
            <div className="flex items-start justify-between group/header">
              <div className="flex flex-col gap-1">
                <h2 className="text-2xl font-serif font-bold text-[#171717]">Daily Spending Logs</h2>
                <p className="text-sm text-gray-500">Log every minor and major expense to track exactly where your money goes.</p>
              </div>
              <div className="flex items-center gap-4">
                <div className="hidden sm:flex items-center gap-2 bg-gray-50 p-1 rounded-md" onClick={(e) => e.stopPropagation()}>
                  {['All', 'Expenses', 'Income'].map((tab) => (
                    <button
                      key={tab}
                      onClick={() => setActiveTab(tab)}
                      className={`px-4 py-2 text-[11px] font-bold rounded-sm transition-all ${activeTab === tab ? 'bg-white text-[#171717]' : 'text-gray-400 hover:text-gray-600'}`}
                    >
                      {tab}
                    </button>
                  ))}
                </div>
                <motion.button
                  onClick={() => setIsLogsCollapsed(!isLogsCollapsed)}
                  animate={{ rotate: isLogsCollapsed ? -90 : 0 }}
                  className="w-8 h-8 rounded-full bg-gray-50 border border-gray-200 flex items-center justify-center text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition-all cursor-pointer"
                >
                  <CaretDown size={18} weight="bold" />
                </motion.button>
              </div>
            </div>

            <motion.div
              initial={false}
              animate={{ height: isLogsCollapsed ? 0 : 'auto', opacity: isLogsCollapsed ? 0 : 1, marginTop: isLogsCollapsed ? 0 : 32 }}
              transition={{ duration: 0.3, ease: [0.23, 1, 0.32, 1] }}
              className="overflow-hidden"
            >

              {/* Smart Categorization (Internal Collapsible) */}
              <div className="mb-8 border border-gray-100 rounded-lg overflow-hidden bg-gray-50/20">
                <div className="flex items-center justify-between p-4 transition-colors">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-md bg-white border border-gray-100 flex items-center justify-center text-[#171717]">
                      <Sparkle size={16} weight="bold" />
                    </div>
                    <div className="flex flex-col">
                      <h3 className="text-sm font-serif font-bold text-[#171717]">Smart Categorization</h3>
                      <p className="text-[10px] text-gray-400">Automate your transaction tagging.</p>
                    </div>
                  </div>
                  <motion.button
                    onClick={() => setShowCatManager(!showCatManager)}
                    animate={{ rotate: showCatManager ? 0 : -90 }}
                    className="w-8 h-8 rounded-md bg-white border border-gray-100 flex items-center justify-center text-gray-400 hover:bg-gray-50 hover:text-gray-600 transition-all cursor-pointer shadow-sm"
                  >
                    <CaretDown size={14} weight="bold" />
                  </motion.button>
                </div>

                <motion.div
                  initial={false}
                  animate={{ height: showCatManager ? 'auto' : 0, opacity: showCatManager ? 1 : 0 }}
                  className="overflow-hidden"
                >
                  <div className="p-6 pt-0">
                    <div className="grid grid-cols-1 sm:grid-cols-12 gap-4 mb-6">
                      <div className="sm:col-span-4 space-y-1.5">
                        <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest ml-1">Keyword</label>
                        <input type="text" placeholder="e.g. Swiggy, Netflix..."
                          value={mappingForm.itemName} onChange={(e) => setMappingForm({ ...mappingForm, itemName: e.target.value })}
                          className="w-full px-4 py-3 bg-white border border-gray-200 rounded-md text-sm font-bold outline-none focus:ring-2 focus:ring-gray-100 transition-all placeholder:text-gray-300" />
                      </div>
                      <div className="sm:col-span-4 space-y-1.5 relative" onBlur={(e) => {
                        if (!e.currentTarget.contains(e.relatedTarget)) {
                          setShowMappingCategoryDropdown(false)
                        }
                      }}>
                        <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest ml-1">Auto-Select Category</label>
                        <div className="relative">
                          <input
                            type="text"
                            readOnly
                            placeholder="Activity"
                            autoComplete="off"
                            value={mappingForm.category}
                            onClick={() => {
                              setShowMappingCategoryDropdown(true)
                              setMappingCatSearch("")
                            }}
                            className="w-full px-4 py-3 bg-white border border-gray-200 rounded-md text-sm font-bold outline-none focus:ring-2 focus:ring-gray-100 transition-all cursor-pointer"
                          />
                          {showMappingCategoryDropdown && (
                            <motion.div
                              initial={{ opacity: 0, y: 10 }}
                              animate={{ opacity: 1, y: 0 }}
                              className="absolute top-[calc(100%+8px)] left-0 right-0 bg-white border border-gray-100 rounded-lg shadow-xl z-50 overflow-hidden"
                            >
                              <div className="p-2 border-b border-gray-50 flex flex-col gap-2 bg-gray-50/50">
                                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest px-1">Select an option or create one</span>
                                <input
                                  autoFocus
                                  type="text"
                                  placeholder="Search for an option..."
                                  value={mappingCatSearch}
                                  onChange={(e) => setMappingCatSearch(e.target.value)}
                                  className="w-full px-3 py-2 bg-white border border-gray-200 rounded-md text-xs font-medium outline-none focus:ring-2 focus:ring-[#171717]/10"
                                />
                              </div>
                              <div className="max-h-[200px] overflow-y-auto py-2">
                                {filteredMappingCategories.length > 0 ? (
                                  filteredMappingCategories.map((cat, idx) => (
                                    <button
                                      key={idx}
                                      onClick={() => {
                                        setMappingForm({ ...mappingForm, category: cat })
                                        setShowMappingCategoryDropdown(false)
                                      }}
                                      className="w-full text-left px-4 py-2 text-sm font-bold text-gray-600 hover:bg-gray-50 transition-colors flex items-center justify-between group"
                                    >
                                      <div className="flex items-center gap-2">
                                        <div className="w-1.5 h-1.5 rounded-full bg-gray-300 group-hover:bg-gray-500 transition-colors" />
                                        <span>{cat}</span>
                                      </div>
                                      <Check size={14} className="opacity-0 group-hover:opacity-100 text-emerald-500" />
                                    </button>
                                  ))
                                ) : (
                                  <div className="px-4 py-2 text-xs text-gray-400 italic">No matches...</div>
                                )}
                              </div>
                              {mappingCatSearch && !existingCategories.some(c => c.toLowerCase() === mappingCatSearch.toLowerCase()) && (
                                <div className="border-t border-gray-100 p-2 bg-gray-50/50">
                                  <button
                                    onClick={() => {
                                      setMappingForm({ ...mappingForm, category: mappingCatSearch });
                                      setShowMappingCategoryDropdown(false);
                                    }}
                                    className="w-full flex items-center gap-2 px-3 py-2 bg-white border border-gray-100 rounded-md shadow-sm text-xs font-bold text-[#171717] hover:bg-gray-50 transition-colors"
                                  >
                                    <Plus size={12} weight="bold" />
                                    <span>Create: "{mappingCatSearch}"</span>
                                  </button>
                                </div>
                              )}
                            </motion.div>
                          )}
                        </div>
                      </div>
                      <div className="sm:col-span-4 flex items-end">
                        <div className="w-full">
                          <button onClick={addMapping} className={`w-full py-3 text-white rounded-md text-[13px] font-bold transition-all flex items-center justify-center gap-2 ${editingMappingId ? 'bg-indigo-600 hover:bg-indigo-700' : 'bg-[#171717] hover:bg-black shadow-lg shadow-black/10'}`}>
                            {editingMappingId ? <Check size={16} weight="bold" /> : <Plus size={16} weight="bold" />}
                            {editingMappingId ? 'Update Rule' : 'Add Rule'}
                          </button>
                          {editingMappingId && (
                            <button onClick={() => { setEditingMappingId(null); setMappingForm({ itemName: "", category: "" }); }} className="w-full mt-2 py-1 text-[10px] font-bold text-gray-400 hover:text-gray-600">
                              Cancel
                            </button>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="max-h-60 overflow-y-auto pr-2 custom-scrollbar">
                      <table className="w-full text-left">
                        <tbody className="divide-y divide-gray-50">
                          {sortedMappings.map((m) => (
                            <tr key={m.id} className="group/row">
                              <td className="py-4 font-sans font-bold text-[14px] text-[#171717]">{m.item_name}</td>
                              <td className="py-4">
                                <div className="flex items-center gap-2">
                                  <div className="w-1.5 h-1.5 rounded-full bg-[#171717] opacity-60 flex-shrink-0" />
                                  <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                                    {m.category}
                                  </span>
                                </div>
                              </td>
                              <td className="py-4 text-right">
                                <div className="flex items-center justify-end gap-3 opacity-0 group-hover/row:opacity-100 transition-all">
                                  <button onClick={() => editMapping(m)} className="p-1.5 text-gray-300 hover:text-[#171717] hover:bg-gray-100 rounded-md transition-all">
                                    <PencilLine size={16} weight="bold" />
                                  </button>
                                  <button onClick={() => deleteMapping(m.id)} className="p-1.5 text-gray-300 hover:text-red-400 hover:bg-red-50 rounded-md transition-all">
                                    <X size={16} weight="bold" />
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
              <div className="space-y-4 mb-8 p-5 bg-gray-50/50 border border-gray-200 rounded-lg">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 items-end">
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest ml-1">Spent On / From</label>
                    <input type="text" placeholder="e.g. Starbucks, Uber..."
                      value={txForm.name} onChange={(e) => setTxForm({ ...txForm, name: e.target.value })}
                      className="w-full px-4 py-3 bg-white border border-gray-200 rounded-md text-sm font-medium outline-none focus:ring-2 focus:ring-gray-100 transition-all" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest ml-1">Amount</label>
                    <div className="relative">
                      <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 font-bold text-xs">₹</div>
                      <input type="number" placeholder="0.00"
                        value={txForm.amount} onChange={(e) => setTxForm({ ...txForm, amount: e.target.value })}
                        className="w-full pl-8 pr-4 py-3 bg-white border border-gray-200 rounded-md text-sm font-bold outline-none focus:ring-2 focus:ring-gray-100 transition-all" />
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
                        className="w-full pl-9 pr-2 py-3 bg-white border border-gray-200 rounded-md text-[13px] font-bold outline-none focus:ring-2 focus:ring-gray-100 transition-all cursor-pointer" />
                    </div>
                  </div>
                  <div className="space-y-2 relative" onBlur={(e) => {
                    if (!e.currentTarget.contains(e.relatedTarget)) {
                      setShowCategoryDropdown(false)
                    }
                  }}>
                    <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest ml-1">Category</label>
                    <div className="relative">
                      <input
                        type="text"
                        readOnly
                        placeholder="Category..."
                        value={txForm.category}
                        disabled={!txForm.name.trim()}
                        onClick={() => {
                          setShowCategoryDropdown(true)
                          setCatSearch("")
                        }}
                        className="w-full px-4 py-3 bg-white border border-gray-200 rounded-md text-sm font-bold outline-none focus:ring-2 focus:ring-gray-100 transition-all disabled:opacity-50 disabled:bg-gray-50 disabled:cursor-not-allowed pr-10 cursor-pointer"
                      />
                      <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-gray-300">
                        {isAlreadyMapped ? <Sparkle size={14} weight="fill" className="text-amber-400 animate-pulse" /> : <Plus size={14} weight="bold" />}
                      </div>
                    </div>

                    {showCategoryDropdown && txForm.name.trim() && (
                      <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="absolute top-[calc(100%+8px)] left-0 right-0 bg-white border border-gray-100 rounded-lg shadow-xl z-50 overflow-hidden"
                      >
                        <div className="p-2 border-b border-gray-50 flex flex-col gap-2 bg-gray-50/50">
                          <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest px-1">Select an option or create one</span>
                          <input
                            autoFocus
                            type="text"
                            placeholder="Search for an option..."
                            value={catSearch}
                            onChange={(e) => setCatSearch(e.target.value)}
                            className="w-full px-3 py-2 bg-white border border-gray-200 rounded-md text-xs font-medium outline-none focus:ring-2 focus:ring-[#171717]/10"
                          />
                        </div>
                        <div className="max-h-[200px] overflow-y-auto py-2">
                          <div className="px-3 pb-2 mb-2 border-b border-gray-50">
                            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Suggestions</span>
                          </div>
                          {filteredCategories.length > 0 ? (
                            filteredCategories.map((cat, idx) => (
                              <button
                                key={idx}
                                onClick={() => {
                                  setTxForm({ ...txForm, category: cat })
                                  setShowCategoryDropdown(false)
                                }}
                                className="w-full text-left px-4 py-2 text-sm font-bold text-gray-600 hover:bg-gray-50 transition-colors flex items-center justify-between group"
                              >
                                <span>{cat}</span>
                                <Check size={14} className="opacity-0 group-hover:opacity-100 text-emerald-500" />
                              </button>
                            ))
                          ) : (
                            <div className="px-4 py-2 text-xs text-gray-400 italic">No exact matches...</div>
                          )}
                        </div>

                        <div className="border-t border-gray-100 p-2 bg-gray-50/50 space-y-1">
                          {catSearch && !existingCategories.some(c => c.toLowerCase() === catSearch.toLowerCase()) && (
                            <button
                              onClick={() => {
                                setTxForm({ ...txForm, category: catSearch });
                                setShowCategoryDropdown(false);
                              }}
                              className="w-full flex items-center gap-2 px-3 py-2 bg-white border border-gray-100 rounded-md shadow-sm text-xs font-bold text-[#171717] hover:bg-gray-50 transition-colors"
                            >
                              <Plus size={12} weight="bold" className="text-gray-400" />
                              <span>Create: "{catSearch}"</span>
                            </button>
                          )}
                          {!isAlreadyMapped && txForm.name.length > 2 && txForm.category && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setMappingForm({ itemName: txForm.name, category: txForm.category });
                                addMapping();
                                setShowCategoryDropdown(false);
                              }}
                              className="w-full flex items-center gap-2 px-3 py-2 bg-[#171717] rounded-md shadow-sm text-xs font-bold text-white hover:bg-black transition-colors"
                            >
                              <Sparkle size={12} weight="fill" className="text-amber-400" />
                              <span>Set Auto-Select for "{txForm.name}"</span>
                            </button>
                          )}
                        </div>
                      </motion.div>
                    )}
                  </div>
                  <button
                    onClick={addTransaction} disabled={loading}
                    className={`flex items-center justify-center gap-2 px-6 py-3.5 bg-[#171717] hover:bg-black text-white rounded-md text-[12px] font-bold transition-all ${loading ? 'opacity-50' : 'active:scale-95'} lg:mt-0`}
                  >
                    {loading ? 'Processing...' : (
                      <>
                        <Plus size={16} weight="bold" />
                        <span>Add Log</span>
                      </>
                    )}
                  </button>
                </div>

                <div className="space-y-1.5 pt-2 border-t border-gray-100">
                  <div className="flex items-center gap-2">
                    <div className="w-1 h-1 rounded-full bg-red-400 animate-pulse" />
                    <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Optional Note</label>
                  </div>
                  <input
                    type="text"
                    autoComplete="off"
                    placeholder="Add details about this spend..."
                    value={txForm.note}
                    onChange={(e) => setTxForm({ ...txForm, note: e.target.value })}
                    className="w-full px-4 py-2 bg-transparent text-sm font-medium outline-none focus:text-red-500 transition-all placeholder:text-gray-300"
                  />
                </div>
              </div>

              {/* Transactions Table */}
              <div className="mt-4">
                {monthTxs
                  .filter(tx => {
                    if (activeTab === 'Expenses') return !isIncomeCategory(tx.category)
                    if (activeTab === 'Income') return isIncomeCategory(tx.category)
                    return true
                  })
                  .map((tx) => {
                    const isIncome = isIncomeCategory(tx.category)
                    const dateObj = new Date(tx.created_at)

                    const CategoryIcon = ({ cat }: { cat: string }) => {
                      const c = cat.toLowerCase()

                      // Individual High-Fidelity 3D Assets
                      if (c.includes("food") || c.includes("eat") || c.includes("restaurant")) {
                        return (
                          <div className="w-10 h-10 rounded-xl bg-gray-50 flex items-center justify-center overflow-hidden border border-gray-100/50 shadow-sm transition-transform hover:scale-110">
                            <img src="/assets/icons/food.png" className="w-8 h-8 object-contain" alt="food" />
                          </div>
                        )
                      }
                      if (c.includes("commute") || c.includes("travel") || c.includes("car") || c.includes("uber") || c.includes("transport")) {
                        return (
                          <div className="w-10 h-10 rounded-xl bg-gray-50 flex items-center justify-center overflow-hidden border border-gray-100/50 shadow-sm transition-transform hover:scale-110">
                            <img src="/assets/icons/transport.png" className="w-8 h-8 object-contain" alt="transport" />
                          </div>
                        )
                      }

                      // Grid-Based Mapping (3x4 grid)
                      // Row 1: Shopping(0), Home(1), Entertainment(2), Money(3)
                      // Row 2: Bill(4), Health(5), Education(6), Gift(7)
                      // Row 3: Tech(8), Warning(9), Investment(10), Wallet(11)
                      let gridIdx = 11; // Default: Wallet

                      if (c.includes("clothing") || c.includes("shopping") || c.includes("dress") || c.includes("fashion")) gridIdx = 0;
                      else if (c.includes("house") || c.includes("rent") || c.includes("home") || c.includes("flat")) gridIdx = 1;
                      else if (c.includes("entertainment") || c.includes("movie") || c.includes("film") || c.includes("show")) gridIdx = 2;
                      else if (c.includes("income") || c.includes("salary") || c.includes("bonus") || c.includes("return")) gridIdx = 3;
                      else if (c.includes("bill") || c.includes("utility") || c.includes("electric") || c.includes("water") || c.includes("lightning")) gridIdx = 4;
                      else if (c.includes("health") || c.includes("fitness") || c.includes("gym") || c.includes("hospital") || c.includes("heart")) gridIdx = 5;
                      else if (c.includes("education") || c.includes("book") || c.includes("school") || c.includes("college")) gridIdx = 6;
                      else if (c.includes("gift") || c.includes("present") || c.includes("donation")) gridIdx = 7;
                      else if (c.includes("gadget") || c.includes("tech") || c.includes("laptop") || c.includes("phone")) gridIdx = 8;
                      else if (c.includes("unexpected") || c.includes("emergency") || c.includes("warning")) gridIdx = 9;
                      else if (c.includes("investment") || c.includes("stock") || c.includes("market") || c.includes("profit")) gridIdx = 10;

                      const row = Math.floor(gridIdx / 4);
                      const col = gridIdx % 4;

                      return (
                        <div className="w-10 h-10 rounded-xl bg-gray-50 flex items-center justify-center overflow-hidden border border-gray-100/50 shadow-sm group-hover:scale-110 transition-transform">
                          <div
                            style={{
                              backgroundImage: 'url(/assets/icons/full_grid.png)',
                              backgroundSize: '400% 300%', // 4 columns, 3 rows
                              backgroundPosition: `${(col * 100) / 3}% ${(row * 100) / 2}%`,
                              width: '32px',
                              height: '32px'
                            }}
                            className="bg-no-repeat"
                          />
                        </div>
                      )
                    }

                    return (
                      <motion.div
                        layout
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        key={tx.id}
                        className="group flex flex-col sm:flex-row items-center justify-between p-4 sm:p-5 bg-white border border-gray-100/80 rounded-lg mb-3 hover:border-gray-300 transition-all duration-300 relative"
                      >
                        <div className="flex items-center gap-4 w-full sm:w-1/3 min-w-0">
                          {/* Compact Icon Box */}
                          <CategoryIcon cat={tx.category} />

                          <div className="flex flex-col min-w-0">
                            <span className="font-serif font-bold text-[17px] text-[#171717] tracking-tight">
                              {tx.name}
                            </span>
                            <span className="text-[11px] font-medium text-gray-400">
                              {dateObj.toLocaleDateString('en-GB', { day: '2-digit', month: 'short' })} • {tx.category}
                            </span>
                            {tx.note && (
                              <span className="text-[11px] text-gray-500 italic mt-0.5">
                                {tx.note}
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Centered Status (As seen in 2nd image) */}
                        <div className="hidden sm:flex items-center justify-center flex-1">
                          <div className="flex items-center gap-2 px-3 py-1">
                            <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                            <span className="text-[11px] font-bold text-gray-600 uppercase tracking-wider">
                              Completed
                            </span>
                          </div>
                        </div>

                        <div className="flex flex-col items-end w-full sm:w-1/3 mt-3 sm:mt-0">
                          <span className="font-display font-bold text-[18px] text-[#171717] tracking-tight">
                            {isIncome ? '+' : '-'}₹{Number(tx.amount).toLocaleString('en-IN')}
                          </span>
                          <span className="text-[11px] font-bold text-gray-300 uppercase tracking-widest">
                            {isIncome ? 'Direct Deposit' : 'Digital Payment'}
                          </span>
                        </div>

                        {/* Compact Delete Trigger */}
                        <button
                          onClick={(e) => { e.stopPropagation(); deleteTransaction(tx.id); }}
                          className="absolute right-2 top-2 opacity-0 group-hover:opacity-100 p-1 text-gray-300 hover:text-red-400 transition-all border border-transparent hover:border-gray-100 rounded-md"
                        >
                          <X size={14} weight="bold" />
                        </button>
                      </motion.div>
                    )
                  })}

                {monthTxs.length === 0 && (
                  <div className="py-20 text-center text-gray-400 font-bold text-sm bg-gray-50/20 rounded-lg border border-dashed border-gray-200 mt-4">
                    No transactions this month.
                  </div>
                )}
              </div>
            </motion.div>
          </div>
        </div>
      </div>
    </div>

      {/* PRINT-ONLY STATEMENT (PORTFOLIO-GRADE FINANCIAL REPORT) */}
      <div id="expense-statement-print" className="hidden print:block fixed inset-0 bg-white z-[9999] overflow-auto p-12 text-[#1F2937] font-sans">
        <style dangerouslySetInnerHTML={{
          __html: `
          @media print {
            body * { visibility: hidden; }
            #expense-statement-print, #expense-statement-print * { visibility: visible; }
            #expense-statement-print { 
              position: absolute !important; 
              left: 0 !important; 
              top: 0 !important; 
              width: 100% !important; 
              height: auto !important;
              padding: 15mm !important;
              background: white !important;
              display: block !important;
            }
            @page { margin: 0; size: A4; }
          }
        `}} />

        {/* Header Section */}
        <div className="flex justify-between items-start mb-2 border-b border-gray-100 pb-10">
          <div>
            <h1 className="text-[38px] font-bold text-[#111827] tracking-tight mb-2 uppercase leading-none">Expenditure Statement</h1>
            <h2 className="text-xl font-bold text-[#374151]">Account: <span className="text-[#111827]">{userName}</span></h2>
          </div>
          <div className="text-right text-[12px] font-bold text-gray-400 uppercase tracking-[0.1em] space-y-1 pt-2">
            <p>DATE ISSUED: <span className="text-[#111827]">{new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }).toUpperCase()}</span></p>
            <p>STATEMENT ID: <span className="text-[#111827]">#EXP-{viewDate.getMonth() + 1}{viewDate.getFullYear().toString().slice(-2)}B</span></p>
          </div>
        </div>

        {/* Section 1: Income Flows (Like Asset Holdings) */}
        <div className="mb-10">
          <h3 className="text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-6 border-b border-gray-50 pb-2">MONTHLY REVENUE / INCOME FLOWS</h3>
          <table className="w-full text-left">
            <thead>
              <tr className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                <th className="py-2 px-0">SOURCE DESCRIPTION</th>
                <th className="py-2 px-0 text-center">CATEGORY</th>
                <th className="py-2 px-0 text-center">STATUS</th>
                <th className="py-2 px-0 text-right">CREDIT AMOUNT</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              <tr className="text-[14px] font-medium text-[#374151]">
                <td className="py-4 px-0 font-bold text-[#111827]">Monthly Salary (Primary)</td>
                <td className="py-4 px-0 text-center text-gray-400">Regular</td>
                <td className="py-4 px-0 text-center text-emerald-600 font-bold">Received</td>
                <td className="py-4 px-0 text-right font-bold text-[#111827]">Rs. {Number(income.salary || 0).toLocaleString('en-IN')}</td>
              </tr>
              {Number(income.sideHustle) > 0 && (
                <tr className="text-[14px] font-medium text-[#374151]">
                  <td className="py-4 px-0 font-bold text-[#111827]">Side Hustle (Secondary)</td>
                  <td className="py-4 px-0 text-center text-gray-400">Variable</td>
                  <td className="py-4 px-0 text-center text-emerald-600 font-bold">Received</td>
                  <td className="py-4 px-0 text-right font-bold text-[#111827]">Rs. {Number(income.sideHustle || 0).toLocaleString('en-IN')}</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Section 2: Fixed Obligations (Like Bonds/Fixed Income) */}
        <div className="mb-10">
          <h3 className="text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-6 border-b border-gray-50 pb-2">MANDATORY FIXED OBLIGATIONS</h3>
          <table className="w-full text-left">
            <thead>
              <tr className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                <th className="py-2 px-0">OBLIGATION</th>
                <th className="py-2 px-0 text-center">TYPE</th>
                <th className="py-2 px-0 text-center">CYCLE</th>
                <th className="py-2 px-0 text-right">DEBIT AMOUNT</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {[
                { name: 'House Rent', amount: fixedExpenses.rent },
                { name: 'Cook Cost', amount: fixedExpenses.cook },
                { name: 'Travel Allowance', amount: fixedExpenses.travel },
                { name: 'Insurance Premium', amount: fixedExpenses.insurance },
                { name: 'Communication/Utility Bill', amount: fixedExpenses.communication }
              ].filter(e => Number(e.amount) > 0).map((e, i) => (
                <tr key={i} className="text-[14px] font-medium text-[#374151]">
                  <td className="py-4 px-0 font-bold text-[#111827]">{e.name}</td>
                  <td className="py-4 px-0 text-center text-gray-400">Fixed</td>
                  <td className="py-4 px-0 text-center">Monthly</td>
                  <td className="py-4 px-0 text-right font-bold text-[#111827]">Rs. {Number(e.amount).toLocaleString('en-IN')}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Section 3: Variable Log (Full Activity Log Style) */}
        <div className="mb-10">
          <h3 className="text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-6 border-b border-gray-50 pb-2">DETAILED ACTIVITY & EXPENDITURE LOG</h3>
          <table className="w-full text-left">
            <thead>
              <tr className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                <th className="py-2 px-0 font-bold">DATE</th>
                <th className="py-2 px-0 font-bold">IDENTIFIER</th>
                <th className="py-2 px-0 font-bold">CATEGORY</th>
                <th className="py-2 px-0 font-bold text-center">QTY</th>
                <th className="py-2 px-0 text-right font-bold">AMOUNT</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {monthTxs.length > 0 ? monthTxs.map((tx, i) => (
                <tr key={i} className="text-[13px] text-gray-600">
                  <td className="py-4 px-0">{new Date(tx.created_at).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}</td>
                  <td className="py-4 px-0">
                    <div className="font-bold text-[#111827]">{tx.name}</div>
                    {tx.note && <div className="text-[10px] text-gray-400 font-medium italic leading-relaxed">{tx.note}</div>}
                  </td>
                  <td className="py-4 px-0 uppercase text-[10px] tracking-tight">{tx.category}</td>
                  <td className="py-4 px-0 text-center">1</td>
                  <td className="py-4 px-0 text-right font-bold text-[#111827]">Rs. {Number(tx.amount).toLocaleString('en-IN')}</td>
                </tr>
              )) : (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-gray-300 italic text-xs tracking-widest">NO VARIABLE TRANSACTIONS RECORDED FOR THIS PERIOD</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Summary Footer Row (Portfolio Summary Style) */}
        <div className="flex justify-between items-center pt-8 border-t border-gray-100 mb-8 break-inside-avoid">
          <div className="space-y-1 text-left">
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">TOTAL MONTHLY EXPENDITURE</p>
            <p className="text-[24px] font-bold text-[#111827]">Rs. {(totalFixed + monthTxs.reduce((sum, tx) => sum + Number(tx.amount), 0)).toLocaleString('en-IN')}</p>
            <div className="text-[9px] text-gray-400">
              Transactions: {monthTxs.length} | Fixed Obligations: 5 Active
            </div>
          </div>
          <div className="space-y-1 text-center">
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">MONTHLY SAVINGS REVENUE</p>
            <p className={`text-[24px] font-bold ${availableBudget >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
              {availableBudget >= 0 ? '+' : '-'}Rs. {Math.abs(availableBudget).toLocaleString('en-IN')}
            </p>
            <div className="text-[9px] text-gray-400">
              {((availableBudget / totalIncome) * 100).toFixed(1)}% Yield status
            </div>
          </div>
          <div className="space-y-1 text-right">
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">NET CLOSING BALANCE</p>
            <p className="text-[32px] font-extrabold text-[#F43F5E] leading-none mb-1">Rs. {availableBudget.toLocaleString('en-IN')}</p>
            <div className="text-[9px] text-gray-400 font-bold uppercase tracking-widest">Verified Digital Audit</div>
          </div>
        </div>

        <div className="mt-12 pt-6 border-t border-gray-50 text-center opacity-30">
          <p className="text-[8px] font-black text-gray-400 uppercase tracking-[0.4em]">PROPRIETARY REPORT — CONFIDENTIAL MANAGEMENT DASHBOARD — © 2026</p>
        </div>
      </div>
    </>
  )
}
