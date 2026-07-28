import { useState } from "react"
import { Background } from "../auth/Background"
import { Check, LayoutDashboard, ReceiptText, Settings, Sparkles } from "lucide-react"

interface OnboardingChoiceProps {
  onSelect: (choice: 'portfolio' | 'expense' | 'profile') => void
}

type ChoiceId = 'portfolio' | 'expense' | 'profile';

export const OnboardingChoice = ({ onSelect }: OnboardingChoiceProps) => {
  const [selected, setSelected] = useState<ChoiceId>('portfolio');

  const handleContinue = () => {
    onSelect(selected);
  }

  const choices: { id: ChoiceId; title: string; desc: string; icon: React.ReactNode }[] = [
    {
      id: 'portfolio',
      title: 'Portfolio',
      desc: 'Track assets, net worth & analyze risk.',
      icon: <LayoutDashboard className="w-4 h-4 text-[#111827]" />
    },
    {
      id: 'expense',
      title: 'Expense',
      desc: 'Manage budgets and track cash flow.',
      icon: <ReceiptText className="w-4 h-4 text-[#111827]" />
    },
    {
      id: 'profile',
      title: 'Profile',
      desc: 'Preferences, security & account setup.',
      icon: <Settings className="w-4 h-4 text-[#111827]" />
    }
  ];

  return (
    <Background>
      <div className="w-full min-h-screen flex flex-col items-center justify-center p-4 font-sans text-[#111827]">
        <div className="w-full max-w-[540px] bg-white rounded-2xl border border-[#E5E7EB] p-6 sm:p-8 space-y-6 shadow-[0_2px_12px_rgba(0,0,0,0.04)]">

          <div className="flex items-center gap-3.5">
            <div className="w-10 h-10 rounded-xl bg-[#F4F5F7] border border-[#E5E7EB] flex items-center justify-center text-lg">
              <Sparkles className="w-5 h-5 text-[#111827]" />
            </div>
            <div>
              <h1 className="text-lg font-semibold text-[#111827] tracking-tight">
                Select Workspace Module
              </h1>
              <p className="text-xs text-[#6B7280] font-medium">Choose your starting module. You can switch anytime.</p>
            </div>
          </div>

          <hr className="border-[#E5E7EB]" />

          {/* Module Selection Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {choices.map((item) => {
              const isSelected = selected === item.id;
              return (
                <div
                  key={item.id}
                  onClick={() => setSelected(item.id)}
                  className={`relative p-4 rounded-xl cursor-pointer flex flex-col items-center text-center transition-all border ${
                    isSelected 
                      ? 'bg-white border-[#111827] shadow-xs ring-1 ring-[#111827]' 
                      : 'bg-[#F4F5F7] border-[#E5E7EB] hover:bg-[#E5E7EB]/60'
                  }`}
                >
                  {isSelected && (
                    <Check className="absolute top-3 right-3 w-3.5 h-3.5 text-[#111827]" />
                  )}

                  <div className="w-9 h-9 mb-2.5 bg-white rounded-xl border border-[#E5E7EB] flex items-center justify-center shadow-2xs">
                    <div className={isSelected ? 'text-[#111827]' : 'text-[#6B7280]'}>
                      {item.id === 'portfolio' ? (
                        <LayoutDashboard className="w-4 h-4" />
                      ) : item.id === 'expense' ? (
                        <ReceiptText className="w-4 h-4" />
                      ) : (
                        <Settings className="w-4 h-4" />
                      )}
                    </div>
                  </div>

                  <h3 className="font-semibold text-sm text-[#111827]">{item.title}</h3>
                  <p className="text-[11px] text-[#6B7280] mt-1 leading-snug">{item.desc}</p>
                </div>
              )
            })}
          </div>

          <p className="text-xs text-[#6B7280] leading-relaxed font-normal">
            By clicking "Continue", you will open your personal workspace with the selected configuration.
          </p>

          <hr className="border-[#E5E7EB]" />

          <button
            onClick={handleContinue}
            className="w-full bg-[#111827] hover:bg-[#1F2937] text-white rounded-xl py-3 flex items-center justify-center gap-2 font-medium text-sm transition-all shadow-[0_1px_2px_rgba(0,0,0,0.06)] border border-[#111827] cursor-pointer"
          >
            <Check className="w-4 h-4" />
            <span>Continue to Workspace</span>
          </button>

        </div>
      </div>
    </Background>
  )
}
