import { calculateBondPayouts } from "../../lib/utils"

interface StatementViewProps {
  userName: string
  stocks: any[]
  stats: any
}

export const StatementView = ({ userName, stocks, stats }: StatementViewProps) => {
  const dateIssued = new Date().toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' })
  const statementId = `STMT-${new Date().getFullYear()}${(new Date().getMonth() + 1).toString().padStart(2, '0')}-${Math.floor(1000 + Math.random() * 9000)}`

  return (
    <div id="portfolio-statement" className="print-only-container bg-white p-6 sm:p-10 max-w-[920px] mx-auto text-[#111827] font-sans antialiased selection:bg-neutral-200">
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
            padding: 10mm 10mm !important;
            background: white !important;
            display: block !important;
            box-sizing: border-box !important;
          }
          .page-break-before {
            page-break-before: always !important;
            break-before: page !important;
          }
          @page {
            margin: 0;
            size: A4 portrait;
          }
        }
      `}</style>

      {/* ══════════════════════════════════════════════════════════════════════ */}
      {/* ── PAGE 1: EXECUTIVE WEALTH SUMMARY & TOTALS (MINIMAL & CLEAN) ───── */}
      {/* ══════════════════════════════════════════════════════════════════════ */}
      <div className="min-h-[265mm] flex flex-col justify-between pb-4">
        <div>
          {/* 1. Hero Landscape Banner Image */}
          <div className="w-full h-40 sm:h-48 rounded-2xl overflow-hidden mb-6 shadow-xs border border-gray-100/80 relative bg-gray-100">
            <img
              src="/assets/statement_hero_banner.png"
              alt="Statement Banner"
              className="w-full h-full object-cover"
            />
          </div>

          {/* 2. Top Header & Ref Number */}
          <div className="flex items-center justify-between mb-5">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-xl bg-[#111827] text-white flex items-center justify-center font-black text-sm tracking-tighter shadow-xs">
                P
              </div>
              <span className="text-sm font-bold tracking-tight text-[#111827]">Portfolio & Expense</span>
            </div>

            <div className="text-right space-y-0.5">
              <div className="text-xs font-mono font-bold text-[#111827]">
                Ref: <span className="text-[#111827]">{statementId}</span>
              </div>
              <div className="text-[11px] text-[#6B7280]">
                Date: <span className="font-semibold text-[#111827]">{dateIssued}</span> • Investor: <span className="font-semibold text-[#111827]">{userName || "Valued Investor"}</span>
              </div>
            </div>
          </div>

          {/* 3. Gigantic Main Statement Title */}
          <div className="mb-8 border-b border-gray-100 pb-5">
            <h1 className="text-4xl sm:text-5xl font-black text-[#111827] tracking-tight uppercase leading-none">
              CONSOLIDATED WEALTH STATEMENT
            </h1>
            <p className="text-xs text-[#6B7280] font-medium mt-2">
              Certified real-time performance evaluation and asset overview
            </p>
          </div>

          {/* 4. Metric Summary Cards Bar */}
          <div className="grid grid-cols-4 gap-4 mb-8">
            <div className="bg-[#F7F3FD] border border-[#E9D5FF] p-4 rounded-2xl flex flex-col justify-between">
              <div className="flex justify-between items-center mb-1">
                <span className="text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-white text-[#7E22CE] border border-[#E9D5FF]">
                  VALUATION
                </span>
                <span className="text-[9px] font-bold text-[#7E22CE]">
                  {stats.profitPercent >= 0 ? `+${stats.profitPercent?.toFixed(1)}%` : `${stats.profitPercent?.toFixed(1)}%`}
                </span>
              </div>
              <p className="text-[10px] font-bold uppercase tracking-wider text-[#6B7280] mt-2">TOTAL VALUE</p>
              <p className="text-xl font-bold text-[#581C87] tracking-tight">
                ₹{stats.totalValue?.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
              </p>
            </div>

            <div className="bg-[#EFF6FE] border border-[#BFDBFE] p-4 rounded-2xl flex flex-col justify-between">
              <div className="flex justify-between items-center mb-1">
                <span className="text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-white text-[#1D4ED8] border border-[#BFDBFE]">
                  EQUITY YIELD
                </span>
                <span className="text-[9px] font-bold text-[#1D4ED8]">
                  {stats.stockYield?.toFixed(1)}%
                </span>
              </div>
              <p className="text-[10px] font-bold uppercase tracking-wider text-[#6B7280] mt-2">STOCK PROFIT</p>
              <p className="text-xl font-bold text-[#1E3A8A] tracking-tight">
                ₹{stats.totalProfit?.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
              </p>
            </div>

            <div className="bg-[#F4FAEF] border border-[#BBF7D0] p-4 rounded-2xl flex flex-col justify-between">
              <div className="flex justify-between items-center mb-1">
                <span className="text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-white text-[#16A34A] border border-[#BBF7D0]">
                  MONTHLY
                </span>
              </div>
              <p className="text-[10px] font-bold uppercase tracking-wider text-[#6B7280] mt-2">PASSIVE INCOME</p>
              <p className="text-xl font-bold text-[#15803D] tracking-tight">
                ₹{stats.monthlyIncome?.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
              </p>
            </div>

            <div className="bg-[#FDF5EC] border border-[#FED7AA] p-4 rounded-2xl flex flex-col justify-between">
              <div className="flex justify-between items-center mb-1">
                <span className="text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-white text-[#EA580C] border border-[#FED7AA]">
                  ACCUMULATED
                </span>
                <span className="text-[9px] font-bold text-[#EA580C]">
                  {stats.bondYield?.toFixed(1)}%
                </span>
              </div>
              <p className="text-[10px] font-bold uppercase tracking-wider text-[#6B7280] mt-2">BOND GAINS</p>
              <p className="text-xl font-bold text-[#C2410C] tracking-tight">
                ₹{stats.bondProfit?.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
              </p>
            </div>
          </div>

          {/* 5. Asset Mix Breakdown */}
          <div className="bg-[#F9FAFB] border border-gray-200 rounded-2xl p-4 mb-8">
            <div className="flex justify-between items-center mb-2">
              <span className="text-xs font-bold text-[#111827] uppercase tracking-wider">ASSET MIX ALLOCATION</span>
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

          {/* 6. Bottom Totals Summary Box & Minimal Notes */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-8 items-start border-t border-gray-200 pt-6 text-xs">
            <div className="space-y-4 text-[#6B7280]">
              <div>
                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block mb-1">
                  SUMMARY DISCLOSURE
                </span>
                <p className="text-[11px] leading-relaxed font-medium text-gray-500">
                  Detailed asset holdings table is presented on Page 2. All portfolio valuations reflect certified live market prices.
                </p>
              </div>
            </div>

            <div className="space-y-2 bg-gray-50 border border-gray-200 p-5 rounded-2xl">
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
              <div className="pt-3 border-t border-gray-200 flex justify-between items-center text-sm font-black text-[#111827]">
                <span className="uppercase tracking-tight">TOTAL MARKET VALUE</span>
                <span className="text-xl font-extrabold text-[#111827]">₹{stats.totalValue?.toLocaleString('en-IN', { maximumFractionDigits: 0 })}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Page 1 Footer */}
        <div className="border-t border-gray-100 pt-4 flex justify-between items-center text-[10px] text-gray-400 font-medium">
          <div>
            <span className="font-semibold text-gray-500">Portfolio & Expense System</span> — Executive Summary (Page 1 of 2)
          </div>
          <div>
            Confidential • Generated on {dateIssued}
          </div>
        </div>
      </div>

      {/* ══════════════════════════════════════════════════════════════════════ */}
      {/* ── PAGE 2: PORTFOLIO ASSET HOLDINGS TABLE ────────────────────────── */}
      {/* ══════════════════════════════════════════════════════════════════════ */}
      <div className="page-break-before min-h-[265mm] flex flex-col justify-between pt-4 sm:pt-6 pb-4">
        <div>
          {/* Page 2 Header Strip */}
          <div className="flex items-center justify-between pb-4 border-b border-gray-200 mb-6">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-lg bg-[#111827] text-white flex items-center justify-center font-black text-xs">
                P
              </div>
              <span className="text-xs font-bold text-[#111827] uppercase tracking-wider">PORTFOLIO ASSET HOLDINGS</span>
            </div>
            <div className="text-[11px] text-gray-400 font-mono">
              Ref: {statementId} • Page 2 of 2
            </div>
          </div>

          <div className="flex justify-between items-center mb-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-[#111827]">
              DETAILED ASSET BREAKDOWN ({stocks.length} HOLDINGS)
            </h3>
            <span className="text-[11px] text-gray-400 font-medium">Evaluated at current NSE/BSE market prices as of {dateIssued}</span>
          </div>

          {/* Holdings Table */}
          <table className="w-full text-left border-collapse mb-8">
            <thead>
              <tr className="border-t border-b border-gray-200 text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                <th className="py-3 px-3">ASSET SYMBOL & NAME</th>
                <th className="py-3 px-3">CATEGORY</th>
                <th className="py-3 px-3 text-center">QTY / TENURE</th>
                <th className="py-3 px-3 text-right">AVG PRICE</th>
                <th className="py-3 px-3 text-right">CURRENT / ACCRUED</th>
                <th className="py-3 px-3 text-right">TOTAL MARKET VALUE</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 text-xs">
              {stocks.map((s, idx) => {
                const isBond = s.asset_type_c === 'BOND'
                const bp = isBond ? calculateBondPayouts(s) : null
                const totalVal = isBond
                  ? (s.purchase_price * s.quantity) + (bp?.tillDate || 0)
                  : s.quantity * (s.current_p || s.purchase_price)

                return (
                  <tr key={idx} className="hover:bg-gray-50/50 transition-colors">
                    <td className="py-3.5 px-3">
                      <div className="font-bold text-[#111827] uppercase text-xs">{s.symbol}</div>
                      <div className="text-[11px] text-gray-400 font-normal">{s.name || s.symbol}</div>
                    </td>
                    <td className="py-3.5 px-3">
                      <span className={`text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border ${
                        isBond
                          ? 'bg-orange-50 text-[#EA580C] border-[#FED7AA]'
                          : 'bg-blue-50 text-[#1D4ED8] border-[#BFDBFE]'
                      }`}>
                        {isBond ? 'FIXED INCOME' : 'EQUITY'}
                      </span>
                    </td>
                    <td className="py-3.5 px-3 text-center font-medium text-[#111827]">
                      {isBond ? (s.tenure ? `${s.tenure} Mon` : '12 Mon') : `${s.quantity} Units`}
                    </td>
                    <td className="py-3.5 px-3 text-right font-medium text-gray-500">
                      ₹{s.purchase_price.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
                    </td>
                    <td className="py-3.5 px-3 text-right font-medium text-gray-500">
                      {isBond ? (
                        <span className="text-[#EA580C] font-semibold">+₹{(bp?.tillDate || 0).toLocaleString('en-IN', { maximumFractionDigits: 0 })}</span>
                      ) : (
                        `₹${(s.current_p || s.purchase_price).toLocaleString('en-IN', { maximumFractionDigits: 0 })}`
                      )}
                    </td>
                    <td className="py-3.5 px-3 text-right font-bold text-[#111827]">
                      ₹{totalVal.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>

        {/* Page 2 Footer */}
        <div className="border-t border-gray-100 pt-4 flex justify-between items-center text-[10px] text-gray-400 font-medium">
          <div>
            <span className="font-semibold text-gray-500">Portfolio & Expense System</span> — Detailed Asset Holdings (Page 2 of 2)
          </div>
          <div>
            Certified System Document • Generated on {dateIssued}
          </div>
        </div>
      </div>
    </div>
  )
}
