import React from "react"

export const Background = ({ children }: { children: React.ReactNode }) => {
  return (
    <div className="relative min-h-screen w-full flex items-center justify-center p-4 md:p-8 bg-[#FAFAFA] overflow-hidden">
      {/* 
        CINEMATIC LAYER 1: New Birds Background 
      */}
      <div
        className="absolute inset-0 pointer-events-none opacity-[0.05]"
        style={{
          backgroundImage: "url('/assets/backgrounds/birds_bg.png')",
          backgroundSize: "60%",
          backgroundPosition: "center",
          backgroundRepeat: "no-repeat"
        }}
      />

      {/* Subtle Texture Overlay */}
      <div
        className="absolute inset-0 pointer-events-none opacity-[0.03]"
        style={{
          backgroundImage: `repeating-linear-gradient(45deg, #000 0px, #000 1px, transparent 1px, transparent 10px)`,
          backgroundSize: "10px 10px"
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
