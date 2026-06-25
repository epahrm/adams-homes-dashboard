'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function AdminLoginPage() {
  const router = useRouter()
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const response = await fetch('/api/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'login',
          userType: 'admin',
          email: formData.email,
          password: formData.password,
        }),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Authentication failed')
      }

      const admin = await response.json()
      localStorage.setItem('admin', JSON.stringify(admin))
      router.push('/admin')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen gradient-primary flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="bg-white rounded-lg shadow-2xl p-8">
          <div className="text-center mb-8">
            <div className="w-32 h-32 mx-auto mb-4">
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
                <text x="200" y="290" fontFamily="Arial, sans-serif" fontSize="36" fontWeight="bold" fill="#003DA5" textAnchor="middle">ADAMS</text>
                <text x="200" y="318" fontFamily="Arial, sans-serif" fontSize="36" fontWeight="bold" fill="#003DA5" textAnchor="middle">HOMES</text>
              </svg>
            </div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Admin Panel</h1>
            <p className="text-gray-600">Adams Homes Onboarding Manager</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Email
              </label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleInputChange}
                placeholder="admin@adamshomes.com"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Password
              </label>
              <input
                type="password"
                name="password"
                value={formData.password}
                onChange={handleInputChange}
                placeholder="••••••••"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                required
              />
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className={`w-full py-2 px-4 rounded-lg font-semibold text-white transition-all bg-primary hover:bg-blue-700 ${
                loading ? 'opacity-50 cursor-not-allowed' : ''
              }`}
            >
              {loading ? 'Signing in...' : 'Sign In'}
            </button>
          </form>

          <div className="mt-6 text-center">
            <a
              href="/"
              className="text-primary hover:underline text-sm font-semibold"
            >
              ← Back to Employee Login
            </a>
          </div>
        </div>
      </div>
    </div>
  )
}
