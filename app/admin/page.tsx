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
              <img src="/adams-homes-logo.png" alt="Adams Homes" className="w-20 flex-shrink-0" style={{height: 'auto'}} />
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
  const [stats, setStats] = useState<{ total: number; completed: number; inProgress: number; questions: number }>({ total: 0, completed: 0, inProgress: 0, questions: 0 })

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const admin = JSON.parse(localStorage.getItem('admin') || '{}')
        const [usersRes, questionsRes] = await Promise.all([
          fetch('/api/admin/users', {
            headers: {
              'x-user-id': admin.id,
              'x-user-type': 'admin',
            },
          }),
          fetch('/api/questions', {
            headers: {
              'x-user-id': admin.id,
              'x-user-type': 'admin',
            },
          }),
        ])

        if (usersRes.ok && questionsRes.ok) {
          const users = await usersRes.json()
          const questions = await questionsRes.json()
          setStats({
            total: users.length,
            completed: 0,
            inProgress: users.length,
            questions: questions.filter((q: any) => !q.answered).length,
          })
        }
      } catch (error) {
        console.error('Error fetching stats:', error)
      }
    }

    fetchStats()
  }, [])

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-gray-900">Overview</h2>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg shadow p-6">
          <p className="text-gray-600 text-sm">Total Sales Associates</p>
          <p className="text-4xl font-bold text-primary mt-2">{stats.total}</p>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <p className="text-gray-600 text-sm">Completed Onboarding</p>
          <p className="text-4xl font-bold text-green-600 mt-2">{stats.completed}</p>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <p className="text-gray-600 text-sm">In Progress</p>
          <p className="text-4xl font-bold text-orange-600 mt-2">{stats.inProgress}</p>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <p className="text-gray-600 text-sm">Questions Pending</p>
          <p className="text-4xl font-bold text-blue-600 mt-2">{stats.questions}</p>
        </div>
      </div>
    </div>
  )
}

function QuestionsTab() {
  const [questions, setQuestions] = useState<any[]>([])
  const [loading, setLoading] = useState<boolean>(true)
  const [respondingTo, setRespondingTo] = useState<string | null>(null)
  const [response, setResponse] = useState<string>('')

  useEffect(() => {
    fetchQuestions()
  }, [])

  const fetchQuestions = async () => {
    try {
      const admin = JSON.parse(localStorage.getItem('admin') || '{}')
      const res = await fetch('/api/questions', {
        headers: {
          'x-user-id': admin.id,
          'x-user-type': 'admin',
        },
      })

      if (res.ok) {
        const data = await res.json()
        setQuestions(data)
      }
    } catch (error) {
      console.error('Error fetching questions:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleRespond = async (questionId: string) => {
    if (!response.trim()) return

    try {
      const admin = JSON.parse(localStorage.getItem('admin') || '{}')
      const res = await fetch('/api/admin/questions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': admin.id,
          'x-user-type': 'admin',
        },
        body: JSON.stringify({ questionId, response }),
      })

      if (res.ok) {
        setResponse('')
        setRespondingTo(null)
        fetchQuestions()
      }
    } catch (error) {
      console.error('Error responding:', error)
    }
  }

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
              {q.response && (
                <div className="bg-green-50 border border-green-200 rounded p-3 mb-3">
                  <p className="text-sm text-gray-600 mb-1"><strong>Response:</strong></p>
                  <p className="text-gray-700">{q.response}</p>
                </div>
              )}
              <p className="text-xs text-gray-500 mb-3">
                {new Date(q.createdAt).toLocaleDateString()} at {new Date(q.createdAt).toLocaleTimeString()}
              </p>
              {!q.answered && respondingTo === q.id && (
                <div className="space-y-2">
                  <textarea
                    value={response}
                    onChange={(e) => setResponse(e.target.value)}
                    placeholder="Type your response..."
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                    rows={3}
                  />
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleRespond(q.id)}
                      className="bg-primary text-white px-4 py-2 rounded-lg font-semibold hover:bg-blue-700"
                    >
                      Send Response
                    </button>
                    <button
                      onClick={() => {
                        setRespondingTo(null)
                        setResponse('')
                      }}
                      className="bg-gray-200 text-gray-700 px-4 py-2 rounded-lg font-semibold hover:bg-gray-300"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}
              {!q.answered && respondingTo !== q.id && (
                <button
                  onClick={() => setRespondingTo(q.id)}
                  className="text-primary font-semibold hover:underline"
                >
                  Respond
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

function AssociatesTab() {
  const [users, setUsers] = useState<any[]>([])
  const [loading, setLoading] = useState<boolean>(true)
  const [mode, setMode] = useState<'list' | 'add' | 'bulk'>('list')
  const [formData, setFormData] = useState({
    email: '',
    name: '',
    division: '',
    hireDate: '',
    lassoLogin: '',
    lassoPassword: '',
    emailLogin: '',
    emailPassword: '',
    fpgTrainingUrl: '',
  })
  const [bulkText, setBulkText] = useState('')
  const [message, setMessage] = useState('')

  useEffect(() => {
    if (mode === 'list') {
      fetchUsers()
    }
  }, [mode])

  const fetchUsers = async () => {
    try {
      const admin = JSON.parse(localStorage.getItem('admin') || '{}')
      const res = await fetch('/api/admin/users', {
        headers: {
          'x-user-id': admin.id,
          'x-user-type': 'admin',
        },
      })

      if (res.ok) {
        setUsers(await res.json())
      }
    } catch (error) {
      console.error('Error fetching users:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleAddUser = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const admin = JSON.parse(localStorage.getItem('admin') || '{}')
      const res = await fetch('/api/admin/users', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': admin.id,
          'x-user-type': 'admin',
        },
        body: JSON.stringify({ action: 'add', ...formData }),
      })

      const data = await res.json()
      if (res.ok) {
        setMessage(`User created! Temporary password: ${data.tempPassword}`)
        setFormData({
          email: '', name: '', division: '', hireDate: '',
          lassoLogin: '', lassoPassword: '', emailLogin: '', emailPassword: '', fpgTrainingUrl: '',
        })
        setTimeout(() => {
          setMode('list')
          setMessage('')
        }, 3000)
      } else {
        setMessage(`Error: ${data.error}`)
      }
    } catch (error) {
      setMessage(`Error: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  const handleBulkImport = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const lines = bulkText.trim().split('\n')
      const users = lines.map(line => {
        const [email, name, division, hireDate, lassoLogin, lassoPassword, emailLogin, emailPassword, fpgTrainingUrl] = line.split(',').map(s => s.trim())
        return { email, name, division, hireDate, lassoLogin, lassoPassword, emailLogin, emailPassword, fpgTrainingUrl }
      })

      const admin = JSON.parse(localStorage.getItem('admin') || '{}')
      const res = await fetch('/api/admin/users', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': admin.id,
          'x-user-type': 'admin',
        },
        body: JSON.stringify({ action: 'bulk-import', users }),
      })

      const data = await res.json()
      if (res.ok) {
        setMessage(`Imported ${data.imported} users, ${data.failed} failed`)
        setBulkText('')
        setTimeout(() => {
          setMode('list')
          setMessage('')
        }, 3000)
      } else {
        setMessage(`Error: ${data.error}`)
      }
    } catch (error) {
      setMessage(`Error: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-900">Sales Associates</h2>
        {mode === 'list' && (
          <div className="flex gap-2">
            <button
              onClick={() => setMode('add')}
              className="bg-primary text-white px-4 py-2 rounded-lg font-semibold hover:bg-blue-700"
            >
              + Add User
            </button>
            <button
              onClick={() => setMode('bulk')}
              className="bg-secondary text-white px-4 py-2 rounded-lg font-semibold hover:bg-orange-600"
            >
              📤 Bulk Import
            </button>
          </div>
        )}
      </div>

      {message && (
        <div className="bg-blue-50 border border-blue-200 text-blue-700 px-4 py-3 rounded-lg">
          {message}
        </div>
      )}

      {mode === 'list' && (
        <>
          {loading ? (
            <p>Loading users...</p>
          ) : users.length === 0 ? (
            <div className="bg-white rounded-lg shadow p-8 text-center">
              <p className="text-gray-600 mb-4">No users yet. Add your first sales associate.</p>
              <button
                onClick={() => setMode('add')}
                className="bg-primary text-white px-6 py-2 rounded-lg font-semibold hover:bg-blue-700"
              >
                Add First User
              </button>
            </div>
          ) : (
            <div className="bg-white rounded-lg shadow overflow-hidden">
              <table className="w-full">
                <thead className="bg-gray-50 border-b">
                  <tr>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Name</th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Email</th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Division</th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map(user => (
                    <tr key={user.id} className="border-b hover:bg-gray-50">
                      <td className="px-6 py-4 text-sm text-gray-900">{user.name}</td>
                      <td className="px-6 py-4 text-sm text-gray-600">{user.email}</td>
                      <td className="px-6 py-4 text-sm text-gray-600">{user.division}</td>
                      <td className="px-6 py-4 text-sm">
                        <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-xs font-semibold">Active</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}

      {mode === 'add' && (
        <div className="bg-white rounded-lg shadow p-6 max-w-2xl">
          <h3 className="text-lg font-bold mb-4">Add New Sales Associate</h3>
          <form onSubmit={handleAddUser} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Email *</label>
                <input
                  type="email"
                  required
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                  placeholder="email@example.com"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Name *</label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                  placeholder="John Doe"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Division</label>
                <input
                  type="text"
                  value={formData.division}
                  onChange={(e) => setFormData({ ...formData, division: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                  placeholder="Division name"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Hire Date</label>
                <input
                  type="date"
                  value={formData.hireDate}
                  onChange={(e) => setFormData({ ...formData, hireDate: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Lasso Username</label>
                <input
                  type="text"
                  value={formData.lassoLogin}
                  onChange={(e) => setFormData({ ...formData, lassoLogin: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Lasso Password</label>
                <input
                  type="password"
                  value={formData.lassoPassword}
                  onChange={(e) => setFormData({ ...formData, lassoPassword: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Email Login</label>
                <input
                  type="text"
                  value={formData.emailLogin}
                  onChange={(e) => setFormData({ ...formData, emailLogin: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Email Password</label>
                <input
                  type="password"
                  value={formData.emailPassword}
                  onChange={(e) => setFormData({ ...formData, emailPassword: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>
              <div className="col-span-2">
                <label className="block text-sm font-semibold text-gray-700 mb-1">FPG Training URL</label>
                <input
                  type="url"
                  value={formData.fpgTrainingUrl}
                  onChange={(e) => setFormData({ ...formData, fpgTrainingUrl: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                  placeholder="https://..."
                />
              </div>
            </div>
            <div className="flex gap-2 pt-4">
              <button
                type="submit"
                className="bg-primary text-white px-6 py-2 rounded-lg font-semibold hover:bg-blue-700"
              >
                Add User
              </button>
              <button
                type="button"
                onClick={() => setMode('list')}
                className="bg-gray-200 text-gray-700 px-6 py-2 rounded-lg font-semibold hover:bg-gray-300"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {mode === 'bulk' && (
        <div className="bg-white rounded-lg shadow p-6 max-w-2xl">
          <h3 className="text-lg font-bold mb-4">Bulk Import Users</h3>
          <p className="text-gray-600 mb-4 text-sm">
            Paste CSV data (one user per line). Format: email, name, division, hireDate, lassoLogin, lassoPassword, emailLogin, emailPassword, fpgTrainingUrl
          </p>
          <form onSubmit={handleBulkImport} className="space-y-4">
            <textarea
              value={bulkText}
              onChange={(e) => setBulkText(e.target.value)}
              placeholder="john@example.com, John Doe, Sales, 2026-06-01, lasso_user, lasso_pass, john@work.com, work_pass, https://fpg.example.com"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary font-mono text-sm"
              rows={8}
            />
            <div className="flex gap-2">
              <button
                type="submit"
                className="bg-secondary text-white px-6 py-2 rounded-lg font-semibold hover:bg-orange-600"
              >
                Import Users
              </button>
              <button
                type="button"
                onClick={() => setMode('list')}
                className="bg-gray-200 text-gray-700 px-6 py-2 rounded-lg font-semibold hover:bg-gray-300"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  )
}

function SettingsTab() {
  const [resources, setResources] = useState<any>({ milestones: [], lessons: [] })
  const [loading, setLoading] = useState<boolean>(true)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editData, setEditData] = useState<any>({})

  useEffect(() => {
    fetchResources()
  }, [])

  const fetchResources = async () => {
    try {
      const admin = JSON.parse(localStorage.getItem('admin') || '{}')
      const res = await fetch('/api/admin/resources', {
        headers: {
          'x-user-id': admin.id,
          'x-user-type': 'admin',
        },
      })

      if (res.ok) {
        setResources(await res.json())
      }
    } catch (error) {
      console.error('Error fetching resources:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSaveResource = async (type: 'milestone' | 'lesson') => {
    try {
      const admin = JSON.parse(localStorage.getItem('admin') || '{}')
      const res = await fetch('/api/admin/resources', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': admin.id,
          'x-user-type': 'admin',
        },
        body: JSON.stringify({ action: 'update', type, ...editData }),
      })

      if (res.ok) {
        setEditingId(null)
        setEditData({})
        fetchResources()
      }
    } catch (error) {
      console.error('Error saving resource:', error)
    }
  }

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-gray-900">Training Resources</h2>

      {loading ? (
        <p>Loading resources...</p>
      ) : (
        <>
          <div className="space-y-4">
            <h3 className="text-lg font-bold text-gray-900">Onboarding Milestones</h3>
            {resources.milestones.map((milestone: any) => (
              <div key={milestone.id} className="bg-white rounded-lg shadow p-6">
                <div className="flex justify-between items-start mb-3">
                  <h4 className="font-bold text-gray-900">{milestone.order}. {milestone.title}</h4>
                  <button
                    onClick={() => {
                      setEditingId(milestone.id)
                      setEditData({ ...milestone })
                    }}
                    className="text-primary font-semibold hover:underline text-sm"
                  >
                    Edit
                  </button>
                </div>
                <div className="space-y-2 text-sm text-gray-600">
                  <p><strong>Video URL:</strong> {milestone.videoUrl || 'Not set'}</p>
                  <p><strong>Resource URL:</strong> {milestone.resourceUrl || 'Not set'}</p>
                </div>
                {editingId === milestone.id && (
                  <div className="mt-4 pt-4 border-t space-y-3">
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-1">Video URL</label>
                      <input
                        type="url"
                        value={editData.videoUrl || ''}
                        onChange={(e) => setEditData({ ...editData, videoUrl: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-1">Resource URL</label>
                      <input
                        type="url"
                        value={editData.resourceUrl || ''}
                        onChange={(e) => setEditData({ ...editData, resourceUrl: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                      />
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleSaveResource('milestone')}
                        className="bg-primary text-white px-4 py-2 rounded-lg font-semibold text-sm"
                      >
                        Save
                      </button>
                      <button
                        onClick={() => setEditingId(null)}
                        className="bg-gray-200 text-gray-700 px-4 py-2 rounded-lg font-semibold text-sm"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>

          <div className="space-y-4 pt-6 border-t">
            <h3 className="text-lg font-bold text-gray-900">Marketing Lessons</h3>
            {resources.lessons.map((lesson: any) => (
              <div key={lesson.id} className="bg-white rounded-lg shadow p-6">
                <div className="flex justify-between items-start mb-3">
                  <h4 className="font-bold text-gray-900">{lesson.order}. {lesson.title}</h4>
                  <button
                    onClick={() => {
                      setEditingId(lesson.id)
                      setEditData({ ...lesson })
                    }}
                    className="text-primary font-semibold hover:underline text-sm"
                  >
                    Edit
                  </button>
                </div>
                <p className="text-sm text-gray-600"><strong>Video URL:</strong> {lesson.videoUrl || 'Not set'}</p>
                {editingId === lesson.id && (
                  <div className="mt-4 pt-4 border-t space-y-3">
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-1">Video URL</label>
                      <input
                        type="url"
                        value={editData.videoUrl || ''}
                        onChange={(e) => setEditData({ ...editData, videoUrl: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                      />
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleSaveResource('lesson')}
                        className="bg-primary text-white px-4 py-2 rounded-lg font-semibold text-sm"
                      >
                        Save
                      </button>
                      <button
                        onClick={() => setEditingId(null)}
                        className="bg-gray-200 text-gray-700 px-4 py-2 rounded-lg font-semibold text-sm"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  )
}
