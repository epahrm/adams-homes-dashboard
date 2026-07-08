'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { Guard, Shell, Me, Markdown, postData } from '@/components/recruit/ui'

const KIND_LABELS: Record<string, string> = {
  READ: 'Read', VIDEO: 'Video', TEMPLATE: 'Template', WORKSHEET: 'Worksheet', CALL: 'Advisor call',
}

export default function ModuleDetailPage() {
  return <Guard render={(me) => <ModuleDetail me={me} />} />
}

function ModuleDetail({ me }: { me: Me }) {
  const params = useParams<{ slug: string }>()
  const [mod, setMod] = useState<any>(null)
  const [doneIds, setDoneIds] = useState<Set<string>>(new Set())
  const [open, setOpen] = useState<string | null>(null)
  const [readOnly, setReadOnly] = useState(false)

  useEffect(() => {
    fetch(`/api/recruit/module?slug=${params.slug}`)
      .then((r) => r.json())
      .then((d) => {
        setMod(d.module)
        if (d.module?.lessons?.length) setOpen(d.module.lessons[0].id)
      })
    fetch('/api/recruit/data')
      .then((r) => r.json())
      .then((d) => {
        if (d.error) return
        setReadOnly(Boolean(d.readOnly))
        setDoneIds(new Set(d.lessonProgress.filter((p: any) => p.completed).map((p: any) => p.lessonId)))
      })
  }, [params.slug])

  if (!mod) return <Shell me={me}><div style={{ color: 'var(--muted)' }}>Loading module…</div></Shell>

  const done = mod.lessons.filter((l: any) => doneIds.has(l.id)).length
  const pct = mod.lessons.length ? Math.round((done / mod.lessons.length) * 100) : 0

  async function toggleDone(lessonId: string) {
    if (readOnly) return
    setDoneIds((prev) => {
      const next = new Set(prev)
      if (next.has(lessonId)) next.delete(lessonId)
      else next.add(lessonId)
      return next
    })
    await postData({ action: 'toggleLesson', lessonId })
  }

  return (
    <Shell me={me}>
      <Link href="/recruit/modules" style={{ fontSize: 13, fontWeight: 600 }}>← All modules</Link>
      <h2 style={{ marginTop: 8 }}>{mod.title}</h2>
      <p className="rc-sub">{mod.description}</p>
      <div style={{ display: 'flex', gap: 12, alignItems: 'center', margin: '14px 0 18px', maxWidth: 420 }}>
        <div className="rc-bar" style={{ flex: 1 }}><i style={{ width: `${pct}%` }} /></div>
        <span className="rc-chip plain num">{done} of {mod.lessons.length}</span>
      </div>

      <ul className="rc-lessons">
        {mod.lessons.map((l: any, i: number) => {
          const isDone = doneIds.has(l.id)
          const isOpen = open === l.id
          return (
            <li key={l.id} className={isDone ? 'done' : ''}>
              <button className="rc-lesson-head" onClick={() => setOpen(isOpen ? null : l.id)} aria-expanded={isOpen}>
                <span className="rc-tick">{isDone ? '✓' : i + 1}</span>
                <span style={{ fontWeight: 600 }}>{l.title}</span>
                <span style={{ marginLeft: 'auto', fontSize: 11, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.06em', whiteSpace: 'nowrap' }}>
                  {KIND_LABELS[l.kind] || l.kind}
                </span>
              </button>
              {isOpen && (
                <div>
                  <Markdown text={l.content} />
                  <div style={{ padding: '0 16px 14px 45px' }}>
                    <button className="rc-btn small" style={{ background: isDone ? 'var(--surface2)' : 'var(--brand)', color: isDone ? 'var(--muted)' : 'var(--brand-ink)' }} onClick={() => toggleDone(l.id)} disabled={readOnly}>
                      {isDone ? 'Mark as not done' : 'Mark lesson complete ✓'}
                    </button>
                  </div>
                </div>
              )}
            </li>
          )
        })}
      </ul>
    </Shell>
  )
}
