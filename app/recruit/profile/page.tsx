'use client'

import { useEffect, useState } from 'react'
import { Guard, Shell, Me, postData } from '@/components/recruit/ui'

export default function ProfilePage() {
  return <Guard render={(me) => <Profile me={me} />} />
}

const FIELDS: { key: string; label: string; placeholder?: string }[] = [
  { key: 'position', label: 'Primary position', placeholder: 'e.g., Central / attacking midfielder' },
  { key: 'clubTeam', label: 'Club team', placeholder: 'e.g., Space Coast United ECNL' },
  { key: 'highSchool', label: 'High school' },
  { key: 'city', label: 'City' },
  { key: 'state', label: 'State', placeholder: 'FL' },
  { key: 'gpa', label: 'GPA', placeholder: 'e.g., 3.9 (weighted)' },
  { key: 'height', label: 'Height', placeholder: `e.g., 5'6"` },
  { key: 'jerseyNumber', label: 'Jersey number' },
  { key: 'highlightUrl', label: 'Highlight video link', placeholder: 'Hudl / YouTube link' },
]

function Profile({ me }: { me: Me }) {
  const [data, setData] = useState<any>(null)
  const [form, setForm] = useState<any>(null)
  const [saved, setSaved] = useState(false)
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    fetch('/api/recruit/data').then((r) => r.json()).then((d) => {
      setData(d)
      if (!d.error) setForm({ ...d.profile })
    }).catch(() => {})
  }, [])

  if (!data || data.error || !form) {
    return <Shell me={me}><div style={{ color: 'var(--muted)' }}>{data?.error || 'Loading profile…'}</div></Shell>
  }

  const readOnly = Boolean(data.readOnly)
  const publicUrl = typeof window !== 'undefined'
    ? `${window.location.origin}/recruit/p/${data.profile.slug}`
    : `/recruit/p/${data.profile.slug}`

  async function save() {
    setBusy(true)
    await postData({ action: 'saveProfile', profile: form })
    setBusy(false)
    setSaved(true)
    setTimeout(() => setSaved(false), 2500)
  }

  return (
    <Shell me={me}>
      <h2>{readOnly ? `${data.profile.user.name}'s profile` : 'My profile'}</h2>
      <p className="rc-sub">This powers your shareable coach page and your résumé.</p>

      <div className="rc-alert" style={{ margin: '16px 0', borderColor: 'var(--accent)', background: 'var(--accent-soft)' }}>
        <b className="num" style={{ fontSize: 13 }}>{publicUrl}</b>
        <span style={{ color: 'var(--muted)' }}>· this link goes in every coach email</span>
        <span style={{ marginLeft: 'auto', display: 'flex', gap: 8 }}>
          <button className="rc-btn ghost small" onClick={() => navigator.clipboard?.writeText(publicUrl)}>Copy link</button>
          <a className="rc-btn ghost small" style={{ textDecoration: 'none' }} href={`/recruit/p/${data.profile.slug}`} target="_blank">Preview</a>
        </span>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '0 16px', maxWidth: 760 }}>
        {FIELDS.map((f) => (
          <div key={f.key}>
            <label className="rc-label">{f.label}</label>
            <input className="rc-input" value={form[f.key] || ''} placeholder={f.placeholder} onChange={(e) => setForm({ ...form, [f.key]: e.target.value })} disabled={readOnly} />
          </div>
        ))}
        <div>
          <label className="rc-label">Graduation year</label>
          <input className="rc-input num" value={form.gradYear} onChange={(e) => setForm({ ...form, gradYear: e.target.value.replace(/\D/g, '') })} disabled={readOnly} />
        </div>
      </div>

      <div style={{ maxWidth: 760 }}>
        <label className="rc-label">Academics (courses, test scores, intended major)</label>
        <textarea className="rc-textarea" rows={2} value={form.academics || ''} onChange={(e) => setForm({ ...form, academics: e.target.value })} disabled={readOnly} />
        <label className="rc-label">Honors & awards (one per line)</label>
        <textarea className="rc-textarea" rows={2} value={form.honors || ''} onChange={(e) => setForm({ ...form, honors: e.target.value })} disabled={readOnly} />
        <label className="rc-label">References (club coach, HS coach)</label>
        <textarea className="rc-textarea" rows={2} value={form.refs || ''} onChange={(e) => setForm({ ...form, refs: e.target.value })} disabled={readOnly} />
        <label className="rc-label">Upcoming events — “come watch me play”</label>
        <textarea className="rc-textarea" rows={2} placeholder="e.g., ECNL Showcase, Orlando · July 18–20 · Field 7, #10 in navy" value={form.upcoming || ''} onChange={(e) => setForm({ ...form, upcoming: e.target.value })} disabled={readOnly} />

        <div style={{ display: 'flex', gap: 14, alignItems: 'center', marginTop: 14, flexWrap: 'wrap' }}>
          <label style={{ display: 'flex', gap: 8, alignItems: 'center', fontSize: 13.5, cursor: 'pointer' }}>
            <input type="checkbox" checked={Boolean(form.ncaaRegistered)} onChange={(e) => setForm({ ...form, ncaaRegistered: e.target.checked })} disabled={readOnly} style={{ width: 16, height: 16, accentColor: 'var(--brand)' }} />
            Registered with NCAA Eligibility Center
          </label>
          <label style={{ display: 'flex', gap: 8, alignItems: 'center', fontSize: 13.5, cursor: 'pointer' }}>
            <input type="checkbox" checked={Boolean(form.isPublic)} onChange={(e) => setForm({ ...form, isPublic: e.target.checked })} disabled={readOnly} style={{ width: 16, height: 16, accentColor: 'var(--brand)' }} />
            Public profile page enabled
          </label>
        </div>

        {!readOnly && (
          <div style={{ display: 'flex', gap: 10, alignItems: 'center', marginTop: 18 }}>
            <button className="rc-btn primary" onClick={save} disabled={busy}>{busy ? 'Saving…' : 'Save profile'}</button>
            {saved && <span className="rc-chip good">Saved ✓</span>}
          </div>
        )}
      </div>
    </Shell>
  )
}
