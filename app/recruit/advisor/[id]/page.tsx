'use client'

import { useCallback, useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { Guard, Shell, Me } from '@/components/recruit/ui'
import { BAND_LABELS, BAND_ORDER, Band, gradeLabel, STAGES } from '@/lib/recruit/helpers'

export default function ClientDetailPage() {
  return <Guard render={(me) => <ClientDetail me={me} />} />
}

function ClientDetail({ me }: { me: Me }) {
  const params = useParams<{ id: string }>()
  const [data, setData] = useState<any>(null)
  const [note, setNote] = useState('')
  const [task, setTask] = useState({ title: '', detail: '', band: '' })
  const [review, setReview] = useState('')
  const [busy, setBusy] = useState(false)
  const [flash, setFlash] = useState('')

  const load = useCallback(() => {
    fetch(`/api/recruit/data?athleteId=${params.id}`)
      .then((r) => r.json())
      .then(setData)
      .catch(() => {})
  }, [params.id])
  useEffect(load, [load])

  if (me.role !== 'ADVISOR') return null
  if (!data || data.error) {
    return <Shell me={me}><div style={{ color: 'var(--muted)' }}>{data?.error || 'Loading client…'}</div></Shell>
  }

  const { profile, band, tasks, progress, schools, notes, resume } = data
  const doneIds = new Set(progress.filter((p: any) => p.completed).map((p: any) => p.taskId))
  const bandTasks = tasks.filter((t: any) => t.band === (task.band || band))
  const strengths: string[] = JSON.parse(profile.strengths || '[]')

  async function advisorPost(body: Record<string, unknown>, msg: string) {
    setBusy(true)
    const res = await fetch('/api/recruit/advisor', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...body, athleteId: profile.id }),
    })
    setBusy(false)
    const d = await res.json()
    if (d.ok) { setFlash(msg); setTimeout(() => setFlash(''), 2500); load() }
  }

  return (
    <Shell me={me}>
      <Link href="/recruit/advisor" style={{ fontSize: 13, fontWeight: 600 }}>← All clients</Link>
      <div style={{ display: 'flex', gap: 14, alignItems: 'baseline', flexWrap: 'wrap', marginTop: 8 }}>
        <h2>{profile.user.name}</h2>
        <span className="rc-chip brand">Class of <span className="num">{profile.gradYear}</span></span>
        <span className="rc-chip plain">{gradeLabel(profile.gradYear)} · {BAND_LABELS[band as Band]}</span>
        <a href={`/recruit/p/${profile.slug}`} target="_blank" style={{ fontSize: 13, fontWeight: 600 }}>Public profile →</a>
      </div>
      <p className="rc-sub">
        {[profile.position, profile.clubTeam, profile.highSchool, profile.user.email].filter(Boolean).join(' · ')}
      </p>
      {strengths.length > 0 && (
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginTop: 10 }}>
          {strengths.map((s) => <span key={s} className="rc-chip brand">{s}</span>)}
        </div>
      )}

      {flash && <div className="rc-success" style={{ marginTop: 14 }}>{flash}</div>}

      {resume?.status === 'SUBMITTED' && (
        <div className="rc-card" style={{ marginTop: 18, borderColor: 'var(--warn)' }}>
          <h3>Résumé awaiting your review</h3>
          <div className="rc-paper" style={{ marginTop: 10 }}>
            <header><h3>{profile.user.name}</h3>
              <div className="tag">Class of <span className="num">{profile.gradYear}</span>{profile.position ? ` · ${profile.position}` : ''}</div></header>
            {resume.content.summary && <><h4>Player profile</h4><p>{resume.content.summary}</p></>}
            {resume.content.experience && <><h4>Soccer experience</h4>
              <ul>{resume.content.experience.split('\n').filter(Boolean).map((l: string, i: number) => <li key={i}>{l}</li>)}</ul></>}
            {resume.content.academics && <><h4>Academics</h4><p>{resume.content.academics}</p></>}
            {resume.content.honors && <><h4>Honors & community</h4>
              <ul>{resume.content.honors.split('\n').filter(Boolean).map((l: string, i: number) => <li key={i}>{l}</li>)}</ul></>}
          </div>
          <label className="rc-label">Feedback (shown to the athlete)</label>
          <input className="rc-input" value={review} onChange={(e) => setReview(e.target.value)} placeholder="e.g., Lead with the assist stats — otherwise great" />
          <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
            <button className="rc-btn primary" disabled={busy} onClick={() => advisorPost({ action: 'reviewResume', decision: 'approve', comment: review }, 'Résumé approved')}>Approve ✓</button>
            <button className="rc-btn ghost" disabled={busy} onClick={() => advisorPost({ action: 'reviewResume', decision: 'revise', comment: review }, 'Sent back for revision')}>Request changes</button>
          </div>
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 16, marginTop: 18, alignItems: 'start' }}>
        <div className="rc-card">
          <h3>Milestone plan · {BAND_LABELS[(task.band || band) as Band]}</h3>
          <div style={{ display: 'flex', gap: 6, margin: '10px 0' }}>
            {BAND_ORDER.map((b) => (
              <button key={b} className="rc-btn small" style={{
                background: (task.band || band) === b ? 'var(--brand)' : 'var(--surface)',
                color: (task.band || band) === b ? 'var(--brand-ink)' : 'var(--muted)',
                border: '1px solid var(--line)', borderRadius: 99,
              }} onClick={() => setTask({ ...task, band: b })}>{BAND_LABELS[b].split(' ')[0]}</button>
            ))}
          </div>
          <ul className="rc-check">
            {bandTasks.map((t: any) => (
              <li key={t.id} className={doneIds.has(t.id) ? 'done' : ''}>
                <input type="checkbox" checked={doneIds.has(t.id)} readOnly disabled />
                <div>
                  <label>{t.title}</label>
                  {t.source === 'ADVISOR' && (
                    <span className="meta">
                      Custom task ·{' '}
                      <button style={{ background: 'none', border: 0, color: 'var(--crit)', cursor: 'pointer', fontSize: 12, padding: 0, fontFamily: 'inherit' }}
                        onClick={() => advisorPost({ action: 'removeTask', taskId: t.id }, 'Task removed')}>remove</button>
                    </span>
                  )}
                </div>
              </li>
            ))}
          </ul>
          <label className="rc-label">Add a custom milestone for {profile.user.name.split(' ')[0]}</label>
          <input className="rc-input" placeholder="Task title" value={task.title} onChange={(e) => setTask({ ...task, title: e.target.value })} />
          <input className="rc-input" style={{ marginTop: 8 }} placeholder="Detail (optional)" value={task.detail} onChange={(e) => setTask({ ...task, detail: e.target.value })} />
          <button className="rc-btn primary small" style={{ marginTop: 10 }} disabled={busy || !task.title.trim()}
            onClick={() => { advisorPost({ action: 'addTask', title: task.title, detail: task.detail, band: task.band || band }, 'Milestone added'); setTask({ ...task, title: '', detail: '' }) }}>
            + Add milestone
          </button>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div className="rc-card">
            <h3>Target schools ({schools.length})</h3>
            {schools.length === 0 && <p style={{ fontSize: 13, color: 'var(--muted)', margin: '6px 0 0' }}>No schools yet.</p>}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 10 }}>
              {schools.slice(0, 8).map((s: any) => (
                <div key={s.id} style={{ display: 'flex', gap: 8, alignItems: 'center', fontSize: 13.5 }}>
                  <b>{s.name}</b>
                  <span style={{ color: 'var(--muted)', fontSize: 12 }}>{s.division}</span>
                  <span className={`rc-chip ${['OFFER', 'COMMITTED'].includes(s.stage) ? 'good' : ['CONVERSATION', 'VISIT_PLANNED'].includes(s.stage) ? 'brand' : 'plain'}`} style={{ marginLeft: 'auto' }}>
                    {STAGES.find((x) => x.key === s.stage)?.label}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div className="rc-card">
            <h3>Notes to {profile.user.name.split(' ')[0]}</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, margin: '10px 0' }}>
              {notes.map((n: any) => (
                <div key={n.id} style={{ fontSize: 13, background: 'var(--brand-soft)', borderRadius: 8, padding: '8px 12px' }}>
                  <span style={{ color: 'var(--muted)', fontSize: 11 }}>{new Date(n.createdAt).toLocaleDateString()} · </span>{n.body}
                </div>
              ))}
            </div>
            <textarea className="rc-textarea" rows={2} placeholder="Shows on their roadmap as “From your advisor”…" value={note} onChange={(e) => setNote(e.target.value)} />
            <button className="rc-btn primary small" style={{ marginTop: 10 }} disabled={busy || !note.trim()}
              onClick={() => { advisorPost({ action: 'addNote', body: note }, 'Note sent'); setNote('') }}>
              Send note
            </button>
          </div>
        </div>
      </div>
    </Shell>
  )
}
