import React from "react"

export const Background = ({ children }: { children: React.ReactNode }) => {
  return (
    <div className="relative min-h-screen w-full flex items-center justify-center p-4 md:p-8 bg-[#F4F5F7] overflow-hidden">
      {/* Sleek Dot Grid Pattern Background */}
      <div className="absolute inset-0 bg-dot-grid opacity-60 pointer-events-none" />

      {/* Smooth Content Entry */}
      <div className="relative z-10 w-full flex justify-center items-center">
        <div className="w-full max-w-4xl animate-in fade-in zoom-in-95 duration-700 ease-out fill-mode-both">
          {children}
        </div>
      </div>
    </div>
  )
}
