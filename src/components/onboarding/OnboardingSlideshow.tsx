import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Background } from "../auth/Background"
import { X, ChevronRight, LayoutDashboard, ReceiptText, ShieldCheck, Zap } from "lucide-react"

interface OnboardingSlideshowProps {
  onComplete: (choice: 'portfolio' | 'expense' | 'profile') => void
}

type Slide = {
  id: number
  title: string
  description: string
  icon: React.ReactNode
  imagePath?: string
}

export const OnboardingSlideshow = ({ onComplete }: OnboardingSlideshowProps) => {
  const [currentIndex, setCurrentIndex] = useState(0)

  const slides: Slide[] = [
    {
      id: 0,
      title: "Master Your Wealth",
      description: "Get a 360-degree view of your investments. Track assets, net worth, and analyze risk in real-time.",
      icon: <LayoutDashboard className="w-8 h-8 text-white" />
    },
    {
      id: 1,
      title: "Effortless Expense Tracking",
      description: "Categorize every spend automatically. Identify leakages and save more for what matters.",
      icon: <ReceiptText className="w-8 h-8 text-white" />
    },
    {
      id: 2,
      title: "Secure and Private",
      description: "Your data is yours alone. We use military-grade encryption to ensure your financial privacy.",
      icon: <ShieldCheck className="w-8 h-8 text-white" />
    },
    {
      id: 3,
      title: "Seamless Experience",
      description: "A premium interface designed for focus. Simple, powerful, and built to improve your life.",
      icon: <Zap className="w-8 h-8 text-white" />
    }
  ]

  const handleNext = () => {
    if (currentIndex < slides.length) {
      setCurrentIndex(currentIndex + 1)
    }
  }

  const handleBack = () => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1)
    }
  }



  return (
    <Background>
      <div className="w-full min-h-screen flex items-center justify-center p-4 font-sans relative">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-[540px] bg-white rounded-xl overflow-hidden shadow-2xl relative"
        >
          {/* Header with Close Button */}
          {currentIndex < slides.length && (
            <button 
              onClick={() => setCurrentIndex(slides.length)}
              className="absolute top-6 right-6 w-10 h-10 rounded-full bg-black/5 hover:bg-black/10 flex items-center justify-center text-gray-400 hover:text-gray-800 transition-all z-20 tooltip"
              title="Skip Tour"
            >
              <X className="w-5 h-5" />
            </button>
          )}

          <AnimatePresence mode="wait">
            {currentIndex < slides.length ? (
              <motion.div 
                key={currentIndex}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="flex flex-col"
              >
                {/* Visual Section */}
                <div className="h-[260px] bg-[#F9F9F9] border-b border-gray-100 relative flex items-center justify-center overflow-hidden">
                   {/* Minimalist Grid Pattern */}
                   <div 
                    className="absolute inset-0 opacity-[0.05]" 
                    style={{ backgroundImage: `repeating-linear-gradient(0deg, #000 0px, #000 1px, transparent 1px, transparent 40px), repeating-linear-gradient(90deg, #000 0px, #000 1px, transparent 1px, transparent 40px)` }}
                   />
                   
                   {/* Floating Illustration Card - Monochromatic */}
                   <motion.div 
                    initial={{ y: 20, rotate: -1, opacity: 0 }}
                    animate={{ y: 0, rotate: 0, opacity: 1 }}
                    transition={{ duration: 0.8, ease: "easeOut" }}
                    className="relative z-10 w-[240px] h-[160px] bg-white rounded-lg border border-gray-200 shadow-[0_15px_40px_rgba(0,0,0,0.06)] flex flex-col items-center justify-center p-8 active:scale-[0.99] transition-transform"
                   >
                      <div className="w-20 h-20 rounded-lg bg-[#000000] flex items-center justify-center mb-6 shadow-xl">
                        {slides[currentIndex].icon}
                      </div>
                      <div className="w-24 h-1.5 bg-gray-200 rounded-full mb-3" />
                      <div className="w-16 h-1.5 bg-gray-100 rounded-full" />
                   </motion.div>
                </div>

                {/* Content Section */}
                <div className="p-10 pt-10 text-center flex flex-col items-center bg-white">
                  {/* Progress Dots - Monochromatic */}
                  <div className="flex gap-2.5 mb-10">
                    {slides.map((_, idx) => (
                      <div 
                        key={idx} 
                        onClick={() => setCurrentIndex(idx)}
                        className={`h-1 rounded-full cursor-pointer transition-all duration-500 ease-in-out ${idx === currentIndex ? 'w-8 bg-black' : 'w-2 bg-gray-200 hover:bg-gray-400'}`}
                      />
                    ))}
                  </div>

                  <h2 className="text-[30px] font-bold text-black font-serif leading-[1.2] mb-5 tracking-tight">
                    {slides[currentIndex].title}
                  </h2>
                  <p className="text-gray-500 text-[15px] leading-[1.7] max-w-[360px] mb-12">
                    {slides[currentIndex].description}
                  </p>

                  {/* Navigation Footer */}
                  <div className="w-full flex items-center justify-between mt-auto">
                    <button 
                      onClick={handleBack}
                      disabled={currentIndex === 0}
                      className={`px-6 py-3 text-[14px] font-bold border border-gray-200 rounded-md transition-all ${currentIndex === 0 ? 'opacity-0 pointer-events-none' : 'text-gray-400 hover:text-black hover:border-black'}`}
                    >
                      Previous
                    </button>

                    <button 
                      onClick={() => currentIndex === slides.length - 1 ? onComplete('portfolio') : handleNext()}
                      className="px-8 py-3 bg-black text-white rounded-md font-bold text-[14px] flex items-center gap-2 hover:bg-gray-800 transition-all active:scale-[0.97]"
                    >
                      {currentIndex === slides.length - 1 ? 'Get Started' : 'Continue'}
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </motion.div>
            ) : null}
          </AnimatePresence>
        </motion.div>
      </div>
    </Background>
  )
}
