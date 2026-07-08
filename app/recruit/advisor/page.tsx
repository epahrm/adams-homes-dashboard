'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Guard, Shell, Me } from '@/components/recruit/ui'
import { BAND_LABELS, Band } from '@/lib/recruit/helpers'

export default function AdvisorPage() {
  return <Guard render={(me) => <Advisor me={me} />} />
}

function Advisor({ me }: { me: Me }) {
  const router = useRouter()
  const [roster, setRoster] = useState<any[] | null>(null)
  const [error, setError] = useState('')

  useEffect(() => {
    if (me.role !== 'ADVISOR') { router.replace('/recruit/dashboard'); return }
    fetch('/api/recruit/advisor')
      .then((r) => r.json())
      .then((d) => (d.error ? setError(d.error) : setRoster(d.roster)))
      .catch(() => setError('Could not load your clients'))
  }, [me.role, router])

  if (me.role !== 'ADVISOR') return null
  if (error) return <Shell me={me}><div className="rc-error">{error}</div></Shell>
  if (!roster) return <Shell me={me}><div style={{ color: 'var(--muted)' }}>Loading your clients…</div></Shell>

  const needAttention = roster.filter((r) => r.alerts.length > 0)
  const resumesWaiting = roster.filter((r) => r.resumeStatus === 'SUBMITTED').length
  const keyDatesSoon = roster.reduce((n, r) => n + r.upcomingKeyDates.length, 0)
  const firstName = me.name.split(' ')[0]
  const hour = new Date().getHours()
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening'

  return (
    <Shell me={me}>
      <h2>{greeting}, {firstName}</h2>
      <p className="rc-sub">
        {new Date().toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' })}
        {needAttention.length > 0 && <> · <b style={{ color: 'var(--crit)' }}>{needAttention.length === 1 ? '1 client needs attention' : `${needAttention.length} clients need attention`}</b></>}
      </p>

      <div className="rc-tiles" style={{ marginTop: 16 }}>
        <div className="rc-tile"><div className="n num">{roster.length}</div><div className="t">Active clients</div></div>
        <div className={`rc-tile ${needAttention.length ? 'hot' : ''}`}><div className="n num">{needAttention.length}</div><div className="t">Need attention</div></div>
        <div className="rc-tile"><div className="n num">{resumesWaiting}</div><div className="t">Résumés to review</div></div>
        <div className="rc-tile"><div className="n num">{keyDatesSoon}</div><div className="t">Key dates in 60 days</div></div>
      </div>

      {needAttention.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 16 }}>
          {needAttention.map((r) => (
            <div key={r.id} className="rc-alert">
              <span className={`rc-dot ${r.alerts.some((a: string) => /outreach/.test(a)) ? 'crit' : 'warn'}`} />
              <b>{r.name} ({r.gradYear})</b>
              <span style={{ color: 'var(--muted)' }}>— {r.alerts.join(' · ')}</span>
              <Link href={`/recruit/advisor/${r.id}`} className="rc-btn ghost small" style={{ marginLeft: 'auto', textDecoration: 'none' }}>Open</Link>
            </div>
          ))}
        </div>
      )}

      <div className="rc-tablewrap" style={{ marginTop: 18 }}>
        <table className="rc-table">
          <thead>
            <tr><th>Client</th><th>Class</th><th>Stage</th><th>Plan progress</th><th>Schools</th><th>Résumé</th><th></th></tr>
          </thead>
          <tbody>
            {roster.length === 0 && (
              <tr><td colSpan={7} style={{ textAlign: 'center', color: 'var(--muted)', padding: 34 }}>
                No clients yet. Send athletes to <b>/recruit</b> to sign up — they&apos;ll appear here automatically.
              </td></tr>
            )}
            {roster.map((r) => {
              const pct = r.planTotal ? Math.round((r.planDone / r.planTotal) * 100) : 0
              return (
                <tr key={r.id}>
                  <td>
                    <b>{r.name}</b>
                    <div style={{ fontSize: 11.5, color: 'var(--muted)' }}>{r.position || '—'}{r.clubTeam ? ` · ${r.clubTeam}` : ''}</div>
                  </td>
                  <td className="num">{r.gradYear}</td>
                  <td style={{ fontSize: 12.5 }}>{BAND_LABELS[r.band as Band]}</td>
                  <td>
                    <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                      <div className="rc-bar" style={{ width: 90 }}><i style={{ width: `${pct}%` }} /></div>
                      <span className="num" style={{ fontSize: 12, color: 'var(--muted)' }}>{pct}%</span>
                    </div>
                  </td>
                  <td className="num">{r.schoolCount}</td>
                  <td>
                    {r.resumeStatus === 'SUBMITTED' ? <span className="rc-chip warn">Review</span>
                      : r.resumeStatus === 'APPROVED' ? <span className="rc-chip good">Approved</span>
                      : <span className="rc-chip plain">{r.resumeStatus === 'DRAFT' ? 'Draft' : '—'}</span>}
                  </td>
                  <td><Link href={`/recruit/advisor/${r.id}`} className="rc-btn ghost small" style={{ textDecoration: 'none' }}>Open</Link></td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </Shell>
  )
}
