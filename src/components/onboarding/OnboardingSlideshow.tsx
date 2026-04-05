import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Background } from "../auth/Background"
import { PieChart, TrendingUp, Wallet, Lock } from "lucide-react"

interface OnboardingSlideshowProps {
  onComplete: (choice: 'portfolio' | 'expense' | 'profile') => void
}

type Slide = {
  id: number
  title: string
  description: string
  icon: React.ReactNode
}

export const OnboardingSlideshow = ({ onComplete }: OnboardingSlideshowProps) => {
  const [currentIndex, setCurrentIndex] = useState(0)

  const slides: Slide[] = [
    {
      id: 0,
      title: "Unified Wealth View",
      description: "One place for your Stocks, Bonds, and Daily Expenses. Get a 360-degree perspective of your financial health.",
      icon: <PieChart className="w-8 h-8 text-[#171717]" />
    },
    {
      id: 1,
      title: "Stock & Bond Tracker",
      description: "Real-time NSE/BSE performance tracking. Automated asset averaging and historical gain/loss analysis.",
      icon: <TrendingUp className="w-8 h-8 text-[#171717]" />
    },
    {
      id: 2,
      title: "Smart Spending",
      description: "Monitor every rupee effortlessly. Advanced categorization helps you identify where your money goes.",
      icon: <Wallet className="w-8 h-8 text-[#171717]" />
    },
    {
      id: 3,
      title: "Secure & Private",
      description: "Your data is encrypted and strictly confidential. Bank-grade security for your personal wealth info.",
      icon: <Lock className="w-8 h-8 text-[#171717]" />
    }
  ]

  const handleNext = () => {
    if (currentIndex < slides.length - 1) {
      setCurrentIndex(currentIndex + 1)
    } else {
      onComplete('portfolio')
    }
  }

  return (
    <Background>
      <div className="w-full min-h-screen flex items-center justify-center p-6 font-sans relative">
        <motion.div 
          initial={{ opacity: 0, scale: 0.98, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          className="w-full max-w-[380px] bg-white rounded-xl overflow-hidden shadow-[0_40px_80px_-20px_rgba(0,0,0,0.12)] flex flex-col relative"
        >
          {/* Minimal Dark Header */}
          <div className="h-[150px] w-full bg-gradient-to-br from-[#1A1A1A] to-[#0A0A0A] relative flex items-center justify-center overflow-hidden">
            {/* Decorative Patterns */}
            <div className="absolute inset-0 opacity-5 pointer-events-none">
              <div className="absolute top-1/2 left-3 -translate-y-1/2 w-20 h-40 border-y border-r border-white rounded-r-lg" />
              <div className="absolute top-1/2 right-3 -translate-y-1/2 w-20 h-40 border-y border-l border-white rounded-l-lg" />
            </div>

            {/* Central Icon */}
            <motion.div 
              key={currentIndex}
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ type: "spring", stiffness: 200, damping: 15 }}
              className="relative z-10 w-16 h-16 bg-white rounded-lg shadow-2xl flex items-center justify-center"
            >
              {slides[currentIndex].icon}
            </motion.div>
          </div>

          <div className="p-8 pt-8 text-center flex flex-col items-center">
            <AnimatePresence mode="wait">
              <motion.div 
                key={currentIndex}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.3 }}
                className="flex flex-col items-center w-full"
              >
                {/* Step Indicator Badge */}
                <div className="px-2.5 py-1 bg-[#F5F5F5] border border-[#E5E5E5] rounded-md mb-5">
                  <span className="text-[#525252] text-[11px] font-bold tracking-wider">
                    STEP {currentIndex + 1} OF {slides.length}
                  </span>
                </div>

                {/* Minimal Title */}
                <h2 className="text-[#171717] text-[24px] font-bold tracking-tight mb-3 leading-tight">
                  {slides[currentIndex].title}
                </h2>

                {/* Description */}
                <p className="text-[#737373] text-[14px] leading-[1.6] max-w-[300px] mb-8 font-medium">
                  {slides[currentIndex].description}
                </p>

                {/* Black Action Button */}
                <button 
                  onClick={handleNext}
                  className="w-full py-3.5 bg-[#171717] hover:bg-black rounded-lg text-white text-[15px] font-bold transition-all flex items-center justify-center active:scale-98 shadow-xl shadow-black/10"
                >
                  <span>{currentIndex === slides.length - 1 ? 'Get Started' : 'Next Step'}</span>
                </button>
              </motion.div>
            </AnimatePresence>

            {/* Micro Pagination */}
            <div className="flex gap-2 mt-6">
              {slides.map((_, idx) => (
                <div 
                  key={idx}
                  className={`h-1 rounded-full transition-all duration-300 ${idx === currentIndex ? 'w-5 bg-[#171717]' : 'w-1.5 bg-[#E5E5E5]'}`}
                />
              ))}
            </div>
          </div>
        </motion.div>
      </div>
    </Background>
  )
}
