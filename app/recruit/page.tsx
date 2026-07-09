'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { BRAND_NAME, BRAND_INITIALS, BRAND_TAGLINE } from '@/lib/recruit/brand'

type Mode = 'login' | 'athlete' | 'parent'

export default function RecruitLanding() {
  const router = useRouter()
  const [mode, setMode] = useState<Mode>('login')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  const [needsSetup, setNeedsSetup] = useState(false)

  const [form, setForm] = useState({
    name: '', email: '', password: '', gradYear: '', position: '',
    clubTeam: '', highSchool: '', athleteEmail: '',
  })

  useEffect(() => {
    fetch('/api/recruit/auth')
      .then((r) => r.json())
      .then((d) => {
        if (d.user) router.replace(d.user.role === 'ADVISOR' ? '/recruit/advisor' : '/recruit/dashboard')
      })
      .catch(() => {})
    fetch('/api/recruit/setup')
      .then((r) => r.json())
      .then((d) => setNeedsSetup(!d.hasAdvisor))
      .catch(() => {})
  }, [router])

  const set = (k: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setForm({ ...form, [k]: e.target.value })

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setBusy(true)
    try {
      const payload =
        mode === 'login'
          ? { action: 'login', email: form.email, password: form.password }
          : mode === 'athlete'
            ? { action: 'signup', role: 'ATHLETE', ...form }
            : { action: 'signup', role: 'PARENT', name: form.name, email: form.email, password: form.password, athleteEmail: form.athleteEmail }
      const res = await fetch('/api/recruit/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      const data = await res.json()
      if (!res.ok) { setError(data.error || 'Something went wrong'); return }
      router.push(data.user.role === 'ADVISOR' ? '/recruit/advisor' : '/recruit/dashboard')
    } catch {
      setError('Network error — please try again')
    } finally {
      setBusy(false)
    }
  }

  const years = (() => {
    const y = new Date().getFullYear()
    return Array.from({ length: 9 }, (_, i) => y + i)
  })()

  async function startDemo(role: 'ATHLETE' | 'PARENT' | 'ADVISOR') {
    setError('')
    setBusy(true)
    try {
      const res = await fetch('/api/recruit/demo', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role }),
      })
      const data = await res.json()
      if (!res.ok) { setError(data.error || 'Could not start the demo'); return }
      router.push(role === 'ADVISOR' ? '/recruit/advisor' : '/recruit/dashboard')
    } catch {
      setError('Network error — please try again')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div style={{ maxWidth: 460, margin: '0 auto', padding: '56px 20px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 6 }}>
        <div className="rc-crest" style={{ width: 44, height: 44, fontSize: 17, borderRadius: 10 }}>{BRAND_INITIALS}</div>
        <div>
          <h1 className="wordmark" style={{ fontSize: 24 }}>{BRAND_NAME}</h1>
          <div className="eyebrow" style={{ color: 'var(--accent)' }}>{BRAND_TAGLINE}</div>
        </div>
      </div>

      <div style={{ margin: '26px 0 4px' }}>
        <div style={{ fontSize: 34, fontWeight: 800, lineHeight: 1.12, letterSpacing: '-0.02em', textTransform: 'uppercase' }}>
          Your path.<br />Your game.<br /><span style={{ color: 'var(--accent)' }}>Your future.</span>
        </div>
        <p className="rc-sub" style={{ fontSize: 15, marginTop: 10 }}>
          Expert guidance. Proven strategies. <span style={{ color: 'var(--accent)', fontWeight: 700 }}>Real</span> connections.
        </p>
      </div>

      <div style={{ display: 'flex', gap: 8, margin: '22px 0 16px' }}>
        {([['login', 'Sign in'], ['athlete', 'Athlete sign up'], ['parent', 'Parent sign up']] as [Mode, string][]).map(([m, label]) => (
          <button
            key={m}
            className="rc-btn"
            style={{
              background: mode === m ? 'var(--brand)' : 'var(--surface)',
              color: mode === m ? 'var(--brand-ink)' : 'var(--muted)',
              border: '1px solid ' + (mode === m ? 'var(--brand)' : 'var(--line)'),
              borderRadius: 99, padding: '7px 14px', fontSize: 13,
            }}
            onClick={() => { setMode(m); setError('') }}
          >
            {label}
          </button>
        ))}
      </div>

      <form onSubmit={submit} className="rc-card" style={{ boxShadow: 'var(--shadow)' }}>
        {mode !== 'login' && (
          <>
            <label className="rc-label" htmlFor="name">{mode === 'athlete' ? 'Athlete name' : 'Your name'}</label>
            <input id="name" className="rc-input" value={form.name} onChange={set('name')} required autoComplete="name" />
          </>
        )}
        <label className="rc-label" htmlFor="email">Email</label>
        <input id="email" type="email" className="rc-input" value={form.email} onChange={set('email')} required autoComplete="email" />
        <label className="rc-label" htmlFor="password">Password</label>
        <input id="password" type="password" className="rc-input" value={form.password} onChange={set('password')} required minLength={mode === 'login' ? undefined : 8} autoComplete={mode === 'login' ? 'current-password' : 'new-password'} />

        {mode === 'athlete' && (
          <>
            <label className="rc-label" htmlFor="gradYear">High school graduation year</label>
            <select id="gradYear" className="rc-select" value={form.gradYear} onChange={set('gradYear')} required>
              <option value="">Select year…</option>
              {years.map((y) => <option key={y} value={y}>{y}</option>)}
            </select>
            <label className="rc-label" htmlFor="position">Primary position (optional)</label>
            <input id="position" className="rc-input" value={form.position} onChange={set('position')} placeholder="e.g., Center midfielder" />
            <label className="rc-label" htmlFor="clubTeam">Club team (optional)</label>
            <input id="clubTeam" className="rc-input" value={form.clubTeam} onChange={set('clubTeam')} />
            <label className="rc-label" htmlFor="highSchool">High school (optional)</label>
            <input id="highSchool" className="rc-input" value={form.highSchool} onChange={set('highSchool')} />
          </>
        )}

        {mode === 'parent' && (
          <>
            <label className="rc-label" htmlFor="athleteEmail">Your athlete&apos;s account email</label>
            <input id="athleteEmail" type="email" className="rc-input" value={form.athleteEmail} onChange={set('athleteEmail')} required placeholder="They sign up first — then you link here" />
          </>
        )}

        {error && <div className="rc-error" style={{ marginTop: 14 }}>{error}</div>}

        <button className="rc-btn primary" style={{ width: '100%', marginTop: 16 }} disabled={busy}>
          {busy ? 'One moment…' : mode === 'login' ? 'Sign in' : 'Create account'}
        </button>
      </form>

      <div className="rc-card" style={{ marginTop: 18, textAlign: 'center' }}>
        <div className="eyebrow" style={{ color: 'var(--accent)' }}>Just looking? Take the tour</div>
        <p className="rc-sub" style={{ margin: '6px 0 12px' }}>
          Explore every screen with a pre-filled demo family — no password, nothing to set up.
        </p>
        <div style={{ display: 'flex', gap: 8, justifyContent: 'center', flexWrap: 'wrap' }}>
          <button className="rc-btn primary" disabled={busy} onClick={() => startDemo('ATHLETE')}>Tour as athlete</button>
          <button className="rc-btn ghost" disabled={busy} onClick={() => startDemo('PARENT')}>Tour as parent</button>
          <button className="rc-btn ghost" disabled={busy} onClick={() => startDemo('ADVISOR')}>Tour as advisor</button>
        </div>
      </div>

      <p className="rc-sub" style={{ textAlign: 'center', marginTop: 18 }}>
        Guided by your advisor at every step — from first practice to signing day.
      </p>
      {needsSetup && (
        <p style={{ textAlign: 'center', marginTop: 10, fontSize: 13 }}>
          <a href="/recruit/setup">First-time advisor setup →</a>
        </p>
      )}
    </div>
  )
}
