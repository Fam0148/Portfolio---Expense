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
      bg: 'bg-white',
      border: 'border-[#E5E7EB]',
      text: 'text-[#111827]',
      icon: <CheckCircle weight="bold" size={16} className="text-emerald-600" />
    },
    warning: {
      bg: 'bg-white',
      border: 'border-[#E5E7EB]',
      text: 'text-[#111827]',
      icon: <WarningCircle weight="bold" size={16} className="text-amber-600" />
    },
    error: {
      bg: 'bg-white',
      border: 'border-[#E5E7EB]',
      text: 'text-[#111827]',
      icon: <Warning weight="bold" size={16} className="text-rose-600" />
    },
    info: {
      bg: 'bg-white',
      border: 'border-[#E5E7EB]',
      text: 'text-[#111827]',
      icon: <Info weight="bold" size={16} className="text-[#6B7280]" />
    }
  }

  const current = configs[type]

  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: delay }}
      className={`flex items-center gap-3 px-4 py-3 rounded-2xl border ${current.bg} ${current.border} shadow-[0_1px_3px_rgba(0,0,0,0.03)] relative overflow-hidden`}
    >
      <div className="flex-shrink-0">
        {current.icon}
      </div>
      <p className="text-[13px] font-medium text-[#111827] leading-snug">
        {message}
      </p>
    </motion.div>
  )
}
