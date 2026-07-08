'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { BRAND_NAME, BRAND_INITIALS } from '@/lib/recruit/brand'

export default function SetupPage() {
  const router = useRouter()
  const [status, setStatus] = useState<{ initialized: boolean; hasAdvisor: boolean } | null>(null)
  const [form, setForm] = useState({ name: '', email: '', password: '' })
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    fetch('/api/recruit/setup').then((r) => r.json()).then(setStatus).catch(() => setStatus({ initialized: false, hasAdvisor: false }))
  }, [])

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setBusy(true)
    try {
      const res = await fetch('/api/recruit/setup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      const data = await res.json()
      if (!res.ok) { setError(data.error || 'Setup failed'); return }
      router.push('/recruit/advisor')
    } catch {
      setError('Network error — please try again')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div style={{ maxWidth: 460, margin: '0 auto', padding: '56px 20px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <div className="rc-crest" style={{ width: 44, height: 44, fontSize: 17, borderRadius: 10 }}>{BRAND_INITIALS}</div>
        <h1 style={{ fontSize: 22, fontWeight: 800 }}>{BRAND_NAME} — Setup</h1>
      </div>
      <p className="rc-sub" style={{ margin: '10px 0 22px' }}>
        One-time initialization: this creates the platform&apos;s database tables, loads the
        standard milestone plans and modules, and creates <strong>your advisor account</strong>.
      </p>

      {status?.hasAdvisor ? (
        <div className="rc-card">
          <p>Setup is already complete. <a href="/recruit">Sign in →</a></p>
        </div>
      ) : (
        <form onSubmit={submit} className="rc-card" style={{ boxShadow: 'var(--shadow)' }}>
          <label className="rc-label" htmlFor="name">Your name</label>
          <input id="name" className="rc-input" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
          <label className="rc-label" htmlFor="email">Email</label>
          <input id="email" type="email" className="rc-input" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} required />
          <label className="rc-label" htmlFor="password">Password (8+ characters)</label>
          <input id="password" type="password" className="rc-input" minLength={8} value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} required />
          {error && <div className="rc-error" style={{ marginTop: 14 }}>{error}</div>}
          <button className="rc-btn primary" style={{ width: '100%', marginTop: 16 }} disabled={busy}>
            {busy ? 'Setting up…' : 'Initialize platform & create my account'}
          </button>
        </form>
      )}
    </div>
  )
}
