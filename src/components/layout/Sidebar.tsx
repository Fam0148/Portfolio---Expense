import { LayoutDashboard, ReceiptText, TrendingUp, ShieldCheck, Zap, LogOut, CheckCircle2, SlidersHorizontal, User } from "lucide-react"

interface SidebarProps {
  currentTab: 'portfolio' | 'expense' | 'assets' | string
  onSelectTab: (tab: 'portfolio' | 'expense') => void
  userName: string
  userEmail?: string
  handleLogout: () => void
  isMobileOpen?: boolean
  setIsMobileOpen?: (open: boolean) => void
}

export const Sidebar = ({
  currentTab,
  onSelectTab,
  userName,
  userEmail = "user@workspace.com",
  handleLogout
}: SidebarProps) => {
  return (
    <aside className="w-64 flex-shrink-0 bg-[#F9FAFB] border-r border-[#E5E7EB] flex flex-col justify-between p-5 min-h-screen select-none font-sans">
      <div className="space-y-6">
        {/* macOS Window Controls */}
        <div className="flex items-center justify-between pb-2">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-[#FF5F57] border border-[#E0443E]/40 shadow-2xs" />
            <div className="w-3 h-3 rounded-full bg-[#FEBC2E] border border-[#DEA123]/40 shadow-2xs" />
            <div className="w-3 h-3 rounded-full bg-[#28C840] border border-[#1AAB29]/40 shadow-2xs" />
          </div>
          <SlidersHorizontal size={14} className="text-[#9CA3AF] hover:text-[#111827] transition-colors cursor-pointer" />
        </div>

        {/* User Profile Header */}
        <div className="flex items-center gap-3 p-2 bg-white rounded-xl border border-[#E5E7EB] shadow-[0_1px_3px_rgba(0,0,0,0.03)]">
          <div className="w-9 h-9 rounded-lg bg-[#F3F4F6] border border-[#E5E7EB] flex items-center justify-center text-base shrink-0 overflow-hidden text-[#111827]">
            <User size={18} />
          </div>
          <div className="min-w-0 flex-1">
            <h4 className="text-xs font-semibold text-[#111827] truncate leading-tight">{userName}</h4>
            <p className="text-[10px] text-[#6B7280] truncate font-normal mt-0.5">{userEmail}</p>
          </div>
        </div>

        {/* MAIN Menu */}
        <div className="space-y-1">
          <p className="text-[10px] font-semibold tracking-wider text-[#9CA3AF] uppercase px-3 mb-2">Main</p>

          <button
            onClick={() => onSelectTab('portfolio')}
            className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-medium transition-all cursor-pointer ${
              currentTab === 'portfolio'
                ? 'bg-[#E5E7EB]/70 text-[#111827] font-semibold shadow-2xs'
                : 'text-[#6B7280] hover:text-[#111827] hover:bg-[#E5E7EB]/40'
            }`}
          >
            <LayoutDashboard size={15} className={currentTab === 'portfolio' ? 'text-[#111827]' : 'text-[#9CA3AF]'} />
            <span>Portfolio Overview</span>
          </button>

          <button
            onClick={() => onSelectTab('expense')}
            className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-medium transition-all cursor-pointer ${
              currentTab === 'expense'
                ? 'bg-[#E5E7EB]/70 text-[#111827] font-semibold shadow-2xs'
                : 'text-[#6B7280] hover:text-[#111827] hover:bg-[#E5E7EB]/40'
            }`}
          >
            <ReceiptText size={15} className={currentTab === 'expense' ? 'text-[#111827]' : 'text-[#9CA3AF]'} />
            <span>Expense Tracker</span>
          </button>
        </div>

        {/* ASSET CATEGORIES Menu */}
        <div className="space-y-1">
          <p className="text-[10px] font-semibold tracking-wider text-[#9CA3AF] uppercase px-3 mb-2">Modules</p>

          <div className="flex items-center justify-between px-3 py-2 text-xs font-medium text-[#6B7280] hover:text-[#111827] rounded-xl cursor-pointer hover:bg-[#E5E7EB]/40 transition-colors">
            <div className="flex items-center gap-2.5">
              <TrendingUp size={15} className="text-[#9CA3AF]" />
              <span>Stocks & Equities</span>
            </div>
            <span className="text-[10px] bg-blue-50 text-blue-600 px-1.5 py-0.5 rounded-full font-semibold">NSE</span>
          </div>

          <div className="flex items-center justify-between px-3 py-2 text-xs font-medium text-[#6B7280] hover:text-[#111827] rounded-xl cursor-pointer hover:bg-[#E5E7EB]/40 transition-colors">
            <div className="flex items-center gap-2.5">
              <ShieldCheck size={15} className="text-[#9CA3AF]" />
              <span>Fixed Yield Bonds</span>
            </div>
            <span className="text-[10px] bg-emerald-50 text-emerald-600 px-1.5 py-0.5 rounded-full font-semibold">YTM</span>
          </div>

          <div className="flex items-center justify-between px-3 py-2 text-xs font-medium text-[#6B7280] hover:text-[#111827] rounded-xl cursor-pointer hover:bg-[#E5E7EB]/40 transition-colors">
            <div className="flex items-center gap-2.5">
              <Zap size={15} className="text-[#9CA3AF]" />
              <span>Cashflow & Budget</span>
            </div>
            <span className="text-[10px] bg-amber-50 text-amber-600 px-1.5 py-0.5 rounded-full font-semibold">Monthly</span>
          </div>
        </div>
      </div>

      {/* SYSTEM Settings Footer */}
      <div className="space-y-2 pt-4 border-t border-[#E5E7EB]">
        <div className="flex items-center justify-between px-3 py-1.5 text-xs text-[#6B7280]">
          <div className="flex items-center gap-2">
            <CheckCircle2 size={13} className="text-emerald-500" />
            <span className="text-[11px] font-medium">Supabase Cloud</span>
          </div>
          <span className="text-[10px] text-emerald-600 font-semibold uppercase">Live</span>
        </div>

        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-medium text-rose-600 hover:bg-rose-50 transition-all cursor-pointer"
        >
          <LogOut size={15} />
          <span>Sign Out</span>
        </button>
      </div>
    </aside>
  )
}
