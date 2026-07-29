import { useState } from 'react'
import { motion } from 'framer-motion'
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer
} from 'recharts'

const yearData = [
  { label: 'Jan', value: 0 },
  { label: 'Feb', value: 15000 },
  { label: 'Mar', value: 35000 },
  { label: 'Apr', value: 42000 },
  { label: 'May', value: 45000 },
  { label: 'Jun', value: 52000 },
  { label: 'Jul', value: 58000 },
  { label: 'Aug', value: 55000 },
  { label: 'Sep', value: 62000 },
  { label: 'Oct', value: 68000 },
  { label: 'Nov', value: 72000 },
  { label: 'Dec', value: 75000 }
]

const CustomTooltip = ({ active, payload, label, showValues = true }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white p-3 border border-[#E5E7EB] shadow-[0_2px_8px_rgba(0,0,0,0.06)] rounded-xl">
        <p className="text-xs font-sans text-[#6B7280] mb-1">{label}</p>
        <p className="text-sm font-sans font-semibold text-[#111827] tracking-tight">
          {showValues ? `₹${payload[0].value.toLocaleString('en-IN')}` : '₹******'}
        </p>
      </div>
    )
  }
  return null
}

export const PortfolioChart = ({ currentValue = 142500, profitPercent = 12.5, data, showValues = true }: { currentValue?: number; profitPercent?: number; data?: any[]; showValues?: boolean }) => {
  const [timeframe, setTimeframe] = useState('1Y')

  const chartData = (() => {
    const effectiveData = data && data.length > 0
      ? data
      : yearData.map(d => ({ ...d, value: Math.round((d.value / 75000) * (currentValue || 142500)) }))

    if (timeframe === 'ALL' || timeframe === '1Y') {
      return effectiveData
    }

    if (timeframe === '6M') {
      return effectiveData.slice(-6)
    }

    if (timeframe === '30D') {
      if (effectiveData.length >= 4) {
        return effectiveData.slice(-4)
      }
      return [
        { label: 'Week 1', value: Math.round((currentValue || 142500) * 0.85) },
        { label: 'Week 2', value: Math.round((currentValue || 142500) * 0.90) },
        { label: 'Week 3', value: Math.round((currentValue || 142500) * 0.95) },
        { label: 'Week 4', value: currentValue || 142500 }
      ]
    }

    return effectiveData
  })()

  return (
    <div className="bg-[#F5F5F7] border border-[#E5E7EB] p-6 sm:p-7 rounded-3xl flex flex-col space-y-4 relative overflow-hidden">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 z-10">
        <div>
          <span className="text-[10px] font-bold uppercase tracking-wider bg-[#E5E7EB] text-[#374151] px-2.5 py-1 rounded-full border border-[#D1D5DB]/50">
            Performance Growth
          </span>
          <h3 className="font-sans text-sm font-bold text-[#111827] mt-1.5">
            Portfolio Value Timeline
          </h3>
        </div>
        <div className="flex items-center gap-3">
          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700`}>
            {showValues ? `${profitPercent >= 0 ? '+' : ''}${profitPercent.toFixed(1)}% Overall` : '***% Overall'}
          </span>
          <div className="flex items-center gap-1 bg-[#E5E7EB] p-1 rounded-full border border-[#D1D5DB]/60 relative">
            {(['30D', '6M', '1Y', 'ALL'] as const).map((tf) => (
              <button
                key={tf}
                type="button"
                onClick={() => setTimeframe(tf)}
                className={`relative px-3 py-1 rounded-full text-xs font-semibold transition-colors cursor-pointer z-10 ${timeframe === tf
                    ? 'text-white'
                    : 'text-[#6B7280] hover:text-[#111827]'
                  }`}
              >
                {timeframe === tf && (
                  <motion.div
                    layoutId="activeChartTimeframe"
                    className="absolute inset-0 bg-[#111827] rounded-full shadow-xs -z-10"
                    transition={{ type: "spring", stiffness: 500, damping: 35 }}
                  />
                )}
                {tf}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Inner White Chart Plate */}
      <div className="bg-white p-5 sm:p-6 rounded-2xl border border-[#E5E7EB] shadow-[0_2px_8px_rgba(0,0,0,0.03)] flex flex-col z-10">
        <div className="h-[380px] sm:h-[420px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart
              data={chartData}
              margin={{ top: 15, right: 25, left: 15, bottom: 30 }}
            >
              <defs>
                <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#111827" stopOpacity={0.20} />
                  <stop offset="95%" stopColor="#111827" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid
                vertical={false}
                horizontal={true}
                stroke="#E5E7EB"
                strokeDasharray="3 3"
              />
              <XAxis
                dataKey="label"
                axisLine={false}
                tickLine={false}
                interval={0}
                padding={{ left: 15, right: 15 }}
                tick={{ fontSize: 11, fill: '#6B7280', fontFamily: 'Inter', fontWeight: 500 }}
                dy={12}
              />
              <YAxis
                axisLine={false}
                tickLine={false}
                tick={{ fontSize: 11, fill: '#6B7280', fontFamily: 'Inter', fontWeight: 500 }}
                tickFormatter={(value) => showValues ? `₹${value / 1000}k` : '₹**k'}
                dx={-5}
                domain={['auto', 'auto']}
                hide={!showValues}
              />
              <Tooltip
                content={<CustomTooltip showValues={showValues} />}
                cursor={{ stroke: '#E5E7EB', strokeWidth: 1, strokeDasharray: '3 3' }}
              />
              <Area
                type="monotone"
                dataKey="value"
                stroke="#111827"
                strokeWidth={2.5}
                fillOpacity={1}
                fill="url(#colorValue)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  )
}
