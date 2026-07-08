'use client'

import { useState } from 'react'
import { Guard, Shell, Me } from '@/components/recruit/ui'
import { OFFICIAL_RESOURCES, GLOSSARY, PARENT_GUIDE } from '@/lib/recruit/content'

type Tab = 'official' | 'glossary' | 'parents'

export default function LibraryPage() {
  return <Guard render={(me) => <Library me={me} />} />
}

function Library({ me }: { me: Me }) {
  const [tab, setTab] = useState<Tab>(me.role === 'PARENT' ? 'parents' : 'official')
  const [search, setSearch] = useState('')

  const terms = GLOSSARY.filter(
    (t) => !search || (t.term + ' ' + t.def).toLowerCase().includes(search.toLowerCase())
  )

  return (
    <Shell me={me}>
      <h2>Library</h2>
      <p className="rc-sub">Official resources, the recruiting dictionary, and the parent playbook.</p>

      <div style={{ display: 'flex', gap: 8, margin: '16px 0' }}>
        {([['official', 'Official resources'], ['glossary', 'Recruiting dictionary'], ['parents', 'Parent playbook']] as [Tab, string][]).map(([t, label]) => (
          <button
            key={t}
            className="rc-btn"
            style={{
              borderRadius: 99, padding: '7px 14px', fontSize: 13,
              background: tab === t ? 'var(--brand)' : 'var(--surface)',
              color: tab === t ? 'var(--brand-ink)' : 'var(--muted)',
              border: '1px solid ' + (tab === t ? 'var(--brand)' : 'var(--line)'),
            }}
            onClick={() => setTab(t)}
          >
            {label}
          </button>
        ))}
      </div>

      {tab === 'official' && (
        <div className="rc-grid" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))' }}>
          {OFFICIAL_RESOURCES.map((r) => (
            <a key={r.title} href={r.url} target="_blank" rel="noopener" style={{ textDecoration: 'none', color: 'inherit' }}>
              <div className="rc-card" style={{ height: '100%', display: 'flex', flexDirection: 'column', gap: 8 }}>
                <span className="eyebrow" style={{ color: 'var(--brand)' }}>{r.org} · Official</span>
                <h3 style={{ fontSize: 14.5 }}>{r.title}</h3>
                <p style={{ margin: 0, fontSize: 12.5, color: 'var(--muted)' }}>{r.blurb}</p>
                <span style={{ marginTop: 'auto', fontSize: 12.5, fontWeight: 700, color: 'var(--brand)' }}>Open →</span>
              </div>
            </a>
          ))}
        </div>
      )}

      {tab === 'glossary' && (
        <div style={{ maxWidth: 720 }}>
          <input
            className="rc-input"
            placeholder="Search terms… (e.g., redshirt, walk-on, official visit)"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{ marginBottom: 14 }}
          />
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {terms.map((t) => (
              <div key={t.term} className="rc-card" style={{ padding: '12px 16px' }}>
                <b style={{ fontSize: 14 }}>{t.term}</b>
                <p style={{ margin: '3px 0 0', fontSize: 13, color: 'var(--muted)' }}>{t.def}</p>
              </div>
            ))}
            {terms.length === 0 && <p style={{ color: 'var(--muted)' }}>No terms match “{search}”.</p>}
          </div>
        </div>
      )}

      {tab === 'parents' && (
        <div style={{ maxWidth: 680 }}>
          <div className="rc-card" style={{ borderColor: 'var(--brand)' }}>
            <h3 style={{ fontSize: 17 }}>{PARENT_GUIDE.title}</h3>
            <p style={{ fontSize: 13, color: 'var(--muted)', margin: '4px 0 0' }}>
              How the recruiting process really works — and how to best support your athlete.
            </p>
          </div>
          {PARENT_GUIDE.sections.map((s) => (
            <div key={s.heading} className="rc-card" style={{ marginTop: 10 }}>
              <h3>{s.heading}</h3>
              <p style={{ margin: '5px 0 0', fontSize: 13.5 }}>{s.body}</p>
            </div>
          ))}
          <div className="rc-advisor-note" style={{ marginTop: 12 }}>
            <div className="rc-avatar" style={{ background: 'var(--brand)', color: 'var(--brand-ink)' }}>★</div>
            <div>
              <div className="eyebrow" style={{ color: 'var(--brand)' }}>The golden rule</div>
              <p>Coaches want to hear from the athlete, not the parents. Your lane: logistics, academics, and encouragement.</p>
            </div>
          </div>
        </div>
      )}
    </Shell>
  )
}
