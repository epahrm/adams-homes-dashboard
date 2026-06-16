'use client'

import { useState } from 'react'

interface MilestoneCardProps {
  id: string
  order: number
  title: string
  description: string
  keyPoints: string
  resourceUrl?: string
  videoUrl?: string
  completed: boolean
  onToggle: (milestoneId: string, completed: boolean) => Promise<void>
}

export default function MilestoneCard({
  id,
  order,
  title,
  description,
  keyPoints,
  resourceUrl,
  videoUrl,
  completed,
  onToggle,
}: MilestoneCardProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [isExpanded, setIsExpanded] = useState(false)

  const handleToggle = async () => {
    setIsLoading(true)
    try {
      await onToggle(id, !completed)
    } finally {
      setIsLoading(false)
    }
  }

  const points = keyPoints.split('\n').filter(p => p.trim())

  return (
    <div
      className={`card p-6 mb-4 transition-all ${
        completed ? 'border-l-4 border-green-500 bg-green-50' : 'border-l-4 border-gray-300'
      }`}
    >
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-2">
            <button
              onClick={handleToggle}
              disabled={isLoading}
              className="flex-shrink-0"
              aria-label={completed ? 'Mark incomplete' : 'Mark complete'}
            >
              <span className="text-2xl">{completed ? '✅' : '⭕'}</span>
            </button>
            <div>
              <h3 className="text-xl font-bold text-gray-900">
                {order}. {title}
              </h3>
              {completed && (
                <span className="text-sm text-green-600 font-semibold">✓ Completed</span>
              )}
            </div>
          </div>

          <p className="text-gray-700 mb-4 ml-9">{description}</p>

          {isExpanded && (
            <div className="ml-9 space-y-4">
              <div>
                <h4 className="font-semibold text-gray-900 mb-2">Key Points:</h4>
                <ul className="list-disc list-inside space-y-1 text-gray-700">
                  {points.map((point, idx) => (
                    <li key={idx} className="text-sm">
                      {point.trim()}
                    </li>
                  ))}
                </ul>
              </div>

              <div className="flex gap-3 flex-wrap">
                {resourceUrl && (
                  <a
                    href={resourceUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn-outline text-sm"
                  >
                    📄 Access Resources
                  </a>
                )}
                {videoUrl && (
                  <a
                    href={videoUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn-outline text-sm"
                  >
                    🎥 Watch Video
                  </a>
                )}
              </div>
            </div>
          )}

          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="mt-3 ml-9 text-primary font-semibold text-sm hover:underline"
          >
            {isExpanded ? '▼ Less Details' : '▶ More Details'}
          </button>
        </div>

        <div className="text-right text-sm text-gray-500">
          Step {order}/8
        </div>
      </div>
    </div>
  )
}
