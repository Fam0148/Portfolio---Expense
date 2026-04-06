import { motion } from "framer-motion"
import { Info, CheckCircle, Warning, WarningCircle } from "@phosphor-icons/react"

interface FinancialInsightProps {
  message: string
  type?: 'success' | 'warning' | 'error' | 'info'
  delay?: number
}

export const FinancialInsight = ({ message, type = 'info', delay = 0 }: FinancialInsightProps) => {
  const configs = {
    success: {
      bg: 'bg-emerald-50/50',
      border: 'border-emerald-100',
      text: 'text-emerald-700',
      icon: <CheckCircle weight="bold" size={16} strokeWidth={2.5} />
    },
    warning: {
      bg: 'bg-amber-50/50',
      border: 'border-amber-100',
      text: 'text-amber-700',
      icon: <WarningCircle weight="bold" size={16} strokeWidth={2.5} />
    },
    error: {
      bg: 'bg-rose-50/50',
      border: 'border-rose-100',
      text: 'text-rose-700',
      icon: <Warning weight="bold" size={16} strokeWidth={2.5} />
    },
    info: {
      bg: 'bg-blue-50/50',
      border: 'border-blue-100',
      text: 'text-blue-700',
      icon: <Info weight="bold" size={16} strokeWidth={2.5} />
    }
  }

  const current = configs[type]

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: delay }}
      className={`flex items-center gap-3 px-5 py-4 rounded-md border ${current.bg} ${current.border} shadow-sm backdrop-blur-sm`}
    >
      <div className={`flex-shrink-0 ${current.text}`}>
        {current.icon}
      </div>
      <p className={`text-[12px] font-bold tracking-tight ${current.text} uppercase leading-tight`}>
        {message}
      </p>

      {/* Subtle Shine Animation */}
      <div className="absolute inset-0 overflow-hidden rounded-xl pointer-events-none">
        <motion.div
          animate={{ x: ['-100%', '100%'] }}
          transition={{ duration: 3, repeat: Infinity, ease: "linear", repeatDelay: 5 }}
          className="w-1/2 h-full bg-gradient-to-r from-transparent via-white/20 to-transparent skew-x-12"
        />
      </div>
    </motion.div>
  )
}
