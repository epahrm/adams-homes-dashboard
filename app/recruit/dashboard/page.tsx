'use client'

import { useCallback, useEffect, useState } from 'react'
import { Guard, Shell, Me, initials, postData } from '@/components/recruit/ui'
import { BAND_LABELS, BAND_ORDER, BAND_FOCUS, keyDates, daysUntil, gradeLabel, Band } from '@/lib/recruit/helpers'

interface Task { id: string; band: string; title: string; detail: string; source: string }
interface Progress { taskId: string; completed: boolean }

export default function DashboardPage() {
  return <Guard render={(me) => <Dashboard me={me} />} />
}

function Dashboard({ me }: { me: Me }) {
  const [data, setData] = useState<any>(null)
  const [error, setError] = useState('')

  const load = useCallback(() => {
    fetch('/api/recruit/data')
      .then((r) => r.json())
      .then((d) => (d.error ? setError(d.error) : setData(d)))
      .catch(() => setError('Could not load your roadmap'))
  }, [])
  useEffect(load, [load])

  if (error) return <Shell me={me}><div className="rc-error">{error}</div></Shell>
  if (!data) return <Shell me={me}><div style={{ color: 'var(--muted)' }}>Loading your roadmap…</div></Shell>

  const { profile, band, tasks, progress, notes, readOnly } = data
  const firstName = (profile.user.name || '').split(' ')[0]
  const bandIdx = BAND_ORDER.indexOf(band as Band)
  const doneIds = new Set(progress.filter((p: Progress) => p.completed).map((p: Progress) => p.taskId))

  const bandTasks: Task[] = tasks.filter((t: Task) => t.band === band)
  const doneCount = bandTasks.filter((t) => doneIds.has(t.id)).length
  const pct = bandTasks.length ? Math.round((doneCount / bandTasks.length) * 100) : 0

  const dates = keyDates(profile.gradYear).map((k) => ({ ...k, days: daysUntil(new Date(k.date)) }))

  async function toggle(taskId: string) {
    if (readOnly) return
    setData((d: any) => {
      const existing = d.progress.find((p: Progress) => p.taskId === taskId)
      const progressNext = existing
        ? d.progress.map((p: Progress) => (p.taskId === taskId ? { ...p, completed: !p.completed } : p))
        : [...d.progress, { taskId, completed: true }]
      return { ...d, progress: progressNext }
    })
    await postData({ action: 'toggleTask', taskId })
  }

  return (
    <Shell me={me} contextLabel={me.role === 'PARENT' ? `${profile.user.name} · Class of ${profile.gradYear}` : `${me.name} · Class of ${profile.gradYear}`}>
      {readOnly && (
        <div className="rc-alert" style={{ marginBottom: 16, borderColor: 'var(--brand)' }}>
          <span className="rc-dot good" />
          You&apos;re viewing {firstName}&apos;s roadmap as a parent. Check the Library for the Parent Playbook.
        </div>
      )}

      <div className="eyebrow">{gradeLabel(profile.gradYear)} · {BAND_FOCUS[band as Band]}</div>
      <h2>Welcome back{firstName ? `, ${firstName}` : ''}</h2>
      <p className="rc-sub">Class of <span className="num">{profile.gradYear}</span> · here&apos;s what matters right now.</p>

      <div className="rc-dates" style={{ marginTop: 18 }}>
        {dates.map((d) => {
          const passed = d.days < 0
          const soon = d.days >= 0 && d.days <= 90
          return (
            <div key={d.key} className={`rc-date ${passed ? 'live' : soon ? 'next' : ''}`}>
              <div className="eyebrow">{d.label}</div>
              <div className="d">
                {passed ? 'OPEN' : <span className="num">{d.days} days</span>}
              </div>
              <div className="s">{d.detail}</div>
            </div>
          )
        })}
      </div>

      <div style={{ marginTop: 26 }}>
        <div className="eyebrow">Your journey</div>
        <div className="rc-pitchline">
          <i style={{ width: `${Math.min(100, ((bandIdx + 0.5) / 4) * 100)}%` }} />
        </div>
        <div className="rc-stops">
          {BAND_ORDER.map((b, i) => (
            <div key={b} className={`rc-stop ${i < bandIdx ? 'done' : i === bandIdx ? 'now' : ''}`}>
              <b>{BAND_LABELS[b]}</b>
              {BAND_FOCUS[b]}
            </div>
          ))}
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0,1.7fr) minmax(220px,1fr)', gap: 14, marginTop: 26, alignItems: 'start' }}>
        <div>
          <div className="eyebrow" style={{ marginBottom: 10 }}>
            {BAND_LABELS[band as Band]} milestones · standard plan{bandTasks.some((t) => t.source === 'ADVISOR') ? ' + advisor additions' : ''}
          </div>
          <ul className="rc-check">
            {bandTasks.map((t) => (
              <li key={t.id} className={doneIds.has(t.id) ? 'done' : ''}>
                <input
                  type="checkbox"
                  id={`t-${t.id}`}
                  checked={doneIds.has(t.id)}
                  onChange={() => toggle(t.id)}
                  disabled={readOnly}
                />
                <div>
                  <label htmlFor={`t-${t.id}`}>{t.title}</label>
                  <span className="meta">
                    {t.detail}{t.source === 'ADVISOR' ? ' · added by your advisor' : ''}
                  </span>
                </div>
              </li>
            ))}
          </ul>
        </div>
        <div className="rc-card" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10, padding: '20px 16px' }}>
          <div className="rc-ring" style={{ ['--p' as any]: pct }}>
            <div>
              <div>
                <span className="pct num">{pct}%</span>
                <div className="lbl">{BAND_LABELS[band as Band]}</div>
              </div>
            </div>
          </div>
          <div style={{ textAlign: 'center', fontSize: 13, color: 'var(--muted)' }}>
            <span className="num">{doneCount} of {bandTasks.length}</span> milestones done
          </div>
        </div>
      </div>

      {data.events?.length > 0 && (
        <div style={{ marginTop: 24 }}>
          <div className="eyebrow" style={{ marginBottom: 10 }}>Upcoming camps & showcases · from your advisor</div>
          <div className="rc-grid" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))' }}>
            {data.events.map((ev: any) => {
              const start = new Date(ev.startDate)
              const end = ev.endDate ? new Date(ev.endDate) : null
              const days = Math.round((new Date(start.getFullYear(), start.getMonth(), start.getDate()).getTime() - new Date(new Date().getFullYear(), new Date().getMonth(), new Date().getDate()).getTime()) / 86400000)
              return (
                <div key={ev.id} className="rc-card" style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                    <span className="rc-chip accent">{ev.kind === 'ID_CAMP' ? 'ID Camp' : ev.kind === 'TOURNAMENT' ? 'Tournament' : ev.kind === 'OTHER' ? 'Event' : 'Showcase'}</span>
                    <span className="num" style={{ marginLeft: 'auto', fontSize: 12, color: 'var(--accent)', fontWeight: 700 }}>
                      {days <= 0 ? 'Now' : `in ${days}d`}
                    </span>
                  </div>
                  <h3 style={{ fontSize: 14.5 }}>{ev.title}</h3>
                  <div style={{ fontSize: 12.5, color: 'var(--muted)' }}>
                    <span className="num">{start.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}{end ? `–${end.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}` : ''}</span>
                    {ev.location ? ` · ${ev.location}` : ''}
                  </div>
                  {ev.notes && <div style={{ fontSize: 12.5, color: 'var(--muted)' }}>{ev.notes}</div>}
                  {ev.link && <a href={ev.link} target="_blank" rel="noopener" style={{ fontSize: 12.5, fontWeight: 700 }}>Event details →</a>}
                </div>
              )
            })}
          </div>
        </div>
      )}

      {notes.length > 0 && (
        <div style={{ marginTop: 20, display: 'flex', flexDirection: 'column', gap: 10 }}>
          {notes.slice(0, 3).map((n: any) => (
            <div key={n.id} className="rc-advisor-note">
              <div className="rc-avatar" style={{ background: 'var(--brand)', color: 'var(--brand-ink)' }}>{initials('Your Advisor')}</div>
              <div>
                <div className="eyebrow" style={{ color: 'var(--brand)' }}>
                  From your advisor · {new Date(n.createdAt).toLocaleDateString()}
                </div>
                <p>{n.body}</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </Shell>
  )
}
