import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import { PortfolioChart } from "./PortfolioChart"
import { NumberTicker } from "../ui/NumberTicker"
import { AssetManagement } from "./AssetManagement"
import { supabase } from "../../lib/supabase"
import { fetchLivePrice } from "../../lib/stockApi"
import { FilePdf, SignOut, Eye, EyeSlash } from "@phosphor-icons/react"
import { StatementView } from "./StatementView"
import { FinancialInsight } from "../ui/FinancialInsight"
import { LayoutGrid, Rows } from "lucide-react"
import { calculateBondPayouts } from "../../lib/utils"

const PortfolioCard = ({
  title,
  numericValue,
  profitPercent,
  delay = 0,
  customDisplay = false,
  stats,
  className = "",
  showValues = true,
  theme = "pink",
  description = "Real-time performance tracking and live asset analysis.",
  badge = "Valuation"
}: any) => {
  const isNegative = !customDisplay && Number(numericValue) < 0

  const themeStyles: Record<string, { bg: string; border: string; text: string; desc: string; badgeText: string; badgeBorder: string; btn: string; yieldPill: string }> = {
    pink: {
      bg: "bg-[#F7F3FD]",
      border: "border-[#E9D5FF]",
      text: "text-[#581C87]",
      desc: "text-purple-950/70",
      badgeText: "text-[#7E22CE]",
      badgeBorder: "border-[#E9D5FF] bg-white",
      btn: "text-[#7E22CE] hover:text-[#581C87]",
      yieldPill: "bg-purple-100/80 text-[#7E22CE] border border-[#E9D5FF]"
    },
    blue: {
      bg: "bg-[#EFF6FE]",
      border: "border-[#BFDBFE]",
      text: "text-[#1E3A8A]",
      desc: "text-blue-950/70",
      badgeText: "text-[#1D4ED8]",
      badgeBorder: "border-[#BFDBFE] bg-white",
      btn: "text-[#1D4ED8] hover:text-[#1E3A8A]",
      yieldPill: "bg-blue-100/80 text-[#1D4ED8] border border-[#BFDBFE]"
    },
    green: {
      bg: "bg-[#F4FAEF]",
      border: "border-[#BBF7D0]",
      text: "text-[#15803D]",
      desc: "text-emerald-950/70",
      badgeText: "text-[#16A34A]",
      badgeBorder: "border-[#BBF7D0] bg-white",
      btn: "text-[#16A34A] hover:text-[#15803D]",
      yieldPill: "bg-emerald-100/80 text-[#16A34A] border border-[#BBF7D0]"
    },
    amber: {
      bg: "bg-[#FDF5EC]",
      border: "border-[#FED7AA]",
      text: "text-[#C2410C]",
      desc: "text-orange-950/70",
      badgeText: "text-[#EA580C]",
      badgeBorder: "border-[#FED7AA] bg-white",
      btn: "text-[#EA580C] hover:text-[#C2410C]",
      yieldPill: "bg-orange-100/80 text-[#EA580C] border border-[#FED7AA]"
    },
  }

  const currentTheme = themeStyles[theme] || themeStyles.pink

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: delay }}
      className={`relative overflow-hidden ${currentTheme.bg} border ${currentTheme.border} p-6 sm:p-7 ${customDisplay ? 'min-h-0' : 'min-h-[220px]'} rounded-3xl flex flex-col justify-between transition-all group hover:shadow-xs cursor-pointer ${className}`}
    >
      {/* Decorative background shapes from the uploaded background images */}
      <div
        className="absolute right-0 top-0 bottom-0 w-[45%] h-full pointer-events-none transition-transform duration-500 rounded-r-3xl z-0 overflow-hidden"
        style={{
          backgroundImage:
            theme === 'pink' ? "url('/assets/pink-card-background.png')" :
              theme === 'blue' ? "url('/assets/blue-card-background.png')" :
                theme === 'green' ? "url('/assets/green-card-background.png')" :
                  "url('/assets/amber-card-background.png')",
          backgroundSize: "contain",
          backgroundRepeat: "no-repeat",
          backgroundPosition: "right center"
        }}
      />

      <div className="flex flex-col space-y-3 z-10 text-left">
        {/* Header tag badge */}
        <div className="flex items-center justify-between">
          <span className={`text-[10px] font-bold uppercase tracking-wider px-3 py-1 rounded-full border ${currentTheme.badgeBorder} ${currentTheme.badgeText}`}>
            {badge}
          </span>
          {profitPercent && (
            <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full ${isNegative ? 'bg-rose-100 text-rose-700 border border-rose-200' : currentTheme.yieldPill}`}>
              {profitPercent}
            </span>
          )}
        </div>

        {/* Title / Main Metric */}
        <div className="space-y-1">
          <h3 className={`text-xs font-bold uppercase tracking-wider text-[#6B7280]`}>
            {title}
          </h3>
          {customDisplay ? (
            <div className="flex flex-col gap-2 pt-1 w-full max-w-[900px]">
              <div className={`flex items-center gap-3 text-xs font-bold ${currentTheme.text}`}>
                <span>Stocks: {stats?.stockWeight.toFixed(0)}%</span>
                <span className="opacity-30">|</span>
                <span>Bonds: {stats?.bondWeight.toFixed(0)}%</span>
              </div>
              <div className="w-full h-2.5 bg-purple-200/60 rounded-full overflow-hidden flex">
                <div className="h-full bg-[#7E22CE] transition-all duration-700" style={{ width: `${stats?.stockWeight}%` }} />
                <div className="h-full bg-[#C084FC] transition-all duration-700" style={{ width: `${stats?.bondWeight}%` }} />
              </div>
            </div>
          ) : (
            <div className={`flex items-baseline font-sans font-bold text-[26px] sm:text-[30px] tracking-tight ${currentTheme.text}`}>
              <span className="text-[18px] sm:text-[20px] mr-0.5 font-semibold">{isNegative ? '-₹' : '₹'}</span>
              {showValues ? (
                <NumberTicker value={Math.abs(numericValue)} />
              ) : (
                <span className="text-[20px] sm:text-[24px]" style={{ letterSpacing: '-0.06em' }}>******</span>
              )}
            </div>
          )}
        </div>

        {/* Description */}
        <p className={`text-xs leading-relaxed font-medium ${currentTheme.desc} ${customDisplay ? 'max-w-[900px]' : 'max-w-[240px]'}`}>
          {description}
        </p>
      </div>

    </motion.div>
  )
}

export const PortfolioOverview = ({ onSwitch, userName }: { onSwitch: (val: 'portfolio' | 'expense') => void, userName: string }) => {
  const [showValues, setShowValues] = useState(() => {
    const saved = localStorage.getItem('show_portfolio_values')
    return saved === null ? true : saved === 'true'
  })

  useEffect(() => {
    localStorage.setItem('show_portfolio_values', String(showValues))
  }, [showValues])

  const handleLogOut = async () => {
    await supabase.auth.signOut()
    window.location.href = '/'
  }


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

  const fetchStats = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      const { data } = await supabase.from('stocks').select('*').eq('user_id', user.id)
      if (!data) return

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
            const bp = calculateBondPayouts(s, now)
            totalBondInvested += totalAtPurchase
            interestIncome += bp.monthly
            bondProfitAccrued += bp.tillDate
            totalBondValue += totalAtPurchase + bp.tillDate
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
                const bp = calculateBondPayouts(s, mEnd <= now ? mEnd : now)
                mVal += bp.tillDate
              }
            }
          });
          const isCurrentMonth = mIdx === now.getMonth();
          const val = isCurrentMonth && finalTotalValue > 0 ? Math.round(finalTotalValue) : Math.round(mVal);
          return { label, value: val, isFuture: mIdx > now.getMonth() };
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
            if (s.asset_type_c === 'BOND' && s.ytm) {
              const bp = calculateBondPayouts(s, now)
              acc[s.id] = bp.tillDate
            }
            return acc;
          }, {} as any),
          userId: user.id
        }
      }

      // 1. Initial Render with DB values (Instant <1s)
      const initialData = data.map(s => ({
        ...s,
        current_p: s.purchase_price,
        asset_type_c: s.asset_type || (s.ytm || s.tenure ? 'BOND' : 'STOCK')
      }))
      setStats(prev => ({ ...prev, ...calculateAll(initialData) }))
      setStocksData(initialData)

      // 2. Background Live Price Fetch via direct Yahoo Finance API
      const liveData = await Promise.all(data.map(async (s) => {
        const type = s.asset_type || (s.ytm || s.tenure ? 'BOND' : 'STOCK')
        let current = s.purchase_price
        if (type === 'STOCK') {
          try {
            const result = await fetchLivePrice(s.symbol)
            if (result.price) current = result.price
          } catch { /* Silent fail */ }
        }
        return { ...s, current_p: current, asset_type_c: type }
      }))

      setStats(prev => ({ ...prev, ...calculateAll(liveData) }))
      setStocksData(liveData)
    } catch (err) { console.error('Error:', err) }
  }

  useEffect(() => {
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
      delay: 0.1,
      theme: "pink",
      description: "Sum of all live equity holdings, bonds, and savings balances.",
      badge: "Valuation",
      linkText: "Review balance sheet →"
    },
    {
      title: "Total Stock Profit",
      numericValue: stats.totalProfit,
      illustration: "/assets/Stock Profit.png",
      profitPercent: `${stats.stockYield.toFixed(1)}% Yield`,
      delay: 0.2,
      theme: "blue",
      description: "Consolidated growth rate of stock assets with live BSE/NSE data.",
      badge: "Equity Yield",
      linkText: "Manage holdings →"
    },
    {
      title: "Monthly Passive Income",
      numericValue: stats.monthlyIncome,
      illustration: "/assets/Passive income.png",
      delay: 0.3,
      theme: "green",
      description: "Accrued monthly interest income from active high-yield bonds.",
      badge: "Interest Accrual",
      linkText: "View bond matrix →"
    },
    {
      title: "Historic Bond Profits",
      numericValue: stats.bondProfit,
      illustration: "/assets/Bonds.png",
      profitPercent: `${stats.bondYield.toFixed(1)}% Return`,
      delay: 0.4,
      theme: "amber",
      description: "Accrued interest payouts since bond activation date.",
      badge: "Historical Return",
      linkText: "Export statements →"
    },
    {
      title: "Asset Allocation",
      numericValue: 0,
      illustration: "/assets/asset allocation.png",
      customDisplay: true,
      delay: 0.5,
      theme: "pink",
      description: "Distribution weight between high-growth equities and bonds.",
      badge: "Asset Mix",
      linkText: "Rebalance portfolio →"
    }
  ]

  const getInsightMessage = () => {
    if (stats.totalValue === 0) return { text: "START BY ADDING YOUR FIRST ASSET TO TRACK YOUR WEALTH.", type: "info" as const };
    if (stats.bondWeight > 70) return { text: "HEAVILY INVESTED IN BONDS (LOW RISK, STABLE RETURNS)", type: "success" as const };
    if (stats.profitPercent > 5) return { text: `PORTFOLIO IS UP ${stats.profitPercent.toFixed(1)}% (OUTPERFORMING BENCHMARKS)`, type: "success" as const };
    if (stats.profitPercent < -2) return { text: `PORTFOLIO DROPPED ${Math.abs(stats.profitPercent).toFixed(1)}% THIS WEEK (STAY THE COURSE)`, type: "error" as const };
    return { text: "PORTFOLIO IS BALANCED AND HEALTHY. KEEP TRACKING REAL-TIME.", type: "info" as const };
  }

  const insight = getInsightMessage();

  return (
    <>
      <div className="no-print max-w-[1440px] mx-auto px-4 sm:px-8 pt-6 sm:pt-8 min-h-screen font-sans selection:bg-neutral-200 selection:text-neutral-900">
        {/* Top Header matching reference image: Breadcrumb, Pill Search Input, Filter Button, View mode toggles */}
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4 pb-5 border-b border-[#E5E7EB] mb-6">
          <div className="flex items-center gap-3">
            <span className="text-xs text-[#9CA3AF] font-medium">&lt; Home /</span>
            <span className="text-sm font-semibold text-[#111827]">Portfolio Overview</span>
          </div>

          <div className="flex flex-wrap items-center gap-3">

            {/* View Switcher Icons [ III ::: ] */}
            <div className="flex items-center bg-[#F0F1F3] p-1 rounded-xl border border-[#E5E7EB]">
              <button className="p-1.5 rounded-lg bg-white shadow-2xs text-[#111827]">
                <Rows size={14} />
              </button>
              <button className="p-1.5 rounded-lg text-[#9CA3AF] hover:text-[#111827]">
                <LayoutGrid size={14} />
              </button>
            </div>

            <button
              onClick={() => setShowValues(!showValues)}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-[#E5E7EB] bg-white text-[#111827] hover:bg-[#F4F5F7] transition-all text-xs font-medium shadow-2xs active:scale-95 cursor-pointer"
              title={showValues ? "Hide Values" : "Show Values"}
            >
              {showValues ? <Eye size={14} /> : <EyeSlash size={14} />}
              <span>{showValues ? "Hide" : "Show"}</span>
            </button>
            <button
              onClick={() => { setTimeout(() => { window.print(); }, 300); }}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#111827] text-white hover:bg-[#1F2937] transition-all text-xs font-semibold shadow-2xs active:scale-95 border border-[#111827] cursor-pointer"
            >
              <FilePdf size={14} weight="bold" />
              <span>Export PDF</span>
            </button>
            <button
              onClick={handleLogOut}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white border border-[#E5E7EB] text-[#6B7280] hover:text-[#111827] hover:bg-[#F4F5F7] transition-all text-xs font-medium shadow-2xs active:scale-95 cursor-pointer"
            >
              <SignOut size={14} />
              <span>Sign Out</span>
            </button>
          </div>
        </div>

        {/* Sleek Pill Tab Navigation matching reference */}
        <div className="sticky top-0 z-40 bg-white py-3 border-b border-[#E5E7EB] mb-6">
          <div className="bg-[#E5E7EB] p-1 rounded-full inline-flex items-center gap-1 shadow-inner relative">
            <button
              onClick={() => onSwitch('portfolio')}
              className="relative px-4 py-1.5 rounded-full text-xs font-semibold text-[#111827] transition-colors cursor-pointer z-10"
            >
              <motion.div
                layoutId="activeNavModule"
                className="absolute inset-0 bg-white rounded-full shadow-[0_1px_3px_rgba(0,0,0,0.05)] border border-[#E5E7EB]/60 -z-10"
                transition={{ type: "spring", stiffness: 500, damping: 35 }}
              />
              Portfolio Overview
            </button>
            <button
              onClick={() => onSwitch('expense')}
              className="relative px-4 py-1.5 rounded-full text-xs font-medium text-[#6B7280] hover:text-[#111827] transition-colors cursor-pointer z-10"
            >
              Expense Tracker
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 sm:gap-6 mb-6">
          {cards.map((card, idx) => {
            const isLastCard = idx === cards.length - 1;
            return (
              <PortfolioCard
                key={idx}
                {...card}
                stats={stats}
                showValues={showValues}
                className={isLastCard ? "md:col-span-2" : ""}
              />
            );
          })}
        </div>

        {/* Strategic Insight below Asset Allocation */}
        <div className="mb-10">
          <FinancialInsight message={insight.text} type={insight.type} delay={0.6} />
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
            showValues={showValues}
          />
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.7 }}
          className="pb-12"
        >
          <AssetManagement onUpdate={fetchStats} showValues={showValues} />
        </motion.div>
      </div>

      <div className="print-only-container">
        <StatementView userName={userName} stocks={stocksData} stats={stats} />
      </div>
    </>
  )
}
