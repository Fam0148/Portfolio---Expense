import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import { PortfolioChart } from "./PortfolioChart"
import { NumberTicker } from "./NumberTicker"
import { AssetManagement } from "./AssetManagement"
import { supabase } from "../../lib/supabase"
import { LogOut } from "lucide-react"

interface PortfolioCardProps {
  title: string
  numericValue: number
  illustration: string
  profitPercent?: string
  delay?: number
}

const PortfolioCard = ({ title, numericValue, illustration, profitPercent, delay = 0 }: PortfolioCardProps) => {
  const isNegative = numericValue < 0
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: delay, ease: [0.21, 0.47, 0.32, 0.98] }}
      className="bg-white p-4 sm:p-6 rounded-[20px] border border-gray-100/80 shadow-sm flex flex-row items-center justify-between gap-4"
    >
      <div className="flex flex-col space-y-1.5 flex-1">
        <h3 className="font-serif text-[16px] text-gray-500 leading-tight">
          {title}
        </h3>
        <div className="flex items-baseline gap-2">
          <div className={`flex items-baseline font-display font-bold text-[28px] tracking-tight ${isNegative ? 'text-rose-500' : 'text-[#171717]'}`}>
            <span>{isNegative ? '-₹' : '₹'}</span>
            <NumberTicker value={Math.abs(numericValue)} />
          </div>
          {profitPercent && (
            <span className={`text-[11px] font-sans font-bold px-1.5 py-0.5 rounded-full ${isNegative ? 'text-rose-600 bg-rose-50' : 'text-green-600 bg-green-50'}`}>
              {profitPercent}
            </span>
          )}
        </div>
      </div>

      <div className="w-20 h-20 flex-shrink-0 flex items-center justify-center">
        <img
          src={illustration}
          alt={title}
          className="w-full h-full object-contain"
          onError={() => {
            console.error(`Failed to load asset: ${illustration}`);
          }}
        />
      </div>
    </motion.div>
  )
}

export const PortfolioOverview = () => {
  const [userName, setUserName] = useState<string>("there")

  const handleLogOut = async () => {
    await supabase.auth.signOut()
    window.location.href = '/' // Quick redirect
  }

  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        const name = user.user_metadata?.full_name || user.email?.split('@')[0]
        if (name) {
          // Capitalize first letter
          setUserName(name.charAt(0).toUpperCase() + name.slice(1))
        }
      }
    }
    getUser()
  }, [])

  const [stats, setStats] = useState({
    totalValue: 0,
    totalProfit: 0,
    monthlyIncome: 0,
    mfValue: 0,
    profitPercent: 0,
    stockYield: 0,
    bondProfit: 0,
    bondYield: 0
  })

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return
        const { data } = await supabase.from('stocks').select('*').eq('user_id', user.id)
        if (!data) return

        const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL
        const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY
        const FUNCTION_URL = `${SUPABASE_URL}/functions/v1/stock-search`

        // Fetch live prices in parallel
        const withPrices = await Promise.all(data.map(async (s) => {
          const type = s.asset_type || (s.ytm || s.tenure ? 'BOND' : 'STOCK')
          let current = s.purchase_price

          if (type !== 'BOND') {
            try {
              const sym = s.symbol.includes('.') ? s.symbol : `${s.symbol}.NS`
              const r = await fetch(`${FUNCTION_URL}?action=price&q=${encodeURIComponent(sym)}`,
                { headers: { apikey: SUPABASE_ANON_KEY, Authorization: `Bearer ${SUPABASE_ANON_KEY}` } })
              if (r.ok) {
                const d = await r.json()
                if (d?.price) current = d.price
              } else {
                const p = await fetch(`https://api.allorigins.win/raw?url=${encodeURIComponent(`https://query1.finance.yahoo.com/v8/finance/chart/${sym}?interval=1d&range=1d`)}`)
                const d = await p.json()
                const lp = d?.chart?.result?.[0]?.meta?.regularMarketPrice
                if (lp) current = parseFloat(lp)
              }
            } catch { /* skip */ }
          }
          return { ...s, current_p: current, asset_type_c: type }
        }))

        let totalInvested = 0
        let totalCurrent = 0
        let stockInvested = 0
        let stockCurrent = 0
        let mfVal = 0
        let interestIncome = 0
        let bondProfitAccrued = 0
        let totalBondInvested = 0
        const now = new Date()

        withPrices.forEach(s => {
          const type = s.asset_type_c
          const current = s.current_p
          const totalAtPurchase = s.purchase_price * s.quantity
          const totalAtCurrent = current * s.quantity

          totalInvested += totalAtPurchase
          totalCurrent += totalAtCurrent

          if (type === 'STOCK') {
            stockInvested += totalAtPurchase
            stockCurrent += totalAtCurrent
          }
          if (type === 'MF') mfVal += totalAtCurrent
          if (type === 'BOND' && s.ytm) {
            const ytm = parseFloat(s.ytm)
            if (!isNaN(ytm)) {
              totalBondInvested += totalAtPurchase
              interestIncome += (totalAtCurrent * (ytm / 100)) / 12
              // Accrued interest from purchase date to today
              const purchaseDate = new Date(s.purchase_date)
              const monthsElapsed = Math.max(0,
                (now.getFullYear() - purchaseDate.getFullYear()) * 12 +
                (now.getMonth() - purchaseDate.getMonth())
              )
              bondProfitAccrued += totalAtPurchase * (ytm / 100) * (monthsElapsed / 12)
            }
          }
        })

        const totalProfitVal = totalCurrent - totalInvested
        const pPercent = totalInvested > 0 ? (totalProfitVal / totalInvested) * 100 : 0

        const stockProfitValue = stockCurrent - stockInvested
        const sYield = stockInvested > 0 ? (stockProfitValue / stockInvested) * 100 : 0

        const bYield = totalBondInvested > 0 ? (bondProfitAccrued / totalBondInvested) * 100 : 0

        setStats({
          totalValue: totalCurrent,
          totalProfit: stockProfitValue,
          monthlyIncome: interestIncome,
          mfValue: mfVal,
          profitPercent: pPercent,
          stockYield: sYield,
          bondProfit: bondProfitAccrued,
          bondYield: bYield
        })
      } catch (err) { console.error('Error fetching stats:', err) }
    }
    fetchStats()
    // Refresh every 30s to match live price updates
    const interval = setInterval(fetchStats, 30000)
    return () => clearInterval(interval)
  }, [])

  const cards = [
    {
      title: "Total Portfolio Value",
      numericValue: stats.totalValue,
      illustration: "/assets/Total Portfolio.png",
      profitPercent: stats.profitPercent >= 0 ? `+${stats.profitPercent.toFixed(1)}%` : `${stats.profitPercent.toFixed(1)}%`,
      delay: 0.1
    },
    {
      title: "Total Stock Profit",
      numericValue: stats.totalProfit,
      illustration: "/assets/Stock Profit.png",
      profitPercent: `${stats.stockYield.toFixed(1)}% Yield`,
      delay: 0.2
    },
    {
      title: "Monthly Passive Income",
      numericValue: stats.monthlyIncome,
      illustration: "/assets/Passive inccome.png",
      delay: 0.3
    },
    {
      title: "Historic Bond Profits",
      numericValue: stats.bondProfit,
      illustration: "/assets/Bonds.png",
      profitPercent: `${stats.bondYield.toFixed(1)}% Return`,
      delay: 0.4
    }
  ]

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 pt-8 sm:pt-12 min-h-screen font-sans selection:bg-blue-50 selection:text-blue-600">
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
        className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-8 sm:mb-10 text-center sm:text-left"
      >
        <div className="flex flex-col space-y-0">
          <h1 className="text-[26px] sm:text-[32px] font-serif font-bold text-[#171717] leading-tight flex items-center justify-center sm:justify-start gap-2">
            Hi, {userName}
          </h1>
          <p className="text-gray-500 text-xs sm:text-sm font-sans mt-1">Track your stocks, bonds, and mutual funds in one place.</p>
        </div>

        <button
          onClick={handleLogOut}
          className="flex items-center justify-center gap-2.5 px-5 py-2.5 rounded-xl bg-gray-50 border border-gray-100 text-gray-500 hover:text-rose-600 hover:bg-rose-50 hover:border-rose-100 transition-all font-bold text-sm active:scale-95 group shadow-sm sm:mb-1"
        >
          <LogOut size={16} className="text-gray-400 group-hover:text-rose-500 transition-colors" />
          Sign Out
        </button>
      </motion.div>

      <div className="grid grid-cols-2 gap-3 mb-4 sm:mb-6">
        {cards.map((card, idx) => (
          <PortfolioCard key={idx} {...card} />
        ))}
      </div>

      <motion.div
        initial={{ opacity: 0, scale: 0.98 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5, delay: 0.5 }}
        className="mb-8"
      >
        <PortfolioChart currentValue={stats.totalValue} profitPercent={stats.profitPercent} />
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.7 }}
        className="pb-12"
      >
        <AssetManagement />
      </motion.div>
    </div>
  )
}
