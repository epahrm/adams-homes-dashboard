'use client'

interface Milestone {
  id: string
  order: number
  title: string
  progress: Array<{ completed: boolean }>
}

interface ProgressLegendProps {
  milestones: Milestone[]
}

export default function ProgressLegend({ milestones }: ProgressLegendProps) {
  return (
    <div className="card p-4 mb-6 bg-white">
      <h3 className="text-sm font-bold text-gray-900 mb-3">Onboarding Progress</h3>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {milestones.map(milestone => (
          <div
            key={milestone.id}
            className={`p-3 rounded-lg border-2 transition-all ${
              milestone.progress[0]?.completed
                ? 'border-green-500 bg-green-50'
                : 'border-gray-300 bg-gray-50'
            }`}
          >
            <div className="flex items-start gap-2">
              <span className="text-lg">
                {milestone.progress[0]?.completed ? '✅' : '⭕'}
              </span>
              <div>
                <p className="text-xs font-semibold text-gray-900 leading-tight">
                  {milestone.title}
                </p>
                {milestone.progress[0]?.completed && (
                  <p className="text-xs text-green-600 font-semibold">Done</p>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
