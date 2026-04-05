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
      className={`bg-white p-5 sm:p-6 rounded-lg border border-gray-100/80 shadow-sm flex flex-row items-center justify-between gap-4 group transition-all duration-300 ${className}`}
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

export const PortfolioOverview = ({ onSwitch }: { onSwitch: (val: 'portfolio' | 'expense') => void }) => {
  const [userName, setUserName] = useState<string>("there")

  const handleLogOut = async () => {
    await supabase.auth.signOut()
    window.location.href = '/'
  }

  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        const name = user.user_metadata?.full_name || user.email?.split('@')[0]
        if (name) {
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

        const calculateAll = (withPrices: any[]) => {
          let totalInvested = 0
          let totalCurrentMarket = 0
          let stockInvested = 0
          let stockCurrent = 0
          let interestIncome = 0
          let bondProfitAccrued = 0
          let totalBondInvested = 0
          let totalBondValue = 0
          const now = new Date()

          withPrices.forEach(s => {
            const type = s.asset_type_c
            const current = s.current_p
            const totalAtPurchase = s.purchase_price * s.quantity
            const totalAtCurrent = current * s.quantity

            totalInvested += totalAtPurchase
            totalCurrentMarket += totalAtCurrent

            if (type === 'STOCK') {
              stockInvested += totalAtPurchase
              stockCurrent += totalAtCurrent
            }
            if (type === 'BOND' && s.ytm) {
              const ytm = parseFloat(s.ytm)
              if (!isNaN(ytm)) {
                totalBondInvested += totalAtPurchase
                interestIncome += (totalAtCurrent * (ytm / 100)) / 12
                const [pYear, pMonth, pDay] = s.purchase_date.split('-').map(Number);
                let months = 0; let temp = new Date(pYear, pMonth - 1, 10);
                if (pDay >= 10) temp.setMonth(temp.getMonth() + 1);
                while (temp <= now) { months++; temp.setMonth(temp.getMonth() + 1); }
                const accrued = totalAtPurchase * (ytm / 100) * (months / 12)
                bondProfitAccrued += accrued
                totalBondValue += totalAtPurchase + accrued
              }
            }
          })

          const stockProfitValue = stockCurrent - stockInvested
          const finalTotalValue = totalCurrentMarket + bondProfitAccrued
          
          // Historical Data for Chart
          const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
          const currYear = now.getFullYear();
          const historicalData = months.map((label, mIdx) => {
            let mVal = 0; const mEnd = new Date(currYear, mIdx + 1, 0);
            withPrices.forEach(s => {
              if (new Date(s.purchase_date) <= mEnd) {
                const totalAtP = s.purchase_price * s.quantity; mVal += totalAtP;
                if (s.asset_type_c === 'BOND' && s.ytm) {
                  const ytm = parseFloat(s.ytm);
                  const [bY, bM, bD] = s.purchase_date.split('-').map(Number);
                  let tDate = new Date(bY, bM-1, 10); if (bD >= 10) tDate.setMonth(tDate.getMonth()+1);
                  let mCount = 0; while (tDate <= mEnd && tDate <= now) { mCount++; tDate.setMonth(tDate.getMonth()+1); }
                  mVal += totalAtP * (ytm / 100) * (mCount / 12);
                }
              }
            });
            return { label, value: Math.round(mVal), isFuture: mIdx > now.getMonth() };
          }).filter(d => !d.isFuture);

          return {
            totalValue: finalTotalValue,
            totalProfit: stockProfitValue,
            monthlyIncome: interestIncome,
            profitPercent: totalInvested > 0 ? ((finalTotalValue - totalInvested) / totalInvested) * 100 : 0,
            stockYield: stockInvested > 0 ? (stockProfitValue / stockInvested) * 100 : 0,
            bondProfit: bondProfitAccrued,
            bondYield: totalBondInvested > 0 ? (bondProfitAccrued / totalBondInvested) * 100 : 0,
            stockWeight: finalTotalValue > 0 ? (stockCurrent / finalTotalValue) * 100 : 0,
            bondWeight: finalTotalValue > 0 ? (totalBondValue / finalTotalValue) * 100 : 0,
            historicalData,
            totalInvested,
            stockInvested,
            bondInvested: totalBondInvested,
            bondProfitDetails: withPrices.reduce((acc, s) => {
              if (s.asset_type_c === 'BOND') {
                const ytm = parseFloat(s.ytm); const [pY, pM, pD] = s.purchase_date.split('-').map(Number);
                let c = 0; let t = new Date(pY, pM-1, 10); if (pD >= 10) t.setMonth(t.getMonth()+1);
                while (t <= now) { c++; t.setMonth(t.getMonth()+1); }
                acc[s.id] = (s.purchase_price * s.quantity * (ytm / 100)) * (c / 12);
              }
              return acc;
            }, {} as any),
            userId: user.id
          }
        }

        // 1. Initial Render with DB values (Instant < 1s)
        const initialData = data.map(s => ({
          ...s, 
          current_p: s.purchase_price, 
          asset_type_c: s.asset_type || (s.ytm || s.tenure ? 'BOND' : 'STOCK')
        }))
        setStats(prev => ({ ...prev, ...calculateAll(initialData) }))
        setStocksData(initialData)

        // 2. Background Live Price Fetch
        const liveData = await Promise.all(data.map(async (s) => {
          const type = s.asset_type || (s.ytm || s.tenure ? 'BOND' : 'STOCK')
          let current = s.purchase_price
          if (type === 'STOCK') {
            try {
              const sym = s.symbol.includes('.') ? s.symbol : `${s.symbol}.NS`
              const r = await fetch(`${FUNCTION_URL}?action=price&q=${encodeURIComponent(sym)}`, {
                headers: { apikey: SUPABASE_ANON_KEY, Authorization: `Bearer ${SUPABASE_ANON_KEY}` }
              })
              if (r.ok) { const d = await r.json(); if (d?.price) current = d.price; }
            } catch { /* Silent fail */ }
          }
          return { ...s, current_p: current, asset_type_c: type }
        }))
        
        setStats(prev => ({ ...prev, ...calculateAll(liveData) }))
        setStocksData(liveData)
      } catch (err) { console.error('Error:', err) }
    }
    fetchStats()
    const interval = setInterval(fetchStats, 60000)
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
            className="flex items-center justify-center gap-2 px-4 py-2 rounded-md bg-[#111827] text-white hover:bg-black transition-all font-bold text-[12px] active:scale-95 group shadow-sm border border-[#111827]"
          >
            <FileText size={14} className="text-gray-300 group-hover:text-white transition-colors" />
            Statement
          </button>
          <button
            onClick={handleLogOut}
            className="flex items-center justify-center gap-2 px-4 py-2 rounded-md bg-white border border-gray-100 text-gray-500 hover:text-rose-600 hover:bg-rose-50 hover:border-rose-100 transition-all font-bold text-[12px] active:scale-95 group shadow-sm"
          >
            <LogOut size={14} className="text-gray-400 group-hover:text-rose-500 transition-colors" />
            Sign Out
          </button>
        </div>
      </div>

      <div className="flex items-center gap-8 border-b border-gray-100 mb-10 overflow-x-auto no-scrollbar scroll-smooth">
        <button
          onClick={() => onSwitch('portfolio')}
          className="relative pb-4 text-[13px] font-bold tracking-tight text-[#171717] transition-all"
        >
          Portfolio Overview
          <motion.div
            layoutId="active-nav-tab"
            className="absolute bottom-0 left-0 right-0 h-[2px] bg-blue-600 shadow-[0_0_8px_rgba(37,99,235,0.2)]"
            transition={{ type: "spring", bounce: 0.1, duration: 0.5 }}
          />
        </button>
        <button
          onClick={() => onSwitch('expense')}
          className="relative pb-4 text-[13px] font-bold tracking-tight text-gray-400 hover:text-gray-600 transition-all whitespace-nowrap"
        >
          Expense Tracker
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-10">
        {cards.map((card, idx) => {
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

      <div className="print-only-container">
        <StatementView userName={userName} stocks={stocksData} stats={stats} />
      </div>
    </div>
  )
}
