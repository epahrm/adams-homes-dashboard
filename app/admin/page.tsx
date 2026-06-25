'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'

type TabType = 'dashboard' | 'questions' | 'associates' | 'settings'

export default function AdminPage() {
  const router = useRouter()
  const [admin, setAdmin] = useState<any>(null)
  const [activeTab, setActiveTab] = useState<TabType>('dashboard')

  useEffect(() => {
    const storedAdmin = localStorage.getItem('admin')
    if (!storedAdmin) {
      router.push('/admin-login')
      return
    }
    setAdmin(JSON.parse(storedAdmin))
  }, [router])

  const handleLogout = () => {
    localStorage.removeItem('admin')
    router.push('/admin-login')
  }

  if (!admin) return null

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="gradient-primary text-white">
        <div className="container py-6">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-4">
              <img src="/adams-homes-logo.png" alt="Adams Homes" className="w-16 h-16 flex-shrink-0" />
              <div>
                <h1 className="text-3xl font-bold">Admin Dashboard</h1>
                <p className="text-blue-100">Welcome, {admin.name}</p>
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

      {/* Tab Navigation */}
      <div className="bg-white border-b border-gray-200">
        <div className="container flex gap-8">
          {[
            { id: 'dashboard', label: '📊 Dashboard' },
            { id: 'questions', label: '💬 Questions' },
            { id: 'associates', label: '👥 Sales Associates' },
            { id: 'settings', label: '⚙️ Settings' },
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as TabType)}
              className={`py-4 px-2 font-semibold border-b-2 transition-all ${
                activeTab === tab.id
                  ? 'border-primary text-primary'
                  : 'border-transparent text-gray-600 hover:text-gray-900'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="container py-8">
        {activeTab === 'dashboard' && <DashboardTab />}
        {activeTab === 'questions' && <QuestionsTab />}
        {activeTab === 'associates' && <AssociatesTab />}
        {activeTab === 'settings' && <SettingsTab />}
      </div>
    </div>
  )
}

function DashboardTab() {
  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-gray-900">Overview</h2>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg shadow p-6">
          <p className="text-gray-600 text-sm">Total Sales Associates</p>
          <p className="text-4xl font-bold text-primary mt-2">–</p>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <p className="text-gray-600 text-sm">Completed Onboarding</p>
          <p className="text-4xl font-bold text-green-600 mt-2">–</p>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <p className="text-gray-600 text-sm">In Progress</p>
          <p className="text-4xl font-bold text-orange-600 mt-2">–</p>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <p className="text-gray-600 text-sm">Questions Pending</p>
          <p className="text-4xl font-bold text-blue-600 mt-2">–</p>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-bold text-gray-900 mb-4">Coming Soon</h3>
        <p className="text-gray-600">Charts, progress tracking, and detailed analytics will be available here.</p>
      </div>
    </div>
  )
}

function QuestionsTab() {
  const [questions, setQuestions] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const admin = localStorage.getItem('admin')
    if (!admin) return

    const fetchQuestions = async () => {
      try {
        const adminData = JSON.parse(admin)
        const response = await fetch('/api/questions', {
          headers: {
            'x-user-id': adminData.id,
            'x-user-type': 'admin',
          },
        })

        if (response.ok) {
          const data = await response.json()
          setQuestions(data)
        }
      } catch (error) {
        console.error('Error fetching questions:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchQuestions()
  }, [])

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-gray-900">Employee Questions</h2>

      {loading && <p className="text-gray-600">Loading questions...</p>}

      {!loading && questions.length === 0 && (
        <div className="bg-white rounded-lg shadow p-8 text-center">
          <p className="text-gray-600">No questions submitted yet.</p>
        </div>
      )}

      {!loading && questions.length > 0 && (
        <div className="space-y-4">
          {questions.map(q => (
            <div key={q.id} className="bg-white rounded-lg shadow p-6">
              <div className="flex justify-between items-start mb-3">
                <div>
                  <p className="font-bold text-gray-900">{q.user.name}</p>
                  <p className="text-sm text-gray-600">{q.user.division}</p>
                </div>
                <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                  q.answered ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                }`}>
                  {q.answered ? 'Answered' : 'Pending'}
                </span>
              </div>
              <p className="text-gray-700 mb-3">{q.question}</p>
              <p className="text-xs text-gray-500">
                {new Date(q.createdAt).toLocaleDateString()} at {new Date(q.createdAt).toLocaleTimeString()}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

function AssociatesTab() {
  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-gray-900">Sales Associates</h2>

      <div className="bg-white rounded-lg shadow p-8 text-center">
        <p className="text-gray-600">Associate management features coming soon.</p>
      </div>
    </div>
  )
}

function SettingsTab() {
  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-gray-900">Settings</h2>

      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-bold text-gray-900 mb-4">Email Configuration</h3>
        <p className="text-gray-600 mb-4">
          Configure SendGrid API key and email settings in your .env.local file.
        </p>
        <code className="bg-gray-100 p-3 rounded text-sm block text-gray-700">
          SENDGRID_API_KEY=your_api_key_here
        </code>
      </div>

      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-bold text-gray-900 mb-4">Welcome Video URL</h3>
        <p className="text-gray-600 mb-4">
          Add your president's welcome video URL in .env.local:
        </p>
        <code className="bg-gray-100 p-3 rounded text-sm block text-gray-700">
          PRESIDENT_VIDEO_URL=https://your-video-url
        </code>
      </div>

      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-bold text-gray-900 mb-4">Marketing Lessons</h3>
        <p className="text-gray-600">
          Add your 5-10 marketing lessons via the API or directly in the database.
        </p>
      </div>
    </div>
  )
}
