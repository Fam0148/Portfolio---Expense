import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import { supabase } from "../../lib/supabase"
import { LogOut, FileText } from "lucide-react"

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
  const [txForm, setTxForm] = useState({ name: "", amount: "", category: "Variable Expense" })
  const [mappingForm, setMappingForm] = useState({ itemName: "", category: "Activity" })
  const [activeTab, setActiveTab] = useState('All')
  const [showCatManager, setShowCatManager] = useState(false)
  const [isEditingIncome, setIsEditingIncome] = useState(false)
  const [isEditingFixed, setIsEditingFixed] = useState(false)

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

  const totalIncome = Number(income.salary || 0) + Number(income.sideHustle || 0)
  const totalFixed = Number(fixedExpenses.rent || 0) +
    Number(fixedExpenses.cook || 0) +
    Number(fixedExpenses.travel || 0) +
    Number(fixedExpenses.insurance || 0) +
    Number(fixedExpenses.communication || 0)

  const totalVariable = transactions
    .filter(tx => tx.category !== 'Income/Return' && tx.category !== 'Investment')
    .reduce((sum, tx) => sum + Number(tx.amount), 0)

  const totalInvestments = transactions
    .filter(tx => tx.category === 'Investment')
    .reduce((sum, tx) => sum + Number(tx.amount), 0)

  const totalIncomeReturns = transactions
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
    } catch (err) {
      console.error('Error saving config:', err)
      localStorage.setItem('user_finance_config', JSON.stringify({ income, fixedExpenses }))
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

    const newTx = {
      name: txForm.name,
      amount: Number(txForm.amount),
      category: txForm.category,
      created_at: new Date().toISOString()
    }

    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        const { data, error } = await supabase
          .from('transactions')
          .insert({ ...newTx, user_id: user.id })
          .select()
          .single()

        if (error) throw error
        setTransactions([data, ...transactions])
      } else {
        const localTxs = [...transactions, { ...newTx, id: Date.now() }]
        setTransactions(localTxs)
        localStorage.setItem('user_transactions', JSON.stringify(localTxs))
      }
      setTxForm({ name: "", amount: "", category: "Variable Expense" })
    } catch (err) {
      console.error('Error adding transaction:', err)
      alert("Failed to save transaction.")
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
        const { data, error } = await supabase
          .from('category_mappings')
          .insert({ item_name: mappingForm.itemName, category: mappingForm.category, user_id: user.id })
          .select().single()
        if (error) throw error
        setCategoryMappings([data, ...categoryMappings])
      } else {
        const newM = { id: Date.now(), item_name: mappingForm.itemName, category: mappingForm.category }
        const all = [newM, ...categoryMappings]
        setCategoryMappings(all)
        localStorage.setItem('user_category_mappings', JSON.stringify(all))
      }
      setMappingForm({ itemName: "", category: "Activity" })
    } catch (err) { console.error(err) } finally { setLoading(false) }
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

          <div className="flex items-center gap-2 self-center sm:self-auto">
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
              <LogOut size={14} className="text-gray-400 group-hover:text-gray-500 transition-colors" />
              Sign Out
            </button>
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
            <div className="flex flex-col gap-1 mb-8">
              <h2 className="text-2xl font-serif font-bold text-[#171717]">Monthly Cashflow</h2>
              <p className="text-sm text-gray-500">Configure your primary and secondary income streams.</p>
            </div>

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
          </div>

          {/* Mandatory Monthly Expenses Card */}
          <div className="bg-white p-6 sm:p-8 rounded-3xl border border-gray-200 relative overflow-hidden group">
            <div className="flex flex-col gap-1 mb-8">
              <h2 className="text-2xl font-serif font-bold text-[#171717]">Fixed Monthly Expenses</h2>
              <p className="text-sm text-gray-500">Essential obligations to be deducted from your total income.</p>
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
            </div>
          </div>

          {/* Daily Spend Log & Transactions Table */}
          <div className="bg-white p-6 sm:p-8 rounded-3xl border border-gray-200 relative overflow-hidden group">
            <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-8">
              <div className="flex flex-col gap-1">
                <div className="flex items-center gap-3">
                  <h2 className="text-2xl font-serif font-bold text-[#171717]">Daily Spending Logs</h2>
                  <button
                    onClick={() => setShowCatManager(!showCatManager)}
                    className={`px-3 py-1 rounded-lg text-[10px] font-bold border transition-all ${showCatManager ? 'bg-gray-50 border-gray-200 text-gray-500' : 'bg-gray-50 border-gray-200 text-gray-500 hover:bg-gray-100'}`}
                  >
                    {showCatManager ? 'Close Rules' : 'Categorization Rules'}
                  </button>
                </div>
                <p className="text-sm text-gray-500">Log every minor and major expense to track exactly where your money goes.</p>
              </div>
              <div className="flex items-center gap-2 bg-gray-50 p-1 rounded-xl">
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
            </div>

            {/* Category Mapping Manager (Slide down section) */}
            {showCatManager && (
              <motion.div
                initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }}
                className="mb-10 p-6 bg-gray-50/30 border border-gray-200/50 rounded-2xl overflow-hidden"
              >
                <div className="flex flex-col gap-1 mb-6">
                  <h3 className="text-lg font-serif font-bold text-[#171717]">Automatic Rules</h3>
                  <p className="text-xs text-gray-500">Define which keywords automatically trigger a specific category.</p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest ml-1">Keyword (Item Name)</label>
                    <input type="text" placeholder="e.g. Swiggy, Netflix..."
                      value={mappingForm.itemName} onChange={(e) => setMappingForm({ ...mappingForm, itemName: e.target.value })}
                      className="w-full px-4 py-3 bg-white border border-gray-200/50 rounded-xl text-sm font-medium outline-none focus:ring-2 focus:ring-gray-200 transition-all" />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest ml-1">Auto-Select Category</label>
                    <select
                      value={mappingForm.category} onChange={(e) => setMappingForm({ ...mappingForm, category: e.target.value })}
                      className="w-full px-4 py-3 bg-white border border-gray-200/50 rounded-xl text-sm font-medium outline-none appearance-none cursor-pointer"
                    >
                      {["Activity", "Cash Withdrawal", "Gadgets", "Entertainment", "Charges", "Clothing", "Commute", "Food", "Variable Expense", "Investment", "Income/Return"].map(c => (
                        <option key={c}>{c}</option>
                      ))}
                    </select>
                  </div>
                  <div className="flex items-end">
                    <button onClick={addMapping} className="w-full py-3 bg-[#171717] text-white rounded-xl text-[11px] font-bold hover:bg-rose-700 transition-all">
                      Add Mapping Rule
                    </button>
                  </div>
                </div>

                <div className="max-h-60 overflow-y-auto pr-2 custom-scrollbar">
                  <table className="w-full text-left">
                      <tbody className="divide-y divide-gray-200/50">
                      {categoryMappings.map((m) => (
                        <tr key={m.id} className="text-sm">
                          <td className="py-3 font-bold text-gray-700">{m.item_name}</td>
                          <td className="py-3 text-gray-500 font-medium">{m.category}</td>
                          <td className="py-3 text-right">
                            <button onClick={() => deleteMapping(m.id)} className="text-rose-300 hover:text-gray-500 transition-colors">✕</button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </motion.div>
            )}

            {/* Add Transaction Inline Form */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-10 p-5 bg-gray-50/50 border border-gray-200 rounded-2xl items-end">
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
                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest ml-1">Category</label>
                <select
                  value={txForm.category} onChange={(e) => setTxForm({ ...txForm, category: e.target.value })}
                  className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl text-sm font-medium outline-none focus:ring-2 focus:ring-gray-100 transition-all appearance-none cursor-pointer"
                >
                  {["Variable Expense", "Investment", "Food", "Commute", "Entertainment", "Clothing", "Gadgets", "Charges", "Cash Withdrawal", "Activity", "Unexpected", "Income/Return"].map(c => (
                    <option key={c}>{c}</option>
                  ))}
                </select>

              </div>
              <button
                onClick={addTransaction} disabled={loading}
                className={`px-6 py-3 bg-[#171717] text-white rounded-xl text-[12px] font-bold transition-all ${loading ? 'opacity-50' : 'hover:bg-black active:scale-95'}`}
              >
                {loading ? 'Adding...' : 'Add Log'}
              </button>
            </div>

            {/* Transactions Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-left border-separate border-spacing-y-2">
                <thead>
                  <tr className="text-[10px] font-bold text-gray-400 uppercase tracking-widest px-4">
                    <th className="pb-2 pl-4">Spent On / From</th>
                    <th className="pb-2 text-center">Amount</th>
                    <th className="pb-2 text-center">Date & Time</th>
                    <th className="pb-2 text-right pr-4">Type</th>
                  </tr>
                </thead>
                <tbody>
                  {transactions
                    .filter(tx => {
                      if (activeTab === 'Expenses') return tx.category !== 'Income/Return'
                      if (activeTab === 'Income') return tx.category === 'Income/Return'
                      return true
                    })
                    .map((tx) => {
                      const isIncome = tx.category === 'Income/Return'
                      const iconMap: any = {
                        "Variable Expense": "💸",
                        "Investment": "📈",
                        "Unexpected": "⚠️",
                        "Income/Return": "💰"
                      }

                      return (
                        <motion.tr
                          layout
                          initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }}
                          key={tx.id} className="group hover:bg-gray-50/80 transition-all duration-300"
                        >
                          <td className="py-4 pl-4 bg-gray-50/30 group-hover:bg-transparent rounded-l-2xl border-y border-l border-gray-200/50">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 rounded-full bg-white border border-gray-200 flex items-center justify-center text-lg">
                                {iconMap[tx.category] || "💸"}
                              </div>
                              <span className="font-bold text-sm text-[#171717]">{tx.name}</span>
                            </div>
                          </td>
                          <td className="py-4 text-center bg-gray-50/30 group-hover:bg-transparent border-y border-gray-200/50">
                            <span className={`font-display font-bold text-[15px] ${isIncome ? 'text-emerald-600' : 'text-gray-500'}`}>
                              {isIncome ? '+' : '-'}₹{Number(tx.amount).toLocaleString('en-IN')}
                            </span>
                          </td>
                          <td className="py-4 text-center bg-gray-50/30 group-hover:bg-transparent border-y border-gray-200/50 font-sans">
                            <span className="text-[11px] font-bold text-gray-400">
                              {new Date(tx.created_at).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' })}, {new Date(tx.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </span>
                          </td>
                          <td className="py-4 pr-4 text-right bg-gray-50/30 group-hover:bg-transparent rounded-r-2xl border-y border-r border-gray-200/50 relative">
                            <div className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold ${isIncome ? 'bg-emerald-50 text-emerald-600' : 'bg-gray-50 text-gray-500'}`}>
                              <div className={`w-1 h-1 rounded-full ${isIncome ? 'bg-emerald-500' : 'bg-[#171717]'}`} />
                              {isIncome ? 'Income' : 'Expense'}
                            </div>
                            <button
                              onClick={() => deleteTransaction(tx.id)}
                              className="absolute -right-2 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 p-2 text-gray-300 hover:text-gray-500 transition-all"
                            >
                              ✕
                            </button>
                          </td>
                        </motion.tr>
                      )
                    })}
                  {transactions.length === 0 && (
                    <tr>
                      <td colSpan={4} className="py-20 text-center text-gray-400 font-bold text-sm bg-gray-50/20 rounded-2xl border border-dashed border-gray-200">
                        No transactions logged yet. Start mastery today.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
