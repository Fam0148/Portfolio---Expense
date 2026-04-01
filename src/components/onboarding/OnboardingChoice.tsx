import { useState } from "react"
import { Background } from "../auth/Background"
import { Check, LayoutDashboard, ReceiptText, Settings } from "lucide-react"

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
      icon: <LayoutDashboard className="w-5 h-5 text-gray-600" />
    },
    {
      id: 'expense',
      title: 'Expense',
      desc: 'Manage budgets and track cash flow.',
      icon: <ReceiptText className="w-5 h-5 text-gray-600" />
    },
    {
      id: 'profile',
      title: 'Profile',
      desc: 'Preferences, security & account setup.',
      icon: <Settings className="w-5 h-5 text-gray-600" />
    }
  ];

  return (
    <Background>
      <div className="w-full min-h-screen flex flex-col items-center justify-center p-4 font-sans">
        <div className="w-full max-w-[600px] bg-white rounded-2xl border border-gray-100 p-8 space-y-7">
          
          <h1 className="text-[28px] font-serif font-bold text-[#171717]">
            Select Module
          </h1>

          <hr className="border-gray-100" />



          {/* Module Selection Segmented Control */}
          <div className="space-y-3">
            
            <div className="grid grid-cols-1 md:grid-cols-3 border border-gray-200 rounded-2xl bg-white h-auto min-h-[170px]">
              {choices.map((item, idx) => {
                const isSelected = selected === item.id;
                return (
                  <div 
                    key={item.id}
                    onClick={() => setSelected(item.id)}
                    className={`relative p-5 cursor-pointer flex flex-col items-center justify-center text-center transition-all duration-300 ease-in-out ${
                       !isSelected && idx !== 2 ? 'md:border-r border-b md:border-b-0 border-gray-100 ' : ''
                    } ${
                       isSelected ? 'bg-white scale-[1.04] ring-1 ring-[#171717] rounded-[18px] z-20' : 'bg-transparent hover:bg-gray-50'
                    } ${
                       idx === 0 && !isSelected ? 'rounded-t-2xl md:rounded-l-2xl md:rounded-tr-none' : ''
                    } ${
                       idx === 2 && !isSelected ? 'rounded-b-2xl md:rounded-r-2xl md:rounded-bl-none' : ''
                    }`}
                  >
                    {/* Ring selection overlapping borders */}
                    {isSelected && (
                      <Check className="absolute top-4 right-4 w-4 h-4 text-[#171717]" />
                    )}
                    
                    {/* Icon container */}
                    <div className="w-10 h-10 mb-3 bg-white rounded-xl border border-gray-100 flex items-center justify-center">
                      <div className={isSelected ? 'text-[#171717]' : 'text-gray-500'}>
                         {item.id === 'portfolio' ? (
                          <LayoutDashboard className="w-5 h-5" />
                        ) : item.id === 'expense' ? (
                          <ReceiptText className="w-5 h-5" />
                        ) : (
                          <Settings className="w-5 h-5" />
                        )}
                      </div>
                    </div>

                    <h3 className="font-serif font-bold text-[18px] text-[#171717]">{item.title}</h3>
                    <p className="text-[12px] text-gray-500 mt-1.5 leading-snug px-1 max-w-[150px]">{item.desc}</p>
                  </div>
                )
              })}
            </div>
          </div>

          <div className="pt-2">
            <p className="text-[13px] text-gray-500 leading-relaxed font-medium">
              By clicking the "Continue" button, I acknowledge that I understand the capabilities and limitations of the selected module and consent to the processing of my inputs as described in the Terms of Service.
            </p>
          </div>

          <hr className="border-gray-100" />

          <button 
            onClick={handleContinue}
            className="w-full bg-[#171717] hover:bg-[#262626] text-white rounded-[10px] py-3 flex items-center justify-center gap-2 font-bold text-[15px] transition-colors"
          >
            <Check className="w-4 h-4" />
            Continue
          </button>

        </div>
      </div>
    </Background>
  )
}
