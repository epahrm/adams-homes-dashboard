'use client'

import { useEffect, useState } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import Link from 'next/link'
import { BRAND_NAME, BRAND_INITIALS } from '@/lib/recruit/brand'

export interface Me {
  id: string
  email: string
  name: string
  role: 'ATHLETE' | 'PARENT' | 'ADVISOR'
  athleteId?: string | null
}

export function useMe() {
  const [me, setMe] = useState<Me | null | undefined>(undefined)
  useEffect(() => {
    fetch('/api/recruit/auth')
      .then((r) => r.json())
      .then((d) => setMe(d.user ?? null))
      .catch(() => setMe(null))
  }, [])
  return me
}

export function initials(name: string): string {
  return name
    .split(/\s+/)
    .map((w) => w[0])
    .filter(Boolean)
    .slice(0, 2)
    .join('')
    .toUpperCase()
}

const ATHLETE_NAV = [
  { href: '/recruit/dashboard', label: 'My roadmap' },
  { href: '/recruit/modules', label: 'Modules' },
  { href: '/recruit/resume', label: 'My résumé' },
  { href: '/recruit/schools', label: 'My schools' },
  { href: '/recruit/library', label: 'Library' },
  { href: '/recruit/profile', label: 'My profile' },
]

const ADVISOR_NAV = [
  { href: '/recruit/advisor', label: 'Clients' },
  { href: '/recruit/library', label: 'Library' },
]

export function Shell({
  me,
  children,
  contextLabel,
}: {
  me: Me
  children: React.ReactNode
  contextLabel?: string
}) {
  const router = useRouter()
  const pathname = usePathname()
  const nav = me.role === 'ADVISOR' ? ADVISOR_NAV : ATHLETE_NAV

  async function logout() {
    await fetch('/api/recruit/auth', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'logout' }),
    })
    router.push('/recruit')
  }

  const roleLabel =
    me.role === 'ADVISOR' ? 'Advisor' : me.role === 'PARENT' ? 'Parent' : 'Athlete'

  return (
    <>
      <header className="rc-appbar">
        <div className="rc-crest">{BRAND_INITIALS}</div>
        <strong style={{ fontSize: 15 }}>{BRAND_NAME}</strong>
        <div className="rc-who">
          <span className="rc-rolepill">{roleLabel}</span>
          <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: 180 }}>
            {contextLabel || me.name}
          </span>
          <div className="rc-avatar">{initials(me.name)}</div>
          <button className="rc-btn ghost small" onClick={logout}>Sign out</button>
        </div>
      </header>
      <div className="rc-body">
        <nav className="rc-side">
          {nav.map((n) => (
            <Link key={n.href} href={n.href} className={pathname?.startsWith(n.href) ? 'on' : ''}>
              {n.label}
            </Link>
          ))}
        </nav>
        <main className="rc-pane">{children}</main>
      </div>
    </>
  )
}

export function Guard({
  children,
  render,
}: {
  children?: React.ReactNode
  render?: (me: Me) => React.ReactNode
}) {
  const me = useMe()
  const router = useRouter()
  useEffect(() => {
    if (me === null) router.replace('/recruit')
  }, [me, router])
  if (me === undefined) {
    return <div style={{ padding: 60, textAlign: 'center', color: 'var(--muted)' }}>Loading…</div>
  }
  if (me === null) return null
  return <>{render ? render(me) : children}</>
}

// Tiny markdown renderer for lesson content (headings, bold, lists, tables,
// blockquotes, links). Content is authored by us, not user-generated.
export function Markdown({ text }: { text: string }) {
  const html = renderMarkdown(text)
  return <div className="rc-lesson-body" dangerouslySetInnerHTML={{ __html: html }} />
}

function esc(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
}

function inline(s: string): string {
  return esc(s)
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.+?)\*/g, '<em>$1</em>')
    .replace(/`(.+?)`/g, '<code>$1</code>')
    .replace(/\[([^\]]+)\]\(([^)\s]+)\)/g, '<a href="$2" target="_blank" rel="noopener">$1</a>')
}

function renderMarkdown(text: string): string {
  const lines = text.split('\n')
  const out: string[] = []
  let list: string[] = []
  let ordered = false
  let table: string[][] = []
  let quote: string[] = []

  const flushList = () => {
    if (list.length) {
      out.push(`<${ordered ? 'ol' : 'ul'}>${list.map((l) => `<li>${l}</li>`).join('')}</${ordered ? 'ol' : 'ul'}>`)
      list = []
    }
  }
  const flushTable = () => {
    if (table.length) {
      const [head, ...rows] = table
      out.push(
        '<div style="overflow-x:auto"><table><thead><tr>' +
          head.map((c) => `<th>${inline(c)}</th>`).join('') +
          '</tr></thead><tbody>' +
          rows.map((r) => '<tr>' + r.map((c) => `<td>${inline(c)}</td>`).join('') + '</tr>').join('') +
          '</tbody></table></div>'
      )
      table = []
    }
  }
  const flushQuote = () => {
    if (quote.length) {
      out.push(`<blockquote>${quote.map(inline).join('<br/>')}</blockquote>`)
      quote = []
    }
  }

  for (const raw of lines) {
    const line = raw.trimEnd()
    const t = line.trim()
    if (t.startsWith('|')) {
      flushList(); flushQuote()
      const cells = t.split('|').slice(1, -1).map((c) => c.trim())
      if (cells.every((c) => /^:?-{2,}:?$/.test(c))) continue
      table.push(cells)
      continue
    }
    flushTable()
    if (t.startsWith('>')) { flushList(); quote.push(t.replace(/^>\s?/, '')); continue }
    flushQuote()
    if (/^\d+\.\s/.test(t)) {
      if (!ordered) flushList()
      ordered = true
      list.push(inline(t.replace(/^\d+\.\s/, '')))
      continue
    }
    if (t.startsWith('- ')) {
      if (ordered) flushList()
      ordered = false
      list.push(inline(t.slice(2)))
      continue
    }
    flushList()
    if (t.startsWith('### ')) { out.push(`<h4>${inline(t.slice(4))}</h4>`); continue }
    if (t.startsWith('## ')) { out.push(`<h4>${inline(t.slice(3))}</h4>`); continue }
    if (t.startsWith('# ')) { out.push(`<h4>${inline(t.slice(2))}</h4>`); continue }
    if (t === '') continue
    out.push(`<p>${inline(t)}</p>`)
  }
  flushList(); flushTable(); flushQuote()
  return out.join('')
}

export async function postData(body: Record<string, unknown>) {
  const res = await fetch('/api/recruit/data', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
  return res.json()
}
