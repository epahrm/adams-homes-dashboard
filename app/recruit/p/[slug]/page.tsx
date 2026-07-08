import { prisma } from '@/lib/db'
import { BRAND_NAME, BRAND_INITIALS } from '@/lib/recruit/brand'

export const dynamic = 'force-dynamic'

function initials(name: string): string {
  return name.split(/\s+/).map((w) => w[0]).filter(Boolean).slice(0, 2).join('').toUpperCase()
}

export default async function PublicProfile({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  let profile: any = null
  try {
    profile = await prisma.recProfile.findUnique({
      where: { slug },
      include: { user: { select: { name: true } }, resume: true },
    })
  } catch {
    profile = null
  }

  if (!profile || !profile.isPublic) {
    return (
      <div style={{ maxWidth: 560, margin: '0 auto', padding: '80px 20px', textAlign: 'center' }}>
        <h1 style={{ fontSize: 20 }}>Profile not available</h1>
        <p style={{ color: 'var(--muted)' }}>This athlete profile doesn&apos;t exist or isn&apos;t public.</p>
      </div>
    )
  }

  const strengths: string[] = JSON.parse(profile.strengths || '[]')
  const resumeContent = profile.resume?.status === 'APPROVED'
    ? JSON.parse(profile.resume.content || '{}')
    : null
  const stats: [string, string][] = [
    [profile.gpa, 'GPA'],
    [profile.height, 'Height'],
    [profile.jerseyNumber && `#${profile.jerseyNumber}`, 'Jersey'],
    [profile.ncaaRegistered ? 'Yes ✓' : '', 'NCAA registered'],
  ].filter(([v]) => Boolean(v)) as [string, string][]

  return (
    <div style={{ maxWidth: 860, margin: '0 auto', padding: '32px 20px 64px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 22, color: 'var(--muted)', fontSize: 13 }}>
        <div className="rc-crest">{BRAND_INITIALS}</div>
        <span><b style={{ color: 'var(--ink)' }}>{BRAND_NAME}</b> · athlete profile</span>
      </div>

      <div style={{ display: 'flex', gap: 18, alignItems: 'center', flexWrap: 'wrap' }}>
        <div style={{ width: 84, height: 84, borderRadius: 18, background: 'var(--brand)', color: 'var(--brand-ink)', display: 'grid', placeItems: 'center', fontSize: 28, fontWeight: 800, flex: 'none' }}>
          {initials(profile.user.name)}
        </div>
        <div style={{ flex: 1, minWidth: 220 }}>
          <div className="eyebrow">
            Class of <span className="num">{profile.gradYear}</span>
            {profile.city ? ` · ${profile.city}${profile.state ? ', ' + profile.state : ''}` : ''}
          </div>
          <h1 style={{ fontSize: 27, fontWeight: 800 }}>{profile.user.name}</h1>
          <p style={{ margin: '3px 0 0', color: 'var(--muted)', fontSize: 14 }}>
            {[profile.position, profile.clubTeam, profile.highSchool].filter(Boolean).join(' · ')}
          </p>
        </div>
        {profile.highlightUrl && (
          <a href={profile.highlightUrl} target="_blank" rel="noopener" className="rc-btn primary" style={{ textDecoration: 'none' }}>
            ▶ Watch highlight reel
          </a>
        )}
      </div>

      {strengths.length > 0 && (
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 18 }}>
          {strengths.map((s) => <span key={s} className="rc-chip brand">{s}</span>)}
        </div>
      )}

      {profile.summary && (
        <p style={{ marginTop: 16, fontSize: 15, maxWidth: '65ch' }}>{profile.summary}</p>
      )}

      {stats.length > 0 && (
        <div className="rc-tiles" style={{ marginTop: 20 }}>
          {stats.map(([v, label]) => (
            <div key={label} className="rc-tile">
              <div className="n num" style={{ fontSize: 20 }}>{v}</div>
              <div className="t">{label}</div>
            </div>
          ))}
        </div>
      )}

      <div className="rc-grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', marginTop: 20 }}>
        {profile.academics && (
          <div className="rc-card"><h3>Academics</h3><p style={{ margin: '6px 0 0', fontSize: 13.5, color: 'var(--muted)' }}>{profile.academics}</p></div>
        )}
        {profile.honors && (
          <div className="rc-card"><h3>Honors</h3>
            <ul style={{ margin: '6px 0 0', paddingLeft: 18, fontSize: 13.5, color: 'var(--muted)' }}>
              {profile.honors.split('\n').filter(Boolean).map((h: string, i: number) => <li key={i}>{h}</li>)}
            </ul>
          </div>
        )}
        {profile.refs && (
          <div className="rc-card"><h3>References</h3><p style={{ margin: '6px 0 0', fontSize: 13.5, color: 'var(--muted)', whiteSpace: 'pre-line' }}>{profile.refs}</p></div>
        )}
      </div>

      {profile.upcoming && (
        <div className="rc-card" style={{ marginTop: 14, borderColor: 'var(--accent)', background: 'var(--accent-soft)' }}>
          <h3>Upcoming — come watch</h3>
          <p style={{ margin: '6px 0 0', fontSize: 13.5, whiteSpace: 'pre-line' }}>{profile.upcoming}</p>
        </div>
      )}

      {resumeContent?.experience && (
        <div className="rc-card" style={{ marginTop: 14 }}>
          <h3>Soccer experience</h3>
          <ul style={{ margin: '6px 0 0', paddingLeft: 18, fontSize: 13.5, color: 'var(--muted)' }}>
            {resumeContent.experience.split('\n').filter(Boolean).map((l: string, i: number) => <li key={i}>{l}</li>)}
          </ul>
        </div>
      )}
    </div>
  )
}
