import { useEffect, useState } from "react"
import { supabase } from "../../lib/supabase"

interface StatementViewProps {
  userName: string
  stocks: any[]
  stats: any
}

export const StatementView = ({ userName, stocks, stats }: StatementViewProps) => {
  const [logs, setLogs] = useState<any[]>([])
  const dateIssued = new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
  const portfolioId = stats.userId ? stats.userId.slice(0, 8).toUpperCase() : "PORT-MAIN"

  useEffect(() => {
    const fetchLogs = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      const { data } = await supabase.from('stock_logs')
        .select('*')
        .eq('user_id', user.id)
        .order('transaction_date', { ascending: false })
      setLogs(data || [])
    }
    fetchLogs()
  }, [])

  const stockHoldings = stocks.filter(s => s.asset_type_c === 'STOCK')
  const bondHoldings = stocks.filter(s => s.asset_type_c === 'BOND')

  const getMaturityDate = (purchaseDate: string, tenure: string) => {
    const months = parseInt(tenure?.replace(/\D/g, '') || '0');
    if (months <= 0) return purchaseDate;
    const date = new Date(purchaseDate);
    date.setMonth(date.getMonth() + months);
    return date.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
  };

  return (
    <div id="portfolio-statement" className="bg-white p-[60px] max-w-[800px] mx-auto text-[#1F2937] font-sans printable-content shadow-lg border border-gray-100">
      <style>{`
        @media screen {
          .print-only-container { display: none !important; }
        }
        @media print {
          body { 
            margin: 0 !important; 
            padding: 0 !important; 
            background: white; 
          }
          .no-print { display: none !important; }
          .print-only-container { display: block !important; }
          
          #portfolio-statement {
            width: 100%;
            margin: 0 auto;
            padding: 15mm; /* Simulated page margin to replace the @page margin */
            background: white;
            box-shadow: none;
            border: none;
            box-sizing: border-box;
          }
          
          @page { margin: 0; size: A4; }
        }
      `}</style>

      {/* Header */}
      <div className="flex justify-between items-start mb-12 border-b border-gray-100 pb-8">
        <div>
          <h1 className="text-[32px] font-bold text-[#111827] tracking-tight mb-2">PORTFOLIO STATEMENT</h1>
          <h2 className="text-lg font-bold text-gray-500">Account: <span className="text-[#111827]">{userName}</span></h2>
        </div>
        <div className="text-right text-[11px] font-bold text-gray-400 uppercase tracking-widest space-y-1 mt-3">
          <p>DATE ISSUED: <span className="text-[#111827]">{dateIssued}</span></p>
          <p>PORTFOLIO ID: <span className="text-[#111827]">#{portfolioId}</span></p>
        </div>
      </div>

      {/* Current Assets / Stock Holdings */}
      <div className="mb-10">
        <h3 className="text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-6 border-b border-gray-50 pb-2">CURRENT ASSET / STOCK HOLDINGS</h3>
        <table className="w-full text-left">
          <thead>
            <tr className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">
              <th className="py-2 px-0">DESCRIPTION</th>
              <th className="py-2 px-0 text-center">QTY</th>
              <th className="py-2 px-0 text-center">AVG PRICE</th>
              <th className="py-2 px-0 text-center">MARKET PRICE</th>
              <th className="py-2 px-0 text-right">SUBTOTAL</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {stockHoldings.length > 0 ? stockHoldings.map((s, i) => (
              <tr key={i} className="text-[13px] font-medium text-[#374151]">
                <td className="py-4 px-0 font-bold">{s.symbol}</td>
                <td className="py-4 px-0 text-center">{s.quantity}</td>
                <td className="py-4 px-0 text-center">Rs. {s.purchase_price.toLocaleString()}</td>
                <td className="py-4 px-0 text-center">Rs. {s.current_p.toLocaleString()}</td>
                <td className="py-4 px-0 text-right font-bold text-[#111827]">Rs. {(s.quantity * s.current_p).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
              </tr>
            )) : (
                <tr><td colSpan={5} className="py-8 text-center text-gray-400 italic text-xs">No stock holdings recorded</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Bonds / Fixed Income */}
      <div className="mb-10">
        <h3 className="text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-6 border-b border-gray-50 pb-2">BONDS / FIXED INCOME ASSETS</h3>
        <table className="w-full text-left">
          <thead>
            <tr className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">
              <th className="py-2 px-0">DESCRIPTION</th>
              <th className="py-2 px-0 text-center">PRINCIPAL</th>
              <th className="py-2 px-0 text-center">YTM</th>
              <th className="py-2 px-0 text-center">ACCRUED PROFIT</th>
              <th className="py-2 px-0 text-right">MATURITY</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {bondHoldings.length > 0 ? bondHoldings.map((s, i) => (
              <tr key={i} className="text-[13px] font-medium text-[#374151]">
                <td className="py-4 px-0 font-bold">{s.symbol}</td>
                <td className="py-4 px-0 text-center">Rs. {(s.purchase_price * s.quantity).toLocaleString()}</td>
                <td className="py-4 px-0 text-center">{s.ytm}%</td>
                <td className="py-4 px-0 text-center">Rs. {stats.bondProfitDetails?.[s.id]?.toFixed(0) || 0}</td>
                <td className="py-4 px-0 text-right">{getMaturityDate(s.purchase_date, s.tenure)}</td>
              </tr>
            )) : (
                <tr><td colSpan={5} className="py-8 text-center text-gray-400 italic text-xs">No fixed income assets recorded</td></tr>
            )}
          </tbody>
        </table>
      </div>


      {/* Full Activity Log */}
      <div className="mb-6">
        <h3 className="text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-6 border-b border-gray-50 pb-2">FULL ACTIVITY LOG</h3>
        <table className="w-full text-left">
          <thead>
            <tr className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">
              <th className="py-2 px-0 font-bold">DATE</th>
              <th className="py-2 px-0 font-bold">SYMBOL</th>
              <th className="py-2 px-0 font-bold">TYPE</th>
              <th className="py-2 px-0 font-bold">QTY</th>
              <th className="py-2 px-0 font-bold">PRICE</th>
              <th className="py-2 px-0 text-right font-bold">AMOUNT</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {logs.filter(log => stocks.some(s => s.symbol === log.symbol)).length > 0 ? (
              logs.filter(log => stocks.some(s => s.symbol === log.symbol)).map((log, i) => (
                <tr key={i} className="text-[12px] text-gray-600">
                  <td className="py-3 px-0">{new Date(log.transaction_date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}</td>
                  <td className="py-3 px-0 font-bold text-[#111827]">{log.symbol}</td>
                  <td className="py-3 px-0 capitalize">{log.type.toLowerCase()}</td>
                  <td className="py-3 px-0">{log.quantity}</td>
                  <td className="py-3 px-0">Rs. {Number(log.price).toLocaleString()}</td>
                  <td className="py-3 px-0 text-right font-bold text-[#111827]">Rs. {(log.quantity * log.price).toLocaleString(undefined, { minimumFractionDigits: 1, maximumFractionDigits: 1 })}</td>
                </tr>
              ))
            ) : (
                <tr><td colSpan={6} className="py-8 text-center text-gray-400 italic text-xs">No recent activity for current assets</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Totals Summary Row */}
      <div className="flex justify-between items-center pt-6 border-t border-gray-100 mb-8 break-inside-avoid">
        <div className="space-y-1 text-left">
          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">TOTAL INVESTMENT</p>
          <p className="text-[20px] font-bold text-[#111827]">Rs. {stats.totalInvested?.toLocaleString(undefined, { minimumFractionDigits: 1, maximumFractionDigits: 1 })}</p>
          <div className="text-[9px] text-gray-400">
            Stocks: {stats.stockInvested?.toLocaleString()} | Bonds: {stats.bondInvested?.toLocaleString()}
          </div>
        </div>
        <div className="space-y-1 text-center">
          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">OVERALL P&L</p>
          <p className={`text-[20px] font-bold ${(stats.totalValue - stats.totalInvested) >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
            {stats.totalValue - stats.totalInvested >= 0 ? '+' : '-'}Rs. {Math.abs(stats.totalValue - stats.totalInvested).toLocaleString(undefined, { minimumFractionDigits: 1, maximumFractionDigits: 1 })}
          </p>
          <div className="text-[9px] text-gray-400">
            {stats.stockYield?.toFixed(1)}% ROI Status
          </div>
        </div>
        <div className="space-y-1 text-right">
          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">TOTAL PORTFOLIO VALUE</p>
          <p className="text-[28px] font-extrabold text-[#F43F5E] leading-none">Rs. {stats.totalValue?.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
        </div>
      </div>
    </div>
  )
}
