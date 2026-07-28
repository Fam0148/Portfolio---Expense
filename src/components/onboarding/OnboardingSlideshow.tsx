import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Background } from "../auth/Background"

interface OnboardingSlideshowProps {
  onComplete: (choice: 'portfolio' | 'expense' | 'profile') => void
}

type Slide = {
  id: number
  title: string
  description: string
  image?: string
}

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

export const OnboardingSlideshow = ({ onComplete }: OnboardingSlideshowProps) => {
  const [currentIndex, setCurrentIndex] = useState(0)
  const [direction, setDirection] = useState(0) 

  useEffect(() => {
    slides.forEach(slide => {
      const img = new Image();
      img.src = slide.image || "";
    });
  }, [])

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
      <div className="w-full min-h-screen flex items-center justify-center p-4 sm:p-6 font-sans relative">
        <motion.div 
          initial={{ opacity: 0, scale: 0.98, y: 16 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          className={`w-full max-w-[640px] rounded-3xl overflow-hidden flex flex-col relative shadow-[0_8px_32px_rgba(0,0,0,0.05)] border transition-all duration-500 ${
            currentIndex === 0 ? 'bg-[#E2F1E3] border-[#C8E6C9]' :
            currentIndex === 1 ? 'bg-[#ECE8F6] border-[#E9D5FF]' :
            currentIndex === 2 ? 'bg-[#FDF0E3] border-[#FED7AA]' :
            'bg-[#FBF6D5] border-[#FEF08A]'
          }`}
        >
          {/* Decorative Background Graphics matching new reference */}
          <div className="absolute inset-0 overflow-hidden pointer-events-none opacity-20">
            {currentIndex === 0 && (
              <div className="absolute right-0 bottom-0 w-80 h-80 bg-emerald-600 rounded-tl-full" />
            )}
            {currentIndex === 1 && (
              <div className="absolute right-10 top-10 flex gap-4">
                <div className="w-20 h-20 border-4 border-purple-800 rounded-lg rotate-12" />
                <div className="w-20 h-20 border-4 border-purple-800 rounded-lg -rotate-12" />
              </div>
            )}
            {currentIndex === 2 && (
              <div className="absolute right-12 top-12 w-64 h-64 border-[12px] border-orange-500 rounded-full" />
            )}
            {currentIndex === 3 && (
              <div className="absolute right-20 top-20 w-40 h-40 bg-yellow-500 rounded-full blur-2xl" />
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 min-h-[380px]">
            {/* Left Column: Image/Illustration Area */}
            <div className="p-8 flex items-center justify-center border-b md:border-b-0 md:border-r border-black/5">
              <AnimatePresence mode="wait" custom={direction}>
                <motion.div
                  key={currentIndex}
                  custom={direction}
                  initial={{ x: direction * 50, opacity: 0, scale: 0.9 }}
                  animate={{ x: 0, opacity: 1, scale: 1 }}
                  exit={{ x: -direction * 50, opacity: 0, scale: 0.9 }}
                  transition={{ duration: 0.35, ease: "easeOut" }}
                  className="w-full h-48 md:h-64 flex items-center justify-center"
                >
                  <img
                    src={slides[currentIndex].image}
                    alt={slides[currentIndex].title}
                    className="max-w-full max-h-full object-contain"
                    loading="eager"
                  />
                </motion.div>
              </AnimatePresence>
            </div>

            {/* Right Column: Text & Navigation Controls */}
            <div className="p-8 sm:p-10 flex flex-col justify-between">
              <AnimatePresence mode="wait" custom={direction}>
                <motion.div
                  key={currentIndex}
                  custom={direction}
                  initial={{ x: direction * 30, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  exit={{ x: -direction * 30, opacity: 0 }}
                  transition={{ duration: 0.25, ease: "easeOut" }}
                  className="flex flex-col items-start w-full text-left"
                >
                  <div className="px-3 py-1 bg-white/60 border border-black/5 rounded-full mb-6">
                    <span className="text-black/60 text-[10px] font-bold tracking-wider uppercase">
                      Slide {currentIndex + 1} of {slides.length}
                    </span>
                  </div>

                  <h2 className="text-xl sm:text-2xl font-bold tracking-tight mb-3 text-neutral-900 leading-tight">
                    {slides[currentIndex].title}
                  </h2>

                  <p className="text-neutral-700 text-xs sm:text-sm leading-relaxed mb-8 font-medium">
                    {slides[currentIndex].description}
                  </p>
                </motion.div>
              </AnimatePresence>

              {/* Navigation Controls & Pagination */}
              <div className="space-y-6">
                <div className="flex gap-2.5 w-full">
                  {currentIndex > 0 && (
                    <button
                      onClick={handlePrev}
                      className="flex-1 h-11 border border-black/10 bg-white/40 hover:bg-white/60 rounded-xl text-neutral-800 text-xs font-bold transition-all cursor-pointer shadow-xs"
                    >
                      Back
                    </button>
                  )}
                  <button 
                    onClick={handleNext}
                    className="flex-1 h-11 bg-neutral-900 hover:bg-neutral-800 text-white rounded-xl text-xs font-bold transition-all flex items-center justify-center shadow-md cursor-pointer border border-neutral-900"
                  >
                    <span>{currentIndex === slides.length - 1 ? 'Get Started' : 'Next'}</span>
                  </button>
                </div>

                {/* Pagination Dots */}
                <div className="flex gap-2 justify-center">
                  {slides.map((_, idx) => (
                    <div
                      key={idx}
                      className={`h-2 rounded-full transition-all duration-300 ${
                        idx === currentIndex ? 'w-5 bg-neutral-800' : 'w-2 bg-neutral-800/20'
                      }`}
                    />
                  ))}
                </div>
              </div>

            </div>
          </div>
        </motion.div>
      </div>
    </Background>
  )
}
