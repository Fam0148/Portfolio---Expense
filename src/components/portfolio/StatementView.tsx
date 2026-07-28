import { calculateBondPayouts } from "../../lib/utils"

interface StatementViewProps {
  userName: string
  stocks: any[]
  stats: any
}

export const StatementView = ({ userName, stocks, stats }: StatementViewProps) => {
  const dateIssued = new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
  const statementId = `STMT-${new Date().getFullYear()}${(new Date().getMonth() + 1).toString().padStart(2, '0')}-${Math.floor(1000 + Math.random() * 9000)}`

  return (
    <div id="portfolio-statement" className="print-only-container bg-white p-8 sm:p-12 max-w-[1000px] mx-auto text-[#111827] font-sans antialiased selection:bg-neutral-200">
      <style>{`
        @media screen {
          .print-only-container { display: none !important; }
        }
        @media print {
          .no-print { display: none !important; }
          body {
            background: white !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          #portfolio-statement {
            position: absolute !important;
            top: 0 !important;
            left: 0 !important;
            width: 100% !important;
            margin: 0 !important;
            padding: 12mm 12mm !important;
            background: white !important;
            display: block !important;
            box-sizing: border-box !important;
          }
          @page {
            margin: 0;
            size: A4 portrait;
          }
        }
      `}</style>

      {/* Header Banner */}
      <div className="flex justify-between items-start pb-6 border-b border-[#E5E7EB] mb-8">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <div className="w-2.5 h-7 bg-[#111827] rounded-full" />
            <span className="text-xl font-bold tracking-tight text-[#111827]">Portfolio & Expense</span>
            <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-purple-100 text-[#7E22CE] border border-[#E9D5FF] ml-1">
              Official Statement
            </span>
          </div>
          <h1 className="text-3xl font-extrabold text-[#111827] tracking-tight">Consolidated Wealth Statement</h1>
          <p className="text-xs text-[#6B7280] mt-1 font-medium">Real-time performance evaluation and certified asset holdings statement</p>
        </div>

        <div className="text-right space-y-1">
          <div className="text-xs font-semibold text-[#111827]">Statement Ref: <span className="font-mono font-normal text-[#4B5563]">{statementId}</span></div>
          <div className="text-xs text-[#6B7280]">Date: <span className="font-medium text-[#111827]">{dateIssued}</span></div>
          <div className="text-xs text-[#6B7280]">Investor: <span className="font-semibold text-[#111827]">{userName || "Portfolio Holder"}</span></div>
        </div>
      </div>

      {/* 4 Summary Cards matching dashboard cards design */}
      <div className="grid grid-cols-4 gap-4 mb-8">
        {/* Card 1: Total Portfolio Value (Purple Theme) */}
        <div className="bg-[#F7F3FD] border border-[#E9D5FF] p-4 rounded-2xl flex flex-col justify-between">
          <div className="flex justify-between items-center mb-2">
            <span className="text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-white text-[#7E22CE] border border-[#E9D5FF]">
              Valuation
            </span>
            <span className="text-[9px] font-bold px-2 py-0.5 rounded-full bg-purple-100/80 text-[#7E22CE]">
              {stats.profitPercent >= 0 ? `+${stats.profitPercent?.toFixed(1)}%` : `${stats.profitPercent?.toFixed(1)}%`}
            </span>
          </div>
          <div>
            <p className="text-[10px] font-bold uppercase tracking-wider text-[#6B7280]">Total Portfolio Value</p>
            <p className="text-lg font-bold text-[#581C87] tracking-tight mt-0.5">
              ₹{stats.totalValue?.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
            </p>
          </div>
        </div>

        {/* Card 2: Total Stock Profit (Blue Theme) */}
        <div className="bg-[#EFF6FE] border border-[#BFDBFE] p-4 rounded-2xl flex flex-col justify-between">
          <div className="flex justify-between items-center mb-2">
            <span className="text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-white text-[#1D4ED8] border border-[#BFDBFE]">
              Equity Yield
            </span>
            <span className="text-[9px] font-bold px-2 py-0.5 rounded-full bg-blue-100/80 text-[#1D4ED8]">
              {stats.stockYield?.toFixed(1)}% Yield
            </span>
          </div>
          <div>
            <p className="text-[10px] font-bold uppercase tracking-wider text-[#6B7280]">Total Stock Profit</p>
            <p className="text-lg font-bold text-[#1E3A8A] tracking-tight mt-0.5">
              ₹{stats.totalProfit?.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
            </p>
          </div>
        </div>

        {/* Card 3: Monthly Passive Income (Green Theme) */}
        <div className="bg-[#F4FAEF] border border-[#BBF7D0] p-4 rounded-2xl flex flex-col justify-between">
          <div className="flex justify-between items-center mb-2">
            <span className="text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-white text-[#16A34A] border border-[#BBF7D0]">
              Interest Accrual
            </span>
          </div>
          <div>
            <p className="text-[10px] font-bold uppercase tracking-wider text-[#6B7280]">Monthly Passive Income</p>
            <p className="text-lg font-bold text-[#15803D] tracking-tight mt-0.5">
              ₹{stats.monthlyIncome?.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
            </p>
          </div>
        </div>

        {/* Card 4: Historic Bond Profits (Amber Theme) */}
        <div className="bg-[#FDF5EC] border border-[#FED7AA] p-4 rounded-2xl flex flex-col justify-between">
          <div className="flex justify-between items-center mb-2">
            <span className="text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-white text-[#EA580C] border border-[#FED7AA]">
              Historical Return
            </span>
            <span className="text-[9px] font-bold px-2 py-0.5 rounded-full bg-orange-100/80 text-[#EA580C]">
              {stats.bondYield?.toFixed(1)}% Return
            </span>
          </div>
          <div>
            <p className="text-[10px] font-bold uppercase tracking-wider text-[#6B7280]">Historic Bond Profits</p>
            <p className="text-lg font-bold text-[#C2410C] tracking-tight mt-0.5">
              ₹{stats.bondProfit?.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
            </p>
          </div>
        </div>
      </div>

      {/* Asset Mix Breakdown */}
      <div className="bg-[#F9FAFB] border border-[#E5E7EB] rounded-2xl p-4 mb-8">
        <div className="flex justify-between items-center mb-2">
          <span className="text-xs font-bold text-[#111827] uppercase tracking-wider">Asset Mix Allocation</span>
          <div className="flex items-center gap-4 text-xs font-semibold text-[#6B7280]">
            <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-[#7E22CE]" /> Stocks: {stats.stockWeight?.toFixed(0)}%</span>
            <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-[#C084FC]" /> Bonds: {stats.bondWeight?.toFixed(0)}%</span>
          </div>
        </div>
        <div className="w-full h-2.5 bg-gray-200 rounded-full overflow-hidden flex">
          <div className="h-full bg-[#7E22CE]" style={{ width: `${stats.stockWeight || 0}%` }} />
          <div className="h-full bg-[#C084FC]" style={{ width: `${stats.bondWeight || 0}%` }} />
        </div>
      </div>

      {/* Holdings Table */}
      <div className="mb-8">
        <div className="flex justify-between items-center mb-3">
          <h2 className="text-xs font-bold uppercase tracking-wider text-[#111827]">Portfolio Asset Holdings ({stocks.length})</h2>
          <span className="text-[11px] text-[#6B7280] font-medium">Live market prices as of {dateIssued}</span>
        </div>

        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-[#F4F5F7] border border-[#E5E7EB] text-[10px] font-bold text-[#6B7280] uppercase tracking-wider">
              <th className="py-2.5 px-3 rounded-l-xl">Asset Symbol & Name</th>
              <th className="py-2.5 px-3">Category</th>
              <th className="py-2.5 px-3 text-center">Qty / Tenure</th>
              <th className="py-2.5 px-3 text-right">Avg Price</th>
              <th className="py-2.5 px-3 text-right">Current / Accrued</th>
              <th className="py-2.5 px-3 text-right rounded-r-xl">Total Market Value</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#E5E7EB] text-xs">
            {stocks.map((s, idx) => {
              const isBond = s.asset_type_c === 'BOND'
              const bp = isBond ? calculateBondPayouts(s) : null
              const totalVal = isBond 
                ? (s.purchase_price * s.quantity) + (bp?.tillDate || 0)
                : s.quantity * (s.current_p || s.purchase_price)

              return (
                <tr key={idx} className="hover:bg-gray-50/50 transition-colors">
                  <td className="py-3 px-3">
                    <div className="font-bold text-[#111827] uppercase text-xs">{s.symbol}</div>
                    <div className="text-[11px] text-[#6B7280] font-normal">{s.name || s.symbol}</div>
                  </td>
                  <td className="py-3 px-3">
                    <span className={`text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border ${
                      isBond 
                        ? 'bg-orange-50 text-[#EA580C] border-[#FED7AA]' 
                        : 'bg-blue-50 text-[#1D4ED8] border-[#BFDBFE]'
                    }`}>
                      {isBond ? 'Fixed Income' : 'Equity'}
                    </span>
                  </td>
                  <td className="py-3 px-3 text-center font-medium text-[#111827]">
                    {isBond ? (s.tenure ? `${s.tenure} Mon` : '12 Mon') : `${s.quantity} Units`}
                  </td>
                  <td className="py-3 px-3 text-right font-medium text-[#4B5563]">
                    ₹{s.purchase_price.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
                  </td>
                  <td className="py-3 px-3 text-right font-medium text-[#4B5563]">
                    {isBond ? (
                      <span className="text-[#EA580C] font-semibold">+₹{(bp?.tillDate || 0).toLocaleString('en-IN', { maximumFractionDigits: 0 })}</span>
                    ) : (
                      `₹${(s.current_p || s.purchase_price).toLocaleString('en-IN', { maximumFractionDigits: 0 })}`
                    )}
                  </td>
                  <td className="py-3 px-3 text-right font-bold text-[#111827]">
                    ₹{totalVal.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      {/* Summary Totals Footer Block */}
      <div className="flex justify-end pt-4 border-t border-[#E5E7EB] mb-12">
        <div className="w-[340px] space-y-2.5 bg-[#F9FAFB] border border-[#E5E7EB] p-4 rounded-2xl">
          <div className="flex justify-between items-center text-xs text-[#6B7280] font-semibold">
            <span>Invested Principal</span>
            <span className="text-[#111827] font-bold">₹{stats.totalInvested?.toLocaleString('en-IN', { maximumFractionDigits: 0 })}</span>
          </div>
          <div className="flex justify-between items-center text-xs text-[#6B7280] font-semibold">
            <span>Stock Returns (Unrealized)</span>
            <span className="text-[#1D4ED8] font-bold">₹{stats.totalProfit?.toLocaleString('en-IN', { maximumFractionDigits: 0 })}</span>
          </div>
          <div className="flex justify-between items-center text-xs text-[#6B7280] font-semibold">
            <span>Bond Returns Accrued Till Date</span>
            <span className="text-[#EA580C] font-bold">₹{stats.bondProfit?.toLocaleString('en-IN', { maximumFractionDigits: 0 })}</span>
          </div>
          <div className="pt-2 border-t border-[#E5E7EB] flex justify-between items-center text-sm font-black text-[#111827]">
            <span className="uppercase tracking-tight">Net Portfolio Value</span>
            <span className="text-base text-[#581C87]">₹{stats.totalValue?.toLocaleString('en-IN', { maximumFractionDigits: 0 })}</span>
          </div>
        </div>
      </div>

      {/* Certified Footer */}
      <div className="border-t border-[#E5E7EB] pt-6 flex justify-between items-center text-[10px] text-[#9CA3AF]">
        <div>
          <span className="font-semibold text-[#6B7280]">Portfolio & Expense System</span> — Official System Generated Statement
        </div>
        <div>
          Confidential • Generated on {dateIssued}
        </div>
      </div>
    </div>
  )
}
