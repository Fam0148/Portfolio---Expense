import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { X, FileUp, Sparkles, Loader2, Check, AlertCircle } from "lucide-react"
import Papa from "papaparse"
import { analyzeAssetStatement } from "../../lib/gemini"
import { supabase } from "../../lib/supabase"

interface AIImportModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
}

export const AIImportModal = ({ isOpen, onClose, onSuccess }: AIImportModalProps) => {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [extractedAssets, setExtractedAssets] = useState<any[]>([])
  const [status, setStatus] = useState<'idle' | 'analyzing' | 'preview' | 'importing' | 'complete'>('idle')

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setLoading(true)
    setError(null)
    setStatus('analyzing')

    try {
      let content = ""
      if (file.name.endsWith('.csv')) {
        content = await new Promise<string>((resolve) => {
          Papa.parse(file, {
            complete: (results: Papa.ParseResult<any>) => resolve(JSON.stringify(results.data)),
            header: true
          })
        })
      } else {
        content = await file.text()
      }

      const assets = await analyzeAssetStatement(content)
      setExtractedAssets(assets)
      setStatus('preview')
    } catch (err: any) {
      setError(err.message || "Failed to process file")
      setStatus('idle')
    } finally {
      setLoading(false)
    }
  }

  const handleImport = async () => {
    setLoading(true)
    setStatus('importing')
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error("User not authenticated")

      const assetsToInsert = extractedAssets.map(asset => ({
        ...asset,
        user_id: user.id,
      }))

      const { error: insertError } = await supabase.from('stocks').insert(assetsToInsert)
      if (insertError) throw insertError

      // Log the imports
      try {
        const logs = assetsToInsert.map(asset => ({
          user_id: user.id,
          symbol: asset.symbol,
          quantity: asset.quantity,
          price: asset.purchase_price,
          transaction_date: asset.purchase_date,
          type: 'BUY'
        }))
        await supabase.from('stock_logs').insert(logs)
      } catch (logErr) {
        console.warn("Log tracking failed, but assets were imported.")
      }

      setStatus('complete')
      setTimeout(() => {
        onSuccess()
        onClose()
        // Reset state
        setStatus('idle')
        setExtractedAssets([])
      }, 1500)
    } catch (err: any) {
      setError(err.message || "Import failed")
      setStatus('preview')
    } finally {
      setLoading(false)
    }
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[400] flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
          />
          <motion.div
            initial={{ scale: 0.9, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0, y: 20 }}
            className="relative bg-white w-full max-w-2xl rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
          >
            {/* Header */}
            <div className="p-6 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center text-white shadow-lg shadow-blue-100">
                  <Sparkles size={20} />
                </div>
                <div>
                  <h3 className="text-xl font-serif font-bold text-gray-900">AI Statement Import</h3>
                  <p className="text-xs text-gray-500 font-sans">Auto-analyze files to extract your holdings</p>
                </div>
              </div>
              <button onClick={onClose} className="p-2 hover:bg-white rounded-lg text-gray-400 border border-transparent hover:border-gray-100 transition-all">
                <X size={20} />
              </button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-8">
              {status === 'idle' && (
                <div className="flex flex-col items-center justify-center py-12 border-2 border-dashed border-gray-200 rounded-2xl transition-all hover:border-blue-400 group">
                  <div className="w-16 h-16 bg-blue-50 rounded-full flex items-center justify-center text-blue-600 mb-4 group-hover:scale-110 transition-transform">
                    <FileUp size={32} />
                  </div>
                  <h4 className="text-lg font-bold text-gray-900 mb-1">Upload your statement</h4>
                  <p className="text-sm text-gray-500 text-center max-w-xs mb-8">
                    Upload a CSV or text-based statement. Our AI will automatically identify your stocks and bonds.
                  </p>
                  <label className="px-8 py-3 bg-gray-900 text-white rounded-lg font-bold text-sm cursor-pointer hover:bg-black transition-all active:scale-95 shadow-lg shadow-gray-200">
                    Choose File
                    <input type="file" className="hidden" accept=".csv,.txt" onChange={handleFileUpload} />
                  </label>
                  <p className="text-[10px] text-gray-400 mt-4 uppercase tracking-widest font-bold">Supports CSV, TXT, JSON</p>
                </div>
              )}

              {(status === 'analyzing' || status === 'importing') && (
                <div className="flex flex-col items-center justify-center py-20">
                  <Loader2 size={48} className="text-blue-600 animate-spin mb-6" />
                  <h4 className="text-xl font-bold text-gray-900 mb-2">
                    {status === 'analyzing' ? 'AI is analyzing your file...' : 'Importing your assets...'}
                  </h4>
                  <p className="text-sm text-gray-500 text-center max-w-xs">
                    Please wait a moment while we process the data.
                  </p>
                </div>
              )}

              {status === 'preview' && (
                <div className="space-y-6">
                  <div className="flex items-center justify-between mb-4">
                    <h4 className="font-bold text-gray-900 flex items-center gap-2">
                      <Check size={18} className="text-green-500" />
                      Extracted Assets ({extractedAssets.length})
                    </h4>
                    <span className="text-xs text-blue-600 bg-blue-50 px-2 py-1 rounded font-bold uppercase tracking-wider">Review Required</span>
                  </div>
                  
                  <div className="border border-gray-100 rounded-xl overflow-hidden shadow-sm">
                    <table className="w-full text-left text-sm">
                      <thead className="bg-gray-50 border-b border-gray-100">
                        <tr>
                          <th className="px-4 py-3 font-bold text-gray-500 text-[10px] uppercase">Asset</th>
                          <th className="px-4 py-3 font-bold text-gray-500 text-[10px] uppercase">Type</th>
                          <th className="px-4 py-3 font-bold text-gray-500 text-[10px] uppercase">Qty</th>
                          <th className="px-4 py-3 font-bold text-gray-500 text-[10px] uppercase text-right">Price</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-50">
                        {extractedAssets.map((asset, i) => (
                          <tr key={i} className="hover:bg-gray-50/50 transition-colors">
                            <td className="px-4 py-3">
                              <div className="flex flex-col">
                                <span className="font-bold text-gray-900">{asset.symbol}</span>
                                <span className="text-[10px] text-gray-400 mt-0.5">{asset.purchase_date}</span>
                              </div>
                            </td>
                            <td className="px-4 py-3">
                              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${asset.asset_type === 'BOND' ? 'bg-emerald-50 text-emerald-600' : 'bg-blue-50 text-blue-600'}`}>
                                {asset.asset_type}
                              </span>
                            </td>
                            <td className="px-4 py-3 font-medium text-gray-700">{asset.quantity}</td>
                            <td className="px-4 py-3 font-bold text-gray-900 text-right">₹{asset.purchase_price.toLocaleString()}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  <div className="p-4 bg-blue-50 border border-blue-100 rounded-xl flex gap-3">
                    <AlertCircle className="text-blue-500 flex-shrink-0" size={20} />
                    <p className="text-xs text-blue-700 leading-relaxed">
                      AI has processed your file. Please verify the symbol, quantity, and price. 
                      Once you confirm, these will be added to your portfolio.
                    </p>
                  </div>
                </div>
              )}

              {status === 'complete' && (
                <div className="flex flex-col items-center justify-center py-20 text-center">
                  <div className="w-20 h-20 bg-green-50 text-green-500 rounded-full flex items-center justify-center mb-6">
                    <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: "spring", stiffness: 200, damping: 10 }}>
                      <Check size={40} strokeWidth={3} />
                    </motion.div>
                  </div>
                  <h4 className="text-2xl font-serif font-bold text-gray-900 mb-2">Import Successful!</h4>
                  <p className="text-sm text-gray-500">
                    Your assets have been successfully added to your portfolio.
                  </p>
                </div>
              )}

              {error && (
                <div className="mt-6 p-4 bg-rose-50 border border-rose-100 rounded-xl flex items-center gap-3">
                  <AlertCircle className="text-rose-500 flex-shrink-0" size={20} />
                  <p className="text-sm text-rose-700 font-medium">{error}</p>
                  <button onClick={() => { setError(null); setStatus('idle'); }} className="ml-auto text-xs font-bold text-rose-800 underline">Try Again</button>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="p-6 border-t border-gray-100 flex items-center justify-end gap-3 bg-gray-50/50">
              {status === 'preview' ? (
                <>
                  <button
                    onClick={() => setStatus('idle')}
                    className="px-6 py-2.5 rounded-lg text-sm font-bold text-gray-500 hover:text-gray-700 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleImport}
                    className="px-8 py-2.5 bg-blue-600 text-white rounded-lg font-bold text-sm hover:bg-blue-700 transition-all shadow-lg shadow-blue-100"
                  >
                    Confirm & Import
                  </button>
                </>
              ) : (
                <button
                  disabled={loading || status === 'complete'}
                  onClick={onClose}
                  className="px-6 py-2.5 rounded-lg text-sm font-bold text-gray-400 hover:text-gray-600 transition-colors border border-transparent hover:border-gray-200"
                >
                  Close
                </button>
              )}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  )
}
