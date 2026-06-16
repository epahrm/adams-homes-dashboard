'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import MilestoneCard from '@/components/MilestoneCard'

interface Milestone {
  id: string
  order: number
  title: string
  description: string
  keyPoints: string
  resourceUrl?: string
  videoUrl?: string
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

      setMilestones(prev =>
        prev.map(m =>
          m.id === milestoneId
            ? {
                ...m,
                progress: [{ completed, completedAt: completed ? new Date().toISOString() : undefined }],
              }
            : m
        )
      )
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
            <div>
              <h1 className="text-4xl font-bold mb-2">Welcome, {user.name}!</h1>
              <p className="text-blue-100">Complete your onboarding milestones to get started</p>
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
        <div className="bg-white rounded-lg shadow-lg p-6 mb-8">
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

        {/* Milestones */}
        <div>
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Onboarding Milestones</h2>

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
              completed={milestone.progress[0]?.completed || false}
              onToggle={handleMilestoneToggle}
            />
          ))}
        </div>
      </div>
    </div>
  )
}
