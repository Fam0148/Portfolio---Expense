import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Background } from "../auth/Background"


interface OnboardingSlideshowProps {
  onComplete: (choice: 'portfolio' | 'expense' | 'profile') => void
}

type Slide = {
  id: number
  title: string
  description: string
  icon?: React.ReactNode
  image?: string
}

export const OnboardingSlideshow = ({ onComplete }: OnboardingSlideshowProps) => {
  const [currentIndex, setCurrentIndex] = useState(0)
  const [direction, setDirection] = useState(0) // 1 for next, -1 for previous

  const slides: Slide[] = [
    {
      id: 0,
      title: "Unified Wealth View",
      description: "One place for your stocks, bonds, and daily expenses. Get a 360-degree perspective of your financial health.",
      image: "/assets/unified health.png"
    },
    {
      id: 1,
      title: "Stock & Bond Tracker",
      description: "Real-time NSE/BSE performance tracking. Automated asset averaging and historical gain/loss analysis.",
      image: "/assets/stock and bond tracker.png"
    },
    {
      id: 2,
      title: "Smart Spending",
      description: "Monitor every rupee effortlessly. Advanced categorization helps you identify where your money goes.",
      image: "/assets/smart spending.png"
    },
    {
      id: 3,
      title: "Secure & Private",
      description: "Your data is encrypted and strictly confidential. Bank-grade security for your personal wealth info.",
      image: "/assets/security.png"
    }
  ]

  const handleNext = () => {
    if (currentIndex < slides.length - 1) {
      setDirection(1)
      setCurrentIndex(currentIndex + 1)
    } else {
      onComplete('portfolio')
    }
  }

  const handlePrev = () => {
    if (currentIndex > 0) {
      setDirection(-1)
      setCurrentIndex(currentIndex - 1)
    }
  }

  return (
    <Background>
      <div className="w-full min-h-screen flex items-center justify-center p-6 font-sans relative">
        <motion.div 
          initial={{ opacity: 0, scale: 0.98, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          className="w-full max-w-[440px] bg-white rounded-lg overflow-hidden shadow-[0_40px_80px_-20px_rgba(0,0,0,0.12)] flex flex-col relative"
        >

          {/* Minimal Pure White Header */}
          <div className="h-[260px] w-full bg-white relative flex items-center justify-center overflow-hidden border-b border-gray-100/50">
            {/* Decorative Patterns & Grid Lines */}
            <div className="absolute inset-0 opacity-[0.03] pointer-events-none">
              <div
                className="absolute inset-0"
                style={{
                  backgroundImage: `repeating-linear-gradient(45deg, #000 0px, #000 0.5px, transparent 0.5px, transparent 20px)`,
                }}
              />
              <div
                className="absolute inset-0"
                style={{
                  backgroundImage: `repeating-linear-gradient(-45deg, #000 0px, #000 0.5px, transparent 0.5px, transparent 20px)`,
                }}
              />
              <div className="absolute top-1/2 left-3 -translate-y-1/2 w-24 h-48 border-y border-r border-black rounded-r-2xl" />
              <div className="absolute top-1/2 right-3 -translate-y-1/2 w-24 h-48 border-y border-l border-black rounded-l-2xl" />
            </div>

            {/* Central Illustration - Floating on White */}
            <AnimatePresence mode="wait" custom={direction}>
              <motion.div
                key={currentIndex}
                custom={direction}
                initial={{ x: direction * 80, opacity: 0, rotate: direction * 5 }}
                animate={{ x: 0, opacity: 1, rotate: 0 }}
                exit={{ x: -direction * 80, opacity: 0, rotate: -direction * 5 }}
                transition={{ duration: 0.5, ease: [0.33, 1, 0.68, 1] }}
                className="relative z-10 w-56 h-56 flex items-center justify-center text-center"
              >
                <img
                  src={slides[currentIndex].image}
                  alt={slides[currentIndex].title}
                  className="w-full h-full object-contain"
                />
              </motion.div>
            </AnimatePresence>
          </div>

          <div className="p-8 pt-8 text-center flex flex-col items-center">
            <AnimatePresence mode="wait" custom={direction}>
              <motion.div
                key={currentIndex}
                custom={direction}
                initial={{ x: direction * 30, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                exit={{ x: -direction * 30, opacity: 0 }}
                transition={{ duration: 0.4, ease: "easeOut" }}
                className="flex flex-col items-center w-full"
              >
                <div className="px-3 py-1 bg-blue-50 border border-blue-100 rounded-full mb-8">
                  <span className="text-blue-700 text-[11px] font-bold tracking-wider">
                    STEP {currentIndex + 1} OF {slides.length}
                  </span>
                </div>

                <h2 className="text-[#171717] text-[24px] font-bold tracking-tight mb-3 leading-tight">
                  {slides[currentIndex].title}
                </h2>

                <p className="text-[#737373] text-[14px] leading-[1.6] max-w-[300px] mb-8 font-medium">
                  {slides[currentIndex].description}
                </p>

                <div className="flex gap-3 w-full mt-2">
                  {currentIndex > 0 && (
                    <button
                      onClick={handlePrev}
                      className="flex-1 py-4 border border-[#E5E5E5] hover:bg-[#F5F5F5] rounded-md text-[#737373] hover:text-[#171717] text-[14px] font-bold tracking-wider transition-all"
                    >
                      PREVIOUS
                    </button>
                  )}
                  <button 
                    onClick={handleNext}
                    className="flex-1 py-4 bg-blue-600 hover:bg-blue-700 rounded-md text-white text-[14px] font-bold transition-all flex items-center justify-center active:scale-98 shadow-sm"
                  >
                    <span>{currentIndex === slides.length - 1 ? 'Get Started' : 'Next Step'}</span>
                  </button>
                </div>
              </motion.div>
            </AnimatePresence>

            {/* Micro Pagination */}
            <div className="flex gap-2 mt-8 mb-2">
              {slides.map((_, idx) => (
                <div
                  key={idx}
                  className={`h-1 rounded-full transition-all duration-300 ${idx === currentIndex ? 'w-5 bg-blue-600' : 'w-1.5 bg-[#E5E5E5]'}`}
                />
              ))}
            </div>
          </div>
        </motion.div>
      </div>
    </Background>
  )
}
