'use client'

import { useCallback, useEffect, useState } from 'react'
import { Guard, Shell, Me, postData } from '@/components/recruit/ui'
import { STAGES, SCHOOL_CATEGORIES, CONTACT_TYPES } from '@/lib/recruit/helpers'
import { FL_DIRECTORY, EMAIL_TEMPLATES, EmailContext } from '@/lib/recruit/content'

const EMPTY = { id: '', name: '', division: '', coachName: '', coachEmail: '', coachTwitter: '', category: 'TARGET', stage: 'RESEARCHING', notes: '' }

export default function SchoolsPage() {
  return <Guard render={(me) => <Schools me={me} />} />
}

function Schools({ me }: { me: Me }) {
  const [data, setData] = useState<any>(null)
  const [editing, setEditing] = useState<any>(null)
  const [logFor, setLogFor] = useState<any>(null)
  const [log, setLog] = useState({ type: 'EMAIL_SENT', summary: '' })
  const [showDirectory, setShowDirectory] = useState(false)
  const [busy, setBusy] = useState(false)
  const [emailFor, setEmailFor] = useState<any>(null)
  const [templateKey, setTemplateKey] = useState('intro')
  const [draft, setDraft] = useState({ subject: '', body: '' })
  const [copied, setCopied] = useState(false)

  const load = useCallback(() => {
    fetch('/api/recruit/data').then((r) => r.json()).then(setData).catch(() => {})
  }, [])
  useEffect(load, [load])

  if (!data || data.error) {
    return <Shell me={me}><div style={{ color: 'var(--muted)' }}>{data?.error || 'Loading your schools…'}</div></Shell>
  }

  const schools = data.schools
  const readOnly = Boolean(data.readOnly)
  const byStage: Record<string, number> = {}
  for (const s of schools) byStage[s.stage] = (byStage[s.stage] || 0) + 1

  async function save() {
    if (!editing?.name?.trim()) return
    setBusy(true)
    await postData({ action: 'saveSchool', school: editing })
    setEditing(null)
    setBusy(false)
    load()
  }

  async function remove(id: string) {
    if (!confirm('Remove this school from your list?')) return
    await postData({ action: 'deleteSchool', schoolId: id })
    load()
  }

  async function addContact() {
    if (!log.summary.trim() || !logFor) return
    setBusy(true)
    await postData({ action: 'addContact', schoolId: logFor.id, type: log.type, summary: log.summary })
    setLogFor(null)
    setLog({ type: 'EMAIL_SENT', summary: '' })
    setBusy(false)
    load()
  }

  function emailContext(s: any): EmailContext {
    const p = data.profile
    return {
      athleteName: p.user.name,
      gradYear: p.gradYear,
      position: p.position,
      clubTeam: p.clubTeam,
      highSchool: p.highSchool,
      gpa: p.gpa,
      highlightUrl: p.highlightUrl,
      profileUrl: typeof window !== 'undefined' ? `${window.location.origin}/recruit/p/${p.slug}` : '',
      ncaaRegistered: p.ncaaRegistered,
      schoolName: s.name,
      coachName: s.coachName,
    }
  }

  function openEmail(s: any, key = templateKey) {
    const t = EMAIL_TEMPLATES.find((x) => x.key === key) || EMAIL_TEMPLATES[0]
    const ctx = emailContext(s)
    setEmailFor(s)
    setTemplateKey(t.key)
    setDraft({ subject: t.subject(ctx), body: t.body(ctx) })
    setCopied(false)
  }

  async function copyDraft() {
    await navigator.clipboard?.writeText(`Subject: ${draft.subject}\n\n${draft.body}`)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  async function logEmailSent() {
    await postData({ action: 'addContact', schoolId: emailFor.id, type: 'EMAIL_SENT', summary: `Sent "${EMAIL_TEMPLATES.find((t) => t.key === templateKey)?.label}" email` })
    setEmailFor(null)
    load()
  }

  function quickAdd(d: (typeof FL_DIRECTORY)[number]) {
    setEditing({ ...EMPTY, name: d.name, division: d.division, coachTwitter: d.coachTwitter, notes: `Program: ${d.program} · ${d.city}, FL` })
    setShowDirectory(false)
  }

  return (
    <Shell me={me}>
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12, flexWrap: 'wrap' }}>
        <div style={{ flex: 1, minWidth: 220 }}>
          <h2>Target schools</h2>
          <p className="rc-sub"><span className="num">{schools.length}</span> {schools.length === 1 ? 'school' : 'schools'} on your list — aim for a mix of dream, target, and safety.</p>
        </div>
        {!readOnly && (
          <div style={{ display: 'flex', gap: 8 }}>
            <button className="rc-btn ghost" onClick={() => setShowDirectory(!showDirectory)}>Florida directory</button>
            <button className="rc-btn primary" onClick={() => setEditing({ ...EMPTY })}>+ Add school</button>
          </div>
        )}
      </div>

      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginTop: 16 }}>
        {STAGES.map((s) => (
          <div key={s.key} className="rc-card" style={{ flex: 1, minWidth: 108, padding: '10px 14px' }}>
            <div style={{ fontSize: 12, color: 'var(--muted)' }}>{s.label}</div>
            <div className="num" style={{ fontSize: 22, fontWeight: 800, color: byStage[s.key] ? 'var(--brand)' : undefined }}>{byStage[s.key] || 0}</div>
          </div>
        ))}
      </div>

      {showDirectory && (
        <div className="rc-card" style={{ marginTop: 16 }}>
          <h3>Florida women&apos;s programs directory</h3>
          <p style={{ fontSize: 12.5, color: 'var(--muted)', margin: '4px 0 10px' }}>
            From your advisor&apos;s files (2021 list — coach names should be verified). Click to add to your list.
          </p>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {FL_DIRECTORY.map((d) => (
              <button key={d.name} className="rc-btn ghost small" onClick={() => quickAdd(d)}>
                {d.name} <span className="rc-chip plain" style={{ marginLeft: 6 }}>{d.division}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {editing && (
        <div className="rc-card" style={{ marginTop: 16, borderColor: 'var(--brand)' }}>
          <h3>{editing.id ? 'Edit school' : 'Add a school'}</h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '0 14px' }}>
            <div>
              <label className="rc-label">School name</label>
              <input className="rc-input" value={editing.name} onChange={(e) => setEditing({ ...editing, name: e.target.value })} />
            </div>
            <div>
              <label className="rc-label">Division</label>
              <select className="rc-select" value={editing.division} onChange={(e) => setEditing({ ...editing, division: e.target.value })}>
                <option value="">—</option>
                {['D1', 'D2', 'D3', 'NAIA', 'JUCO'].map((d) => <option key={d}>{d}</option>)}
              </select>
            </div>
            <div>
              <label className="rc-label">Coach name</label>
              <input className="rc-input" value={editing.coachName} onChange={(e) => setEditing({ ...editing, coachName: e.target.value })} />
            </div>
            <div>
              <label className="rc-label">Coach email</label>
              <input className="rc-input" value={editing.coachEmail} onChange={(e) => setEditing({ ...editing, coachEmail: e.target.value })} />
            </div>
            <div>
              <label className="rc-label">List category</label>
              <select className="rc-select" value={editing.category} onChange={(e) => setEditing({ ...editing, category: e.target.value })}>
                {SCHOOL_CATEGORIES.map((c) => <option key={c.key} value={c.key}>{c.label}</option>)}
              </select>
            </div>
            <div>
              <label className="rc-label">Stage</label>
              <select className="rc-select" value={editing.stage} onChange={(e) => setEditing({ ...editing, stage: e.target.value })}>
                {STAGES.map((s) => <option key={s.key} value={s.key}>{s.label}</option>)}
              </select>
            </div>
          </div>
          <label className="rc-label">Notes</label>
          <textarea className="rc-textarea" rows={2} value={editing.notes} onChange={(e) => setEditing({ ...editing, notes: e.target.value })} />
          <div style={{ display: 'flex', gap: 8, marginTop: 14 }}>
            <button className="rc-btn primary" onClick={save} disabled={busy || !editing.name.trim()}>Save school</button>
            <button className="rc-btn ghost" onClick={() => setEditing(null)}>Cancel</button>
          </div>
        </div>
      )}

      {emailFor && (
        <div className="rc-card" style={{ marginTop: 16, borderColor: 'var(--brand)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
            <h3>✉ Email {emailFor.coachName ? `Coach ${emailFor.coachName}` : 'the coach'} — {emailFor.name}</h3>
            <span style={{ marginLeft: 'auto', display: 'flex', gap: 6, flexWrap: 'wrap' }}>
              {EMAIL_TEMPLATES.map((t) => (
                <button key={t.key} className="rc-btn small" style={{
                  borderRadius: 99, border: '1px solid ' + (templateKey === t.key ? 'var(--brand)' : 'var(--line)'),
                  background: templateKey === t.key ? 'var(--brand)' : 'var(--surface)',
                  color: templateKey === t.key ? 'var(--brand-ink)' : 'var(--muted)',
                }} onClick={() => openEmail(emailFor, t.key)}>{t.label}</button>
              ))}
            </span>
          </div>
          <p style={{ fontSize: 12.5, color: 'var(--muted)', margin: '6px 0 0' }}>
            Pre-filled from your profile. Personalize every <b>[bracketed]</b> part before sending — coaches can smell a mass email from a mile away.
          </p>
          <label className="rc-label">Subject</label>
          <input className="rc-input" value={draft.subject} onChange={(e) => setDraft({ ...draft, subject: e.target.value })} />
          <label className="rc-label">Email</label>
          <textarea className="rc-textarea" rows={13} value={draft.body} onChange={(e) => setDraft({ ...draft, body: e.target.value })} style={{ fontFamily: 'ui-monospace, Menlo, monospace', fontSize: 13 }} />
          <div style={{ display: 'flex', gap: 8, marginTop: 12, flexWrap: 'wrap' }}>
            <button className="rc-btn primary" onClick={copyDraft}>{copied ? 'Copied ✓' : 'Copy email'}</button>
            {emailFor.coachEmail && (
              <a className="rc-btn ghost" style={{ textDecoration: 'none' }}
                href={`mailto:${emailFor.coachEmail}?subject=${encodeURIComponent(draft.subject)}&body=${encodeURIComponent(draft.body)}`}>
                Open in email app
              </a>
            )}
            <button className="rc-btn ghost" onClick={logEmailSent}>I sent it — log it ✓</button>
            <button className="rc-btn ghost" onClick={() => setEmailFor(null)}>Close</button>
          </div>
        </div>
      )}

      {logFor && (
        <div className="rc-card" style={{ marginTop: 16, borderColor: 'var(--accent)' }}>
          <h3>Log activity — {logFor.name}</h3>
          <div style={{ display: 'grid', gridTemplateColumns: '200px 1fr', gap: '0 14px' }}>
            <div>
              <label className="rc-label">What happened?</label>
              <select className="rc-select" value={log.type} onChange={(e) => setLog({ ...log, type: e.target.value })}>
                {CONTACT_TYPES.map((c) => <option key={c.key} value={c.key}>{c.label}</option>)}
              </select>
            </div>
            <div>
              <label className="rc-label">Summary</label>
              <input className="rc-input" placeholder="e.g., Sent June highlight reel + summer schedule" value={log.summary} onChange={(e) => setLog({ ...log, summary: e.target.value })} />
            </div>
          </div>
          <div style={{ display: 'flex', gap: 8, marginTop: 14 }}>
            <button className="rc-btn primary" onClick={addContact} disabled={busy || !log.summary.trim()}>Log it</button>
            <button className="rc-btn ghost" onClick={() => setLogFor(null)}>Cancel</button>
          </div>
        </div>
      )}

      <div className="rc-tablewrap" style={{ marginTop: 16 }}>
        <table className="rc-table">
          <thead>
            <tr><th>School</th><th>Division</th><th>Coach</th><th>Stage</th><th>Last activity</th>{!readOnly && <th></th>}</tr>
          </thead>
          <tbody>
            {schools.length === 0 && (
              <tr><td colSpan={6} style={{ color: 'var(--muted)', textAlign: 'center', padding: 30 }}>
                No schools yet — add your first target school or open the Florida directory.
              </td></tr>
            )}
            {schools.map((s: any) => {
              const stage = STAGES.find((x) => x.key === s.stage)
              const last = s.contacts?.[0]
              return (
                <tr key={s.id}>
                  <td>
                    <b>{s.name}</b>
                    <div style={{ fontSize: 11.5, color: 'var(--muted)' }}>{SCHOOL_CATEGORIES.find((c) => c.key === s.category)?.label} school</div>
                  </td>
                  <td>{s.division || '—'}</td>
                  <td>{s.coachName || '—'}</td>
                  <td>
                    <span className={`rc-chip ${s.stage === 'OFFER' || s.stage === 'COMMITTED' ? 'good' : s.stage === 'CONVERSATION' || s.stage === 'VISIT_PLANNED' ? 'brand' : 'plain'}`}>
                      {stage?.label || s.stage}
                    </span>
                  </td>
                  <td style={{ fontSize: 12.5, color: 'var(--muted)', maxWidth: 260 }}>
                    {last ? <><span className="num">{new Date(last.date).toLocaleDateString()}</span> — {last.summary}</> : 'Nothing logged yet'}
                  </td>
                  {!readOnly && (
                    <td style={{ whiteSpace: 'nowrap' }}>
                      <button className="rc-btn ghost small" onClick={() => openEmail(s)}>✉ Email</button>{' '}
                      <button className="rc-btn ghost small" onClick={() => setLogFor(s)}>+ Log</button>{' '}
                      <button className="rc-btn ghost small" onClick={() => setEditing({ ...EMPTY, ...s })}>Edit</button>{' '}
                      <button className="rc-btn ghost small" style={{ color: 'var(--crit)' }} onClick={() => remove(s.id)}>✕</button>
                    </td>
                  )}
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </Shell>
  )
}
