import React from "react"

export const Background = ({ children }: { children: React.ReactNode }) => {
  return (
    <div className="relative min-h-screen w-full flex items-center justify-center p-4 md:p-8 bg-[#F8F8F8] overflow-hidden">
      {/* 
        CINEMATIC LAYER 1: Ambient Drifting & Pacing Orbs 
      */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div
          className="absolute top-[-10%] left-[-10%] w-[45%] h-[45%] rounded-full bg-gradient-to-br from-gray-200/50 to-transparent blur-3xl opacity-70"
        />
        <div
          className="absolute bottom-[-10%] right-[-10%] w-[55%] h-[55%] rounded-full bg-gradient-to-tl from-gray-200/40 to-transparent blur-3xl opacity-60"
        />
      </div>

      {/* 
        CINEMATIC LAYER 2: Professional Infinite Grid 
      */}
      {/* Dense Diagonal Pattern - Infinite Scroll */}
      <div
        className="absolute inset-0 pointer-events-none opacity-[0.45]"
        style={{
          backgroundImage: `repeating-linear-gradient(45deg, #EAEAEA 0px, #EAEAEA 1px, transparent 1px, transparent 12px)`,
          backgroundSize: "24px 24px"
        }}
      />



      {/* 
        CINEMATIC LAYER 3: Smooth Content Entry 
      */}
      <div className="relative z-10 w-full flex justify-center items-center">
        <div className="w-full max-w-4xl animate-in fade-in zoom-in-95 duration-1000 ease-out fill-mode-both">
          {children}
        </div>
      </div>
    </div>
  )
}
