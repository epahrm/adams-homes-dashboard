'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import MilestoneCard from '@/components/MilestoneCard'
import MarketingLessons from '@/components/MarketingLessons'
import CertificateDisplay from '@/components/CertificateDisplay'
import ProgressLegend from '@/components/ProgressLegend'
import ProfileInfo from '@/components/ProfileInfo'
import CredentialsSection from '@/components/CredentialsSection'
import TrainingSchedule from '@/components/TrainingSchedule'
import { getDivisionById } from '@/lib/divisions'

interface Milestone {
  id: string
  order: number
  title: string
  description: string
  keyPoints: string
  resourceUrl?: string
  videoUrl?: string
  thumbnailUrl?: string
  progress: Array<{ completed: boolean; completedAt?: string }>
}

export default function Dashboard() {
  const router = useRouter()
  const [user, setUser] = useState<any>(null)
  const [milestones, setMilestones] = useState<Milestone[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    const storedUser = localStorage.getItem('user')
    if (!storedUser) {
      router.push('/')
      return
    }
    setUser(JSON.parse(storedUser))
  }, [router])

  useEffect(() => {
    if (!user) return

    const fetchMilestones = async () => {
      try {
        const response = await fetch('/api/milestones', {
          headers: {
            'x-user-id': user.id,
          },
        })
        if (!response.ok) throw new Error('Failed to fetch milestones')
        const data = await response.json()
        setMilestones(data)
      } catch (err) {
        setError('Failed to load milestones')
        console.error(err)
      } finally {
        setLoading(false)
      }
    }

    fetchMilestones()
  }, [user])

  const handleMilestoneToggle = async (milestoneId: string, completed: boolean) => {
    try {
      const response = await fetch('/api/milestones', {
        method: 'POST',
        headers: {
          'x-user-id': user.id,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ milestoneId, completed }),
      })

      if (!response.ok) throw new Error('Failed to update milestone')

      const updatedMilestones = milestones.map(m =>
        m.id === milestoneId
          ? {
              ...m,
              progress: [{ completed, completedAt: completed ? new Date().toISOString() : undefined }],
            }
          : m
      )

      setMilestones(updatedMilestones)

      // If all completed, send notification to manager
      const allComplete = updatedMilestones.every(m => m.progress[0]?.completed)
      if (allComplete && completed) {
        const division = getDivisionById(user.division)
        if (division) {
          // Send milestone completion notification (non-blocking)
          fetch('/api/milestones/notify', {
            method: 'POST',
            headers: {
              'x-user-id': user.id,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              userName: user.name,
              userEmail: user.email,
              division: user.division,
              managerEmail: division.managerEmail,
            }),
          }).catch(err => console.error('Notification failed:', err))
        }
      }
    } catch (err) {
      console.error('Error updating milestone:', err)
    }
  }

  const handleLogout = () => {
    localStorage.removeItem('user')
    router.push('/')
  }

  if (!user) return null

  const completedCount = milestones.filter(m => m.progress[0]?.completed).length
  const progress = milestones.length > 0 ? Math.round((completedCount / milestones.length) * 100) : 0

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="gradient-primary text-white">
        <div className="container py-8">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-6 flex-1">
              <div className="w-16 h-16 bg-white rounded-lg p-1 flex-shrink-0">
                <svg viewBox="0 0 400 300" xmlns="http://www.w3.org/2000/svg">
                  <path d="M 20 140 Q 40 120 60 140 Q 80 160 100 140" fill="none" stroke="#DC143C" strokeWidth="15" strokeLinecap="round"/>
                  <g>
                    <line x1="80" y1="220" x2="150" y2="40" stroke="#003DA5" strokeWidth="20" strokeLinecap="round"/>
                    <line x1="220" y1="40" x2="290" y2="220" stroke="#DC143C" strokeWidth="20" strokeLinecap="round"/>
                    <line x1="110" y1="150" x2="260" y2="150" stroke="#003DA5" strokeWidth="18" strokeLinecap="round"/>
                  </g>
                  <polygon points="185,20 205,20 195,40" fill="#DC143C"/>
                  <rect x="20" y="240" width="360" height="8" fill="#DC143C"/>
                  <rect x="20" y="250" width="360" height="4" fill="#003DA5"/>
                </svg>
              </div>
              <div>
                <h1 className="text-4xl font-bold mb-2">Welcome, {user.name}!</h1>
                <p className="text-blue-100">Adams Homes Sales Associate Onboarding Program</p>
              </div>
            </div>
            <button
              onClick={handleLogout}
              className="bg-white text-primary px-6 py-2 rounded-lg font-semibold hover:bg-blue-50"
            >
              Logout
            </button>
          </div>
        </div>
      </div>

      {/* Progress Section */}
      <div className="container py-8">
        {/* Profile Info */}
        <ProfileInfo
          name={user.name}
          division={user.division}
          hireDate={user.hireDate}
          manager={getDivisionById(user.division)?.manager || 'TBD'}
        />

        {/* Progress Bar */}
        <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Your Progress</h2>
          <div className="flex items-center gap-6">
            <div className="flex-1">
              <div className="w-full bg-gray-200 rounded-full h-4">
                <div
                  className="bg-gradient-to-r from-primary to-blue-600 h-4 rounded-full transition-all duration-500"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>
            <div className="text-3xl font-bold text-primary">{progress}%</div>
            <div className="text-center">
              <div className="text-3xl font-bold text-gray-900">{completedCount}/{milestones.length}</div>
              <div className="text-sm text-gray-600">Completed</div>
            </div>
          </div>
        </div>

        {/* Credentials Section */}
        <CredentialsSection
          emailLogin={user.emailLogin}
          lassoLogin={user.lassoLogin}
          fpgTrainingUrl={user.fpgTrainingUrl}
        />

        {/* 543 Training Schedule */}
        <TrainingSchedule trainingDate={user.hireDate} videoLink={user.videoLink} />

        {/* Progress Legend */}
        {milestones.length > 0 && <ProgressLegend milestones={milestones} />}

        {/* Certificate - Show when all complete */}
        {progress === 100 && (
          <div className="mb-8">
            <CertificateDisplay
              associateName={user.name}
              division={user.division}
              completionDate={new Date()}
            />
          </div>
        )}

        {/* Marketing Lessons */}
        <div className="mb-8">
          <MarketingLessons />
        </div>

        {/* Milestones */}
        <div>
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Adams Homes Sales Associate Onboarding Milestones</h2>

          {loading && (
            <div className="text-center py-12">
              <div className="inline-block animate-spin">⏳</div>
              <p className="text-gray-600 mt-4">Loading milestones...</p>
            </div>
          )}

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6">
              {error}
            </div>
          )}

          {milestones.length === 0 && !loading && (
            <div className="text-center py-12 bg-white rounded-lg">
              <p className="text-gray-600">No milestones found. Please check back later.</p>
            </div>
          )}

          {milestones.map(milestone => (
            <MilestoneCard
              key={milestone.id}
              id={milestone.id}
              order={milestone.order}
              title={milestone.title}
              description={milestone.description}
              keyPoints={milestone.keyPoints}
              resourceUrl={milestone.resourceUrl}
              videoUrl={milestone.videoUrl}
              thumbnailUrl={milestone.thumbnailUrl}
              completed={milestone.progress[0]?.completed || false}
              onToggle={handleMilestoneToggle}
            />
          ))}
        </div>
      </div>
    </div>
  )
}
