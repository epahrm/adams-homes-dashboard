'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Guard, Shell, Me } from '@/components/recruit/ui'

export default function ModulesPage() {
  return <Guard render={(me) => <Modules me={me} />} />
}

function Modules({ me }: { me: Me }) {
  const [data, setData] = useState<any>(null)

  useEffect(() => {
    fetch('/api/recruit/data').then((r) => r.json()).then(setData).catch(() => {})
  }, [])

  if (!data || data.error) {
    return <Shell me={me}><div style={{ color: 'var(--muted)' }}>{data?.error || 'Loading modules…'}</div></Shell>
  }

  const doneLessons = new Set(
    data.lessonProgress.filter((p: any) => p.completed).map((p: any) => p.lessonId)
  )

  return (
    <Shell me={me}>
      <h2>Modules</h2>
      <p className="rc-sub">Short courses from your advisor — what you need to know, when you need it.</p>

      <div className="rc-grid" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', marginTop: 18 }}>
        {data.modules.map((m: any) => {
          const total = m.lessons.length
          const done = m.lessons.filter((l: any) => doneLessons.has(l.id)).length
          const pct = total ? Math.round((done / total) * 100) : 0
          return (
            <Link key={m.id} href={`/recruit/modules/${m.slug}`} style={{ textDecoration: 'none', color: 'inherit' }}>
              <div className="rc-card" style={{ height: '100%', display: 'flex', flexDirection: 'column', gap: 9, borderColor: pct > 0 && pct < 100 ? 'var(--brand)' : undefined }}>
                <span className="eyebrow" style={{ color: 'var(--brand)' }}>Module</span>
                <h3 style={{ fontSize: 15, lineHeight: 1.35 }}>{m.title}</h3>
                <p style={{ margin: 0, fontSize: 12.5, color: 'var(--muted)' }}>{m.description}</p>
                <div className="rc-bar" style={{ marginTop: 'auto' }}><i style={{ width: `${pct}%` }} /></div>
                <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                  {pct === 100
                    ? <span className="rc-chip good">Completed ✓</span>
                    : <span className="rc-chip plain num">{done} of {total} lessons</span>}
                </div>
              </div>
            </Link>
          )
        })}
      </div>
    </Shell>
  )
}
