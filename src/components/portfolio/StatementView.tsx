interface StatementViewProps {
  userName: string
  stocks: any[]
  stats: any
}

export const StatementView = ({ userName, stocks, stats }: StatementViewProps) => {
  const dateIssued = new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })

  const stockHoldings = stocks.filter(s => s.asset_type_c === 'STOCK')
  const bondHoldings = stocks.filter(s => s.asset_type_c === 'BOND')

  return (
    <div id="portfolio-statement" className="print-only-container bg-white p-[40px] md:p-[60px] max-w-[900px] mx-auto text-[#1F2937] font-sans selection:bg-blue-100 selection:text-blue-700">
      <style>{`
        @media screen {
          .print-only-container { display: none !important; }
        }
        @media print {
          .no-print { display: none !important; }
          #portfolio-statement {
            position: absolute !important;
            top: 0 !important;
            left: 0 !important;
            width: 100% !important;
            margin: 0 !important;
            padding: 10mm !important;
            background: white !important;
            display: block !important;
          }
          @page { margin: 0; size: A4; }
        }
      `}</style>

      {/* Top Header Section */}
      <div className="flex justify-between items-start mb-12">
        <div className="text-left">
          <div className="w-32 h-[6px] bg-[#7DD3FC] mb-2" />
          <h1 className="text-[54px] font-extrabold text-[#111827] tracking-tighter leading-none mb-8">Statement</h1>

          <div className="space-y-1">
            <p className="text-[12px] font-bold text-[#111827]">Issued to:</p>
            <p className="text-[13px] text-gray-500 font-medium">{userName}</p>
            <p className="text-[13px] text-gray-400">Digital Asset Portfolio</p>
            <p className="text-[13px] text-gray-400">iFairValueGod Hub</p>
            <p className="text-[13px] text-gray-400">{dateIssued}</p>
          </div>
        </div>

        <div className="text-right flex flex-col items-end pt-4">
          <div className="space-y-4">
            <div className="text-right">
              <p className="text-[11px] font-bold text-[#111827]">Statement Date:</p>
              <p className="text-[11px] text-gray-400">{dateIssued}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Info Bar Detail Grid */}
      <div className="grid grid-cols-4 border-y border-gray-200 mb-8 py-3">
        <div className="px-4 border-r border-gray-100">
          <p className="text-[11px] font-bold text-[#111827] mb-0.5">Last updated</p>
          <p className="text-[11px] text-gray-400">{dateIssued}</p>
        </div>
        <div className="px-4 border-r border-gray-100">
          <p className="text-[11px] font-bold text-[#111827] mb-0.5">Asset Count</p>
          <p className="text-[11px] text-gray-400">{stocks.length} Items</p>
        </div>
        <div className="px-4 border-r border-gray-100">
          <p className="text-[11px] font-bold text-[#111827] mb-0.5">Report Type</p>
          <p className="text-[11px] text-gray-400">Consolidated</p>
        </div>
        <div className="px-4">
          <p className="text-[11px] font-bold text-[#111827] mb-0.5">Status</p>
          <p className="text-[11px] text-gray-400">Active Account</p>
        </div>
      </div>

      {/* Main Content Block (Blue Background) */}
      <div className="bg-[#eff6ff] rounded-sm relative overflow-hidden pb-10">
        {/* Project Bar */}
        <div className="bg-[#7DD3FC] px-5 py-2.5 mb-8">
          <h2 className="text-[13px] font-extrabold text-[#0c4a6e] tracking-tight">
            Consolidated Portfolio Performance — {userName}'s Digital Assets
          </h2>
        </div>

        <div className="px-5">
          <div className="flex justify-between items-start mb-8">
            <div>
              <p className="text-[12px] font-bold text-[#111827] mb-1">{userName}</p>
              <p className="text-[11px] text-gray-500 leading-relaxed">Wealth Identification Portfolio<br />Equity & Fixed Income Assets</p>
            </div>
            <div className="text-right">
              <div className="flex gap-10">
                <div>
                  <p className="text-[11px] font-bold text-[#111827] mb-1">Asset Status</p>
                  <p className="text-[11px] text-gray-500">Live Market Tracking*</p>
                </div>
                <div>
                  <p className="text-[11px] font-bold text-[#111827] mb-1">Report Date</p>
                  <p className="text-[11px] text-gray-500">{dateIssued}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Assets Table */}
          <table className="w-full text-left mb-10">
            <thead>
              <tr className="text-[11px] font-bold text-[#111827] border-b border-blue-200">
                <th className="py-3 px-0">Asset Description</th>
                <th className="py-3 px-0 text-center">Qty./Units</th>
                <th className="py-3 px-0 text-center">Avg Price</th>
                <th className="py-3 px-0 text-right">Total Amount</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-blue-100/50">
              {stockHoldings.map((s, i) => (
                <tr key={i} className="text-[12px] text-[#334155]">
                  <td className="py-4 px-0">• {s.symbol} Equity</td>
                  <td className="py-4 px-0 text-center">{s.quantity} Units</td>
                  <td className="py-4 px-0 text-center">₹{s.purchase_price.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                  <td className="py-4 px-0 text-right font-bold text-[#0f172a]">₹{(s.quantity * s.current_p).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                </tr>
              ))}
              {bondHoldings.map((s, i) => (
                <tr key={i} className="text-[12px] text-[#334155]">
                  <td className="py-4 px-0">• {s.symbol} Fixed Income</td>
                  <td className="py-4 px-0 text-center">1 Portfolio</td>
                  <td className="py-4 px-0 text-center">₹{(s.purchase_price * s.quantity).toLocaleString('en-IN')}</td>
                  <td className="py-4 px-0 text-right font-bold text-[#0f172a]">₹{(s.purchase_price * s.quantity + (stats.bondProfitDetails?.[s.id] || 0)).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* Subtotals within the blue block */}
          <div className="flex justify-end pt-4 border-t border-blue-200">
            <div className="w-[300px] space-y-4">
              <div className="flex justify-between items-center text-[11px] font-bold text-gray-500">
                <span>Invested Principal</span>
                <span className="text-[#111827]">₹{stats.totalInvested?.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
              </div>
              <div className="flex justify-between items-center text-[11px] font-bold text-gray-500">
                <span>Unrealized Gain (Tax)</span>
                <span className="text-[#111827]">₹{(stats.totalValue - stats.totalInvested).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Final Total at the far bottom right */}
      <div className="flex justify-end mt-6 pr-5">
        <div className="flex items-center gap-10">
          <span className="text-[13px] font-extrabold text-[#111827] uppercase tracking-tight">Total Portfolio Value</span>
          <span className="text-[15px] font-black text-[#111827]">₹{stats.totalValue?.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
        </div>
      </div>

      <div className="mt-20 pt-10 border-t border-gray-100 text-center">
        <p className="text-[8px] font-bold text-gray-300 uppercase tracking-[0.5em]">This is a system generated report — confidentiality guaranteed — wealth maestro system © 2026</p>
      </div>
    </div>
  )
}
