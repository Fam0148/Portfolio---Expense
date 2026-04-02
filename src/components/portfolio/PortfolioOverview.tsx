import { PortfolioChart } from "./PortfolioChart"

interface PortfolioCardProps {
  title: string
  value: string
  illustration: string
  profitPercent?: string
}

const PortfolioCard = ({ title, value, illustration, profitPercent }: PortfolioCardProps) => {
  return (
    <div className="bg-white p-4 sm:p-6 rounded-[16px] border border-gray-100/80 shadow-sm flex flex-row items-center justify-between gap-4">
      <div className="flex flex-col space-y-1.5 flex-1">
        <h3 className="font-serif text-[16px] text-gray-500 leading-tight">
          {title}
        </h3>
        <div className="flex items-baseline gap-2">
          <p className="font-display font-bold text-[28px] text-[#171717] tracking-tight">
            {value}
          </p>
          {profitPercent && (
            <span className="text-[11px] font-sans font-bold text-green-600 bg-green-50 px-1.5 py-0.5 rounded-full">
              {profitPercent}
            </span>
          )}
        </div>
      </div>

      <div className="w-14 h-14 flex-shrink-0 flex items-center justify-center">
        <img
          src={illustration}
          alt={title}
          className="w-full h-full object-contain"
          onError={() => {
            console.error(`Failed to load asset: ${illustration}`);
          }}
        />
      </div>
    </div>
  )
}

export const PortfolioOverview = () => {
  const cards = [
    {
      title: "Total Portfolio Value",
      value: "₹1,42,500",
      illustration: "/assets/Total Portfolio.png",
      profitPercent: "+12.5%"
    },
    {
      title: "Total Stock Profit",
      value: "₹34,200",
      illustration: "/assets/Stock Profit.png",
      profitPercent: "+24.8%"
    },
    {
      title: "Monthly Passive Income",
      value: "₹1,850",
      illustration: "/assets/Passive inccome.png"
    },
    {
      title: "Historical Bond Profit",
      value: "₹12,400",
      illustration: "/assets/Bonds.png",
      profitPercent: "+4.2%"
    }
  ]

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 pt-8 sm:pt-12 min-h-screen font-sans selection:bg-blue-50 selection:text-blue-600">
      <div className="flex flex-col space-y-0 mb-8 sm:mb-10 text-center sm:text-left">
        <h1 className="text-[26px] sm:text-[32px] font-serif font-bold text-[#171717] leading-tight">Portfolio Management</h1>
        <p className="text-gray-500 text-xs sm:text-sm font-sans mt-1">Track your stocks, bonds, and mutual funds in one place.</p>
      </div>

      <PortfolioChart />
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-4 sm:mt-6 pb-12">
        {cards.map((card, idx) => (
          <PortfolioCard key={idx} {...card} />
        ))}
      </div>
    </div>
  )
}
