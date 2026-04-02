import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import { PortfolioChart } from "./PortfolioChart"
import { NumberTicker } from "./NumberTicker"
import { supabase } from "../../lib/supabase"

interface PortfolioCardProps {
  title: string
  numericValue: number
  illustration: string
  profitPercent?: string
  delay?: number
}

const PortfolioCard = ({ title, numericValue, illustration, profitPercent, delay = 0 }: PortfolioCardProps) => {
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
          <div className="flex items-baseline font-display font-bold text-[28px] text-[#171717] tracking-tight">
            <span>₹</span>
            <NumberTicker value={numericValue} />
          </div>
          {profitPercent && (
            <span className="text-[11px] font-sans font-bold text-green-600 bg-green-50 px-1.5 py-0.5 rounded-full">
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

  const cards = [
    {
      title: "Total Portfolio Value",
      numericValue: 142500,
      illustration: "/assets/Total Portfolio.png",
      profitPercent: "+12.5%",
      delay: 0.1
    },
    {
      title: "Total Stock Profit",
      numericValue: 34200,
      illustration: "/assets/Stock Profit.png",
      profitPercent: "+24.8%",
      delay: 0.2
    },
    {
      title: "Monthly Passive Income",
      numericValue: 1850,
      illustration: "/assets/Passive inccome.png",
      delay: 0.3
    },
    {
      title: "Total Mutual Fund Value",
      numericValue: 22400,
      illustration: "/assets/Bonds.png",
      profitPercent: "+4.2%",
      delay: 0.4
    }
  ]

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 pt-8 sm:pt-12 min-h-screen font-sans selection:bg-blue-50 selection:text-blue-600">
      <motion.div 
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
        className="flex flex-col space-y-0 mb-8 sm:mb-10 text-center sm:text-left"
      >
        <h1 className="text-[26px] sm:text-[32px] font-serif font-bold text-[#171717] leading-tight flex items-center justify-center sm:justify-start gap-2">
          Hi, {userName}
        </h1>
        <p className="text-gray-500 text-xs sm:text-sm font-sans mt-1">Track your stocks, bonds, and mutual funds in one place.</p>
      </motion.div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-4 sm:mb-6">
        {cards.map((card, idx) => (
          <PortfolioCard key={idx} {...card} />
        ))}
      </div>

      <motion.div 
        initial={{ opacity: 0, scale: 0.98 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5, delay: 0.5 }}
        className="pb-12"
      >
        <PortfolioChart />
      </motion.div>
    </div>
  )
}
