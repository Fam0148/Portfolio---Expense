import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import { PortfolioChart } from "./PortfolioChart"
import { NumberTicker } from "./NumberTicker"
import { AssetManagement } from "./AssetManagement"
import { supabase } from "../../lib/supabase"
import { LogOut, FileText } from "lucide-react"
import { StatementView } from "./StatementView"




const PortfolioCard = ({ title, numericValue, illustration, profitPercent, delay = 0, customDisplay = false, stats, className = "" }: any) => {
  const isNegative = !customDisplay && numericValue < 0
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: delay, ease: [0.21, 0.47, 0.32, 0.98] }}
      className={`bg-white p-5 sm:p-6 rounded-2xl border border-gray-100/80 shadow-sm flex flex-row items-center justify-between gap-4 group transition-all duration-300 ${className}`}
    >
      <div className="flex flex-col space-y-1.5 flex-1 min-w-0">
        <h3 className="font-serif text-[16px] text-gray-500 leading-tight truncate">
          {title}
        </h3>
        {customDisplay ? (
          <div className="flex flex-col gap-3 mt-1">
              <div className="flex flex-row items-center gap-6">
                <div className="flex flex-row items-baseline gap-2">
                  <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Stocks</span>
                  <span className="text-2xl font-display font-bold text-blue-600">{stats?.stockWeight.toFixed(0)}%</span>
                </div>
                <div className="h-6 w-[1px] bg-gray-100" />
                <div className="flex flex-row items-baseline gap-2">
                  <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Bonds</span>
                  <span className="text-2xl font-display font-bold text-green-600">{stats?.bondWeight.toFixed(0)}%</span>
                </div>
              </div>
            <div className="w-full h-2 bg-gray-50 rounded-full overflow-hidden flex">
              <div className="h-full bg-blue-600" style={{ width: `${stats?.stockWeight}%` }} />
              <div className="h-full bg-green-500" style={{ width: `${stats?.bondWeight}%` }} />
            </div>
          </div>
        ) : (
          <div className="flex flex-row items-baseline gap-2 mt-1">
            <div className="flex items-baseline font-display font-bold text-[26px] sm:text-[30px] tracking-tight text-[#171717]">
              <span className="text-[18px] sm:text-[22px] mr-1 font-bold">{isNegative ? '-₹' : '₹'}</span>
              <NumberTicker value={Math.abs(numericValue)} />
            </div>
            {profitPercent && (
              <span className={`text-[11px] font-display font-normal px-2 py-0.5 rounded-full ${isNegative ? 'text-rose-600 bg-rose-50' : 'text-green-600 bg-green-50'}`}>
                {profitPercent}
              </span>
            )}
          </div>
        )}
      </div>

      <div className="w-16 h-16 sm:w-20 sm:h-20 md:w-24 md:h-24 flex-shrink-0 flex items-center justify-center relative">
        <img
          src={illustration}
          alt={title}
          className="w-full h-full object-contain transition-all duration-500 hover:scale-105 rotate-[5deg]"
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
    profitPercent: 0,
    stockYield: 0,
    bondProfit: 0,
    bondYield: 0,
    stockWeight: 0,
    bondWeight: 0,
    historicalData: [] as any[],
    totalInvested: 0,
    stockInvested: 0,
    bondInvested: 0,
    bondProfitDetails: {} as Record<string, number>,
    userId: ""
  })

  const [stocksData, setStocksData] = useState<any[]>([])

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
        let interestIncome = 0
        let bondProfitAccrued = 0
        let totalBondInvested = 0
        let totalBondValue = 0 // Principal + Repayments
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
          if (type === 'BOND' && s.ytm) {
            const ytm = parseFloat(s.ytm)
            if (!isNaN(ytm)) {
              totalBondInvested += totalAtPurchase
              interestIncome += (totalAtCurrent * (ytm / 100)) / 12

              // Calculate repayment: increment each month on the 10th
              const [pYear, pMonth, pDay] = s.purchase_date.split('-').map(Number);
              let monthsCounted = 0
              let tempDate = new Date(pYear, pMonth - 1, 10)

              if (pDay >= 10) {
                tempDate.setMonth(tempDate.getMonth() + 1)
              }

              while (tempDate <= now) {
                monthsCounted++
                tempDate.setMonth(tempDate.getMonth() + 1)
              }

              const accrued = totalAtPurchase * (ytm / 100) * (monthsCounted / 12)
              bondProfitAccrued += accrued
              totalBondValue += totalAtPurchase + accrued
            }
          }
        })

        const stockProfitValue = stockCurrent - stockInvested
        const sYield = stockInvested > 0 ? (stockProfitValue / stockInvested) * 100 : 0
        const bYield = totalBondInvested > 0 ? (bondProfitAccrued / totalBondInvested) * 100 : 0

        // Total Value = Market Value of Stocks + Invested Principal of Bonds + Bond Repayments (Interest)
        const finalTotalValue = totalCurrent + bondProfitAccrued
        const pPercent = totalInvested > 0 ? ((finalTotalValue - totalInvested) / totalInvested) * 100 : 0

        // --- Calculate Historical Data ---
        const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
        const currentYear = now.getFullYear();
        
        const historicalData = months.map((monthLabel, mIdx) => {
          let monthValue = 0;
          const monthEndDate = new Date(currentYear, mIdx + 1, 0); // Last day of month

          withPrices.forEach(s => {
            const pDate = new Date(s.purchase_date);
            if (pDate <= monthEndDate) {
              const totalAtPurchase = s.purchase_price * s.quantity;
              monthValue += totalAtPurchase;

              // Accrue bond interest up to this specific month
              if (s.asset_type_c === 'BOND' && s.ytm) {
                const ytm = parseFloat(s.ytm);
                const [buyYear, buyMonth, buyDay] = s.purchase_date.split('-').map(Number);
                let firstRepaymentDate = new Date(buyYear, buyMonth - 1, 10);
                if (buyDay >= 10) firstRepaymentDate.setMonth(firstRepaymentDate.getMonth() + 1);

                let monthsPassedInPoint = 0;
                let tempDate = new Date(firstRepaymentDate);
                while (tempDate <= monthEndDate && tempDate <= now) {
                  monthsPassedInPoint++;
                  tempDate.setMonth(tempDate.getMonth() + 1);
                }
                monthValue += totalAtPurchase * (ytm / 100) * (monthsPassedInPoint / 12);
              }
            }
          });
          return { label: monthLabel, value: Math.round(monthValue), isFuture: mIdx > now.getMonth() };
        }).filter(d => !d.isFuture);

        setStats({
          totalValue: finalTotalValue,
          totalProfit: stockProfitValue,
          monthlyIncome: interestIncome,
          profitPercent: pPercent,
          stockYield: sYield,
          bondProfit: bondProfitAccrued,
          bondYield: bYield,
          stockWeight: finalTotalValue > 0 ? (stockCurrent / finalTotalValue) * 100 : 0,
          bondWeight: finalTotalValue > 0 ? (totalBondValue / finalTotalValue) * 100 : 0,
          historicalData,
          totalInvested,
          stockInvested,
          bondInvested: totalBondInvested,
          bondProfitDetails: withPrices.reduce((acc, s) => {
            if (s.asset_type_c === 'BOND') {
               const ytm = parseFloat(s.ytm)
               const [pYear, pMonth, pDay] = s.purchase_date.split('-').map(Number);
               let count = 0; let tempDate = new Date(pYear, pMonth - 1, 10);
               if (pDay >= 10) tempDate.setMonth(tempDate.getMonth() + 1);
               while (tempDate <= now) { count++; tempDate.setMonth(tempDate.getMonth() + 1); }
               acc[s.id] = (s.purchase_price * s.quantity * (ytm / 100)) * (count / 12);
            }
            return acc;
          }, {} as any),
          userId: user.id
        })
        setStocksData(withPrices)
      } catch (err) { console.error('Error fetching stats:', err) }
    }
    fetchStats()
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
    },
    {
      title: "Asset Allocation",
      numericValue: 0,
      illustration: "/assets/asset allocation.png",
      customDisplay: true,
      delay: 0.5
    }
  ]

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 pt-8 sm:pt-12 min-h-screen font-sans selection:bg-blue-50 selection:text-blue-600">
      <div className="no-print">
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
          <p className="text-gray-500 text-xs sm:text-sm font-sans mt-1">Track your stocks and bonds in one place.</p>
        </div>

        <div className="flex items-center gap-3 sm:mb-1">
          <button
            onClick={() => { setTimeout(() => { window.print(); }, 500); }}
            className="flex items-center justify-center gap-2.5 px-5 py-2.5 rounded-lg bg-[#111827] text-white hover:bg-black transition-all font-bold text-sm active:scale-95 group shadow-sm border border-[#111827]"
          >
            <FileText size={16} className="text-gray-300 group-hover:text-white transition-colors" />
            Export Statement
          </button>
          <button
            onClick={handleLogOut}
            className="flex items-center justify-center gap-2.5 px-5 py-2.5 rounded-lg bg-gray-50 border border-gray-100 text-gray-500 hover:text-rose-600 hover:bg-rose-50 hover:border-rose-100 transition-all font-bold text-sm active:scale-95 group shadow-sm"
          >
            <LogOut size={16} className="text-gray-400 group-hover:text-rose-500 transition-colors" />
            Sign Out
          </button>
        </div>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-10">
        {cards.map((card, idx) => {
          // If it's the last card (the 5th one), make it span the full width to fill the row
          const isLastCard = idx === cards.length - 1;

          return (
            <PortfolioCard
              key={idx}
              {...card}
              stats={stats}
              className={isLastCard ? "lg:col-span-2" : ""}
            />
          );
        })}
      </div>

      <motion.div
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5, delay: 0.5 }}
        className="mb-8"
      >
        <PortfolioChart 
          currentValue={stats.totalValue} 
          profitPercent={stats.profitPercent} 
          data={stats.historicalData}
        />
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

      {/* Printable Area (Managed via .print-only-container styles in StatementView) */}
      <div className="print-only-container">
        <StatementView userName={userName} stocks={stocksData} stats={stats} />
      </div>
    </div>
  )
}
