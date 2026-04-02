import { useState } from 'react'
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
  { label: 'Jan', value: 92000 },
  { label: 'Feb', value: 98500 },
  { label: 'Mar', value: 104000 },
  { label: 'Apr', value: 99000 },
  { label: 'May', value: 108000 },
  { label: 'Jun', value: 115000 },
  { label: 'Jul', value: 122000 },
  { label: 'Aug', value: 118000 },
  { label: 'Sep', value: 126000 },
  { label: 'Oct', value: 135000 },
  { label: 'Nov', value: 139000 },
  { label: 'Dec', value: 142500 }
]

const sixMonthData = [
  { label: 'Jul', value: 122000 },
  { label: 'Aug', value: 118000 },
  { label: 'Sep', value: 126000 },
  { label: 'Oct', value: 135000 },
  { label: 'Nov', value: 139000 },
  { label: 'Dec', value: 142500 }
]

const thirtyDayData = [
  { label: 'W1', value: 135000 },
  { label: 'W2', value: 138000 },
  { label: 'W3', value: 141000 },
  { label: 'W4', value: 142500 }
]

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white p-3 border border-gray-100 shadow-lg rounded-xl">
        <p className="text-xs font-sans text-gray-500 mb-1">{label}</p>
        <p className="text-sm font-display font-bold text-[#171717]">
          ₹{payload[0].value.toLocaleString('en-IN')}
        </p>
      </div>
    )
  }
  return null
}

export const PortfolioChart = () => {
  const [timeframe, setTimeframe] = useState('1Y')

  const getChartData = () => {
    switch (timeframe) {
      case '6M': return sixMonthData
      case '30D': return thirtyDayData
      default: return yearData
    }
  }

  return (
    <div className="bg-white p-4 sm:p-6 rounded-[20px] border border-gray-100/80 shadow-sm flex flex-col space-y-6">
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 text-center sm:text-left">
        <div className="flex items-center gap-2">
          <div className="w-5 h-5 flex items-center justify-center">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#2563eb" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="22 7 13.5 15.5 8.5 10.5 2 17"></polyline><polyline points="16 7 22 7 22 13"></polyline></svg>
          </div>
          <h2 className="text-sm font-sans font-semibold text-gray-700 tracking-tight">Portfolio Value History</h2>
        </div>
        <div className="flex items-center justify-center sm:justify-end gap-3 sm:gap-4 w-full sm:w-auto">
          <span className="text-[10px] sm:text-[11px] font-sans font-bold text-green-600 bg-green-50 px-2 py-0.5 rounded-full whitespace-nowrap">+12.5% YoY</span>
          <select
            value={timeframe}
            onChange={(e) => setTimeframe(e.target.value)}
            className="bg-gray-50 border-none text-[10px] sm:text-[11px] font-sans font-semibold text-gray-500 rounded-lg px-2 py-1 outline-none cursor-pointer"
          >
            <option value="1Y">Last 1 year</option>
            <option value="6M">Last 6 months</option>
            <option value="30D">Last 30 days</option>
          </select>
        </div>
      </div>

      <div className="h-[280px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart
            data={getChartData()}
            margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
            key={timeframe} // Force re-render for animation
          >
            <defs>
              <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.1} />
                <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid
              vertical={true}
              horizontal={true}
              stroke="#f3f4f6"
              strokeDasharray="3 3"
              verticalFill={['#fff', '#fcfcfc']}
              fillOpacity={0.4}
            />
            <XAxis
              dataKey="label"
              axisLine={false}
              tickLine={false}
              tick={{ fontSize: 11, fill: '#9ca3af', fontFamily: 'Inter' }}
              dy={10}
            />
            <YAxis
              axisLine={false}
              tickLine={false}
              tick={{ fontSize: 11, fill: '#9ca3af', fontFamily: 'Inter' }}
              tickFormatter={(value) => `₹${value / 1000}k`}
            />
            <Tooltip
              content={<CustomTooltip />}
              cursor={{ stroke: '#3b82f6', strokeWidth: 1, strokeDasharray: '4 4' }}
            />
            <Area
              type="monotone"
              dataKey="value"
              stroke="#2563eb"
              strokeWidth={3}
              fillOpacity={1}
              fill="url(#colorValue)"
              animationDuration={1000}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}
