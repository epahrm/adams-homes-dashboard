import type { Metadata } from 'next'
import './recruit.css'
import { BRAND_NAME, BRAND_TAGLINE } from '@/lib/recruit/brand'

export const metadata: Metadata = {
  title: BRAND_NAME,
  description: BRAND_TAGLINE,
}

export default function RecruitLayout({ children }: { children: React.ReactNode }) {
  return <div className="rc">{children}</div>
}
