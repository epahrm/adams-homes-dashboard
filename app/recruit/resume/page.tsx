'use client'

import { useCallback, useEffect, useState } from 'react'
import { Guard, Shell, Me, postData } from '@/components/recruit/ui'
import { QUESTIONNAIRE } from '@/lib/recruit/content'

type Answers = Record<string, string | string[]>

interface ResumeContent {
  summary: string
  experience: string
  academics: string
  honors: string
}

export default function ResumePage() {
  return <Guard render={(me) => <Resume me={me} />} />
}

function Resume({ me }: { me: Me }) {
  const [data, setData] = useState<any>(null)
  const [answers, setAnswers] = useState<Answers>({})
  const [step, setStep] = useState<'questionnaire' | 'resume'>('questionnaire')
  const [content, setContent] = useState<ResumeContent>({ summary: '', experience: '', academics: '', honors: '' })
  const [saved, setSaved] = useState('')
  const [busy, setBusy] = useState(false)

  const load = useCallback(() => {
    fetch('/api/recruit/data').then((r) => r.json()).then((d) => {
      if (d.error) { setData(d); return }
      setData(d)
      setAnswers(d.questionnaire.answers || {})
      if (d.questionnaire.completedAt) setStep('resume')
      const p = d.profile
      const existing = d.resume?.content
      setContent({
        summary: existing?.summary || p.summary || '',
        experience: existing?.experience ||
          [p.clubTeam && `${p.clubTeam} — ${p.position || 'player'}`, p.highSchool && `${p.highSchool} — varsity`]
            .filter(Boolean).join('\n'),
        academics: existing?.academics || [p.gpa && `GPA: ${p.gpa}`, p.ncaaRegistered && 'NCAA Eligibility Center: registered'].filter(Boolean).join(' · '),
        honors: existing?.honors || p.honors || '',
      })
    }).catch(() => {})
  }, [])
  useEffect(load, [load])

  if (!data || data.error) {
    return <Shell me={me}><div style={{ color: 'var(--muted)' }}>{data?.error || 'Loading…'}</div></Shell>
  }

  const readOnly = Boolean(data.readOnly)
  const profile = data.profile
  const strengths: string[] = JSON.parse(profile.strengths || '[]')
  const status = data.resume?.status || 'NONE'
  const answeredCount = QUESTIONNAIRE.filter((q) => {
    const a = answers[q.id]
    return Array.isArray(a) ? a.length > 0 : Boolean(a && String(a).trim())
  }).length

  function setAnswer(qid: string, value: string, multi: boolean) {
    setAnswers((prev) => {
      if (!multi) return { ...prev, [qid]: value }
      const cur = Array.isArray(prev[qid]) ? (prev[qid] as string[]) : []
      return { ...prev, [qid]: cur.includes(value) ? cur.filter((v) => v !== value) : [...cur, value] }
    })
  }

  async function saveQuestionnaire() {
    setBusy(true)
    const res = await postData({ action: 'saveQuestionnaire', answers })
    setBusy(false)
    if (res.ok) {
      setSaved('Questionnaire saved — your strengths profile is ready.')
      setStep('resume')
      load()
    }
  }

  async function saveResume(submit: boolean) {
    setBusy(true)
    const res = await postData({ action: 'saveResume', content, submit })
    setBusy(false)
    if (res.ok) {
      setSaved(submit ? 'Sent to your advisor for review!' : 'Draft saved.')
      load()
    }
  }

  return (
    <Shell me={me}>
      <h2>Your soccer résumé</h2>
      <p className="rc-sub">Answer the questionnaire once — we turn it into a résumé coaches actually read.</p>

      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', margin: '16px 0' }}>
        {[
          { n: 1, t: 'Strengths questionnaire', done: Boolean(data.questionnaire.completedAt), active: step === 'questionnaire' },
          { n: 2, t: 'Strengths profile', done: strengths.length > 0, active: false },
          { n: 3, t: 'Résumé draft', done: status !== 'NONE', active: step === 'resume' },
          { n: 4, t: 'Advisor review', done: status === 'APPROVED', active: status === 'SUBMITTED' },
        ].map((s) => (
          <button
            key={s.n}
            onClick={() => setStep(s.n === 1 ? 'questionnaire' : 'resume')}
            className="rc-card"
            style={{
              flex: 1, minWidth: 150, textAlign: 'left', cursor: 'pointer', fontFamily: 'inherit',
              borderColor: s.done ? 'var(--good)' : s.active ? 'var(--accent)' : 'var(--line)',
              background: s.done ? 'var(--good-soft)' : s.active ? 'var(--accent-soft)' : 'var(--surface)',
              padding: '11px 14px', fontSize: 12.5, color: 'var(--muted)',
            }}
          >
            <b style={{ display: 'block', color: 'var(--ink)', fontSize: 13.5 }}>{s.n} · {s.t}</b>
            {s.done ? 'Done ✓' : s.active ? 'In progress' : 'Ahead'}
          </button>
        ))}
      </div>

      {saved && <div className="rc-success" style={{ marginBottom: 14 }}>{saved}</div>}
      {status === 'SUBMITTED' && (
        <div className="rc-alert" style={{ marginBottom: 14 }}>
          <span className="rc-dot warn" /> Submitted — your advisor is reviewing your résumé.
        </div>
      )}
      {status === 'APPROVED' && (
        <div className="rc-alert" style={{ marginBottom: 14, borderColor: 'var(--good)' }}>
          <span className="rc-dot good" /> Approved by your advisor{data.resume?.advisorComment ? ` — “${data.resume.advisorComment}”` : ''}. Share it with coaches!
        </div>
      )}
      {status === 'DRAFT' && data.resume?.advisorComment && (
        <div className="rc-alert" style={{ marginBottom: 14, borderColor: 'var(--warn)' }}>
          <span className="rc-dot warn" /> Advisor feedback: “{data.resume.advisorComment}” — revise and resubmit.
        </div>
      )}

      {step === 'questionnaire' && (
        <div style={{ maxWidth: 640 }}>
          <div className="eyebrow" style={{ marginBottom: 10 }}>
            Strengths questionnaire · <span className="num">{answeredCount} of {QUESTIONNAIRE.length}</span> answered
          </div>
          {QUESTIONNAIRE.map((q) => (
            <div key={q.id} className="rc-card" style={{ marginBottom: 10 }}>
              <div style={{ fontSize: 13.5, fontWeight: 600 }}>{q.text}</div>
              {q.kind === 'text' ? (
                <textarea
                  className="rc-textarea" rows={2} style={{ marginTop: 9 }}
                  placeholder={q.placeholder}
                  value={(answers[q.id] as string) || ''}
                  onChange={(e) => setAnswer(q.id, e.target.value, false)}
                  disabled={readOnly}
                />
              ) : (
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 9 }}>
                  {q.options!.map((o) => {
                    const sel = q.kind === 'multi'
                      ? Array.isArray(answers[q.id]) && (answers[q.id] as string[]).includes(o.label)
                      : answers[q.id] === o.label
                    return (
                      <button
                        key={o.label}
                        onClick={() => !readOnly && setAnswer(q.id, o.label, q.kind === 'multi')}
                        style={{
                          padding: '5px 12px', borderRadius: 99, fontSize: 12.5, cursor: 'pointer', fontFamily: 'inherit',
                          border: '1px solid ' + (sel ? 'var(--brand)' : 'var(--line)'),
                          background: sel ? 'var(--brand)' : 'var(--surface)',
                          color: sel ? 'var(--brand-ink)' : 'var(--muted)',
                          fontWeight: sel ? 700 : 400,
                        }}
                      >
                        {o.label}
                      </button>
                    )
                  })}
                </div>
              )}
            </div>
          ))}
          {!readOnly && (
            <button className="rc-btn primary" onClick={saveQuestionnaire} disabled={busy || answeredCount < 3}>
              {busy ? 'Saving…' : 'Save & build my strengths profile →'}
            </button>
          )}
        </div>
      )}

      {step === 'resume' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0,1fr) minmax(0,1fr)', gap: 18, alignItems: 'start' }}>
          <div>
            <div className="eyebrow" style={{ marginBottom: 8 }}>Your strengths profile</div>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 14 }}>
              {strengths.length ? strengths.map((s) => <span key={s} className="rc-chip brand">{s}</span>) : (
                <span style={{ fontSize: 13, color: 'var(--muted)' }}>Complete the questionnaire to generate your strengths.</span>
              )}
            </div>
            <div className="eyebrow" style={{ margin: '14px 0 4px' }}>Edit your résumé</div>
            <label className="rc-label">Player profile (auto-drafted from your questionnaire)</label>
            <textarea className="rc-textarea" rows={3} value={content.summary} onChange={(e) => setContent({ ...content, summary: e.target.value })} disabled={readOnly} />
            <label className="rc-label">Soccer experience (one item per line)</label>
            <textarea className="rc-textarea" rows={3} value={content.experience} onChange={(e) => setContent({ ...content, experience: e.target.value })} disabled={readOnly} />
            <label className="rc-label">Academics</label>
            <textarea className="rc-textarea" rows={2} value={content.academics} onChange={(e) => setContent({ ...content, academics: e.target.value })} disabled={readOnly} />
            <label className="rc-label">Honors & community (one item per line)</label>
            <textarea className="rc-textarea" rows={3} value={content.honors} onChange={(e) => setContent({ ...content, honors: e.target.value })} disabled={readOnly} />
            {!readOnly && (
              <div style={{ display: 'flex', gap: 8, marginTop: 14, flexWrap: 'wrap' }}>
                <button className="rc-btn ghost" onClick={() => saveResume(false)} disabled={busy}>Save draft</button>
                <button className="rc-btn primary" onClick={() => saveResume(true)} disabled={busy}>
                  Send to advisor for review
                </button>
                <button className="rc-btn ghost" onClick={() => window.print()}>Print / PDF</button>
              </div>
            )}
          </div>

          <div>
            <div className="eyebrow" style={{ marginBottom: 8 }}>Live preview</div>
            <div className="rc-paper">
              <header>
                <h3>{profile.user.name}</h3>
                <div className="tag">
                  Class of <span className="num">{profile.gradYear}</span>
                  {profile.position ? ` · ${profile.position}` : ''}
                  {profile.city ? ` · ${profile.city}${profile.state ? ', ' + profile.state : ''}` : ''}
                </div>
              </header>
              {content.summary && (<><h4>Player profile</h4><p>{content.summary}</p></>)}
              {content.experience && (
                <><h4>Soccer experience</h4>
                  <ul>{content.experience.split('\n').filter(Boolean).map((l, i) => <li key={i}>{l}</li>)}</ul></>
              )}
              {content.academics && (<><h4>Academics</h4><p>{content.academics}</p></>)}
              {content.honors && (
                <><h4>Honors & community</h4>
                  <ul>{content.honors.split('\n').filter(Boolean).map((l, i) => <li key={i}>{l}</li>)}</ul></>
              )}
              {profile.highlightUrl && (<><h4>Film</h4><p>{profile.highlightUrl}</p></>)}
            </div>
          </div>
        </div>
      )}
    </Shell>
  )
}
