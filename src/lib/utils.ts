import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function calculateBondPayouts(s: {
  purchase_price: number
  quantity: number
  ytm?: string | number | null
  tenure?: string | number | null
  purchase_date?: string | null
  asset_type?: string | null
  asset_type_c?: string | null
}, now: Date = new Date()) {
  const type = s.asset_type || s.asset_type_c || (s.ytm || s.tenure ? 'BOND' : 'STOCK')
  if (type !== 'BOND' || !s.ytm) {
    return { monthly: 0, fullTenure: 0, tillDate: 0, total: 0, elapsedMonths: 0 }
  }

  const ytm = parseFloat(String(s.ytm))
  if (isNaN(ytm)) {
    return { monthly: 0, fullTenure: 0, tillDate: 0, total: 0, elapsedMonths: 0 }
  }

  const investment = (s.purchase_price || 0) * (s.quantity || 1)
  const tenureMonths = s.tenure ? parseInt(String(s.tenure).replace(/\D/g, '')) || 12 : 12
  const monthlyPayout = (investment * (ytm / 100)) / 12
  const fullTenurePayout = monthlyPayout * tenureMonths

  if (!s.purchase_date) {
    return { monthly: monthlyPayout, fullTenure: fullTenurePayout, tillDate: 0, total: 0, elapsedMonths: 0 }
  }

  const [pY, pM, pD] = String(s.purchase_date).split('-').map(Number)
  if (!pY || !pM) {
    return { monthly: monthlyPayout, fullTenure: fullTenurePayout, tillDate: 0, total: 0, elapsedMonths: 0 }
  }

  const purchaseDate = new Date(pY, pM - 1, pD || 1)
  if (purchaseDate > now) {
    return { monthly: monthlyPayout, fullTenure: fullTenurePayout, tillDate: 0, total: 0, elapsedMonths: 0 }
  }

  let elapsedMonths = (now.getFullYear() - purchaseDate.getFullYear()) * 12 + (now.getMonth() - purchaseDate.getMonth())
  if (now.getDate() < purchaseDate.getDate()) {
    elapsedMonths -= 1
  }
  elapsedMonths = Math.min(tenureMonths, Math.max(0, elapsedMonths))

  const payoutTillDate = monthlyPayout * elapsedMonths

  return {
    monthly: monthlyPayout,
    fullTenure: fullTenurePayout,
    tillDate: payoutTillDate,
    total: payoutTillDate,
    elapsedMonths
  }
}

