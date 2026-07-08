'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Guard, Shell, Me } from '@/components/recruit/ui'
import { BAND_LABELS, Band } from '@/lib/recruit/helpers'

export default function AdvisorPage() {
  return <Guard render={(me) => <Advisor me={me} />} />
}

const EMPTY_EVENT = { title: '', kind: 'SHOWCASE', location: '', startDate: '', endDate: '', link: '', notes: '' }

function Advisor({ me }: { me: Me }) {
  const router = useRouter()
  const [roster, setRoster] = useState<any[] | null>(null)
  const [events, setEvents] = useState<any[]>([])
  const [error, setError] = useState('')
  const [eventForm, setEventForm] = useState<any>(null)
  const [busy, setBusy] = useState(false)

  const load = () => {
    fetch('/api/recruit/advisor')
      .then((r) => r.json())
      .then((d) => {
        if (d.error) { setError(d.error); return }
        setRoster(d.roster)
        setEvents(d.events || [])
      })
      .catch(() => setError('Could not load your clients'))
  }

  useEffect(() => {
    if (me.role !== 'ADVISOR') { router.replace('/recruit/dashboard'); return }
    load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [me.role, router])

  async function saveEvent() {
    setBusy(true)
    const res = await fetch('/api/recruit/advisor', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'addEvent', ...eventForm }),
    })
    setBusy(false)
    if ((await res.json()).ok) { setEventForm(null); load() }
  }

  async function removeEvent(eventId: string) {
    if (!confirm('Remove this event for all athletes?')) return
    await fetch('/api/recruit/advisor', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'removeEvent', eventId }),
    })
    load()
  }

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

      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 26 }}>
        <div className="eyebrow">Camps & showcases · shown to every athlete</div>
        <button className="rc-btn ghost small" style={{ marginLeft: 'auto' }} onClick={() => setEventForm({ ...EMPTY_EVENT })}>+ Add event</button>
      </div>

      {eventForm && (
        <div className="rc-card" style={{ marginTop: 10, borderColor: 'var(--brand)' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '0 14px' }}>
            <div><label className="rc-label">Event name</label>
              <input className="rc-input" value={eventForm.title} onChange={(e) => setEventForm({ ...eventForm, title: e.target.value })} placeholder="e.g., ECNL Florida Showcase" /></div>
            <div><label className="rc-label">Type</label>
              <select className="rc-select" value={eventForm.kind} onChange={(e) => setEventForm({ ...eventForm, kind: e.target.value })}>
                <option value="SHOWCASE">Showcase</option><option value="ID_CAMP">ID Camp</option>
                <option value="TOURNAMENT">Tournament</option><option value="OTHER">Other</option>
              </select></div>
            <div><label className="rc-label">Location</label>
              <input className="rc-input" value={eventForm.location} onChange={(e) => setEventForm({ ...eventForm, location: e.target.value })} placeholder="City, State" /></div>
            <div><label className="rc-label">Start date</label>
              <input type="date" className="rc-input" value={eventForm.startDate} onChange={(e) => setEventForm({ ...eventForm, startDate: e.target.value })} /></div>
            <div><label className="rc-label">End date (optional)</label>
              <input type="date" className="rc-input" value={eventForm.endDate} onChange={(e) => setEventForm({ ...eventForm, endDate: e.target.value })} /></div>
            <div><label className="rc-label">Link (optional)</label>
              <input className="rc-input" value={eventForm.link} onChange={(e) => setEventForm({ ...eventForm, link: e.target.value })} placeholder="https://…" /></div>
          </div>
          <label className="rc-label">Note for athletes (optional)</label>
          <input className="rc-input" value={eventForm.notes} onChange={(e) => setEventForm({ ...eventForm, notes: e.target.value })} placeholder="e.g., 14 of our target schools will have coaches attending" />
          <div style={{ display: 'flex', gap: 8, marginTop: 14 }}>
            <button className="rc-btn primary" onClick={saveEvent} disabled={busy || !eventForm.title.trim() || !eventForm.startDate}>Add event</button>
            <button className="rc-btn ghost" onClick={() => setEventForm(null)}>Cancel</button>
          </div>
        </div>
      )}

      {events.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 10 }}>
          {events.map((ev) => (
            <div key={ev.id} className="rc-alert">
              <span className="rc-chip accent">{ev.kind === 'ID_CAMP' ? 'ID Camp' : ev.kind === 'TOURNAMENT' ? 'Tournament' : ev.kind === 'OTHER' ? 'Event' : 'Showcase'}</span>
              <b>{ev.title}</b>
              <span style={{ color: 'var(--muted)', fontSize: 12.5 }} className="num">
                {new Date(ev.startDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
              </span>
              {ev.location && <span style={{ color: 'var(--muted)', fontSize: 12.5 }}>· {ev.location}</span>}
              <button className="rc-btn ghost small" style={{ marginLeft: 'auto', color: 'var(--crit)' }} onClick={() => removeEvent(ev.id)}>✕</button>
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
