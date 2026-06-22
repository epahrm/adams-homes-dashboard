'use client'

interface TrainingClass {
  date: string
  time: string
  instructor: string
  zoomLink?: string
}

interface TrainingScheduleProps {
  trainingDate?: string
  videoLink?: string
}

export default function TrainingSchedule({
  trainingDate,
  videoLink,
}: TrainingScheduleProps) {
  // Sample upcoming 543 training classes
  const upcomingClasses: TrainingClass[] = [
    {
      date: '2026-06-24',
      time: '10:00 AM - 12:00 PM ET',
      instructor: 'Sarah Johnson',
      zoomLink: 'https://zoom.us/j/543training',
    },
    {
      date: '2026-06-25',
      time: '2:00 PM - 4:00 PM ET',
      instructor: 'Michael Chen',
      zoomLink: 'https://zoom.us/j/543training',
    },
    {
      date: '2026-06-26',
      time: '10:00 AM - 12:00 PM ET',
      instructor: 'Amanda Davis',
      zoomLink: 'https://zoom.us/j/543training',
    },
  ]

  const formatDate = (dateString: string) => {
    const date = new Date(dateString + 'T00:00:00')
    return date.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    })
  }

  return (
    <div className="card p-6 mb-6 border-l-4 border-secondary">
      <h2 className="text-xl font-bold text-gray-900 mb-4">🎓 543 Training Program</h2>

      {trainingDate && (
        <div className="mb-6 p-4 bg-orange-50 border border-secondary rounded-lg">
          <p className="text-sm text-gray-700 mb-2">
            <strong>Your Scheduled Training Date:</strong>
          </p>
          <p className="text-lg font-bold text-secondary mb-3">
            {formatDate(trainingDate)}
          </p>
          {videoLink && (
            <a
              href={videoLink}
              target="_blank"
              rel="noopener noreferrer"
              className="btn-primary text-sm"
            >
              🎥 Join Training Video
            </a>
          )}
          {!videoLink && (
            <p className="text-sm text-gray-600 italic">
              Waiting for video link - contact IT when ready
            </p>
          )}
        </div>
      )}

      <div>
        <h3 className="font-bold text-gray-900 mb-3">Upcoming Class Schedule</h3>
        <div className="space-y-3">
          {upcomingClasses.map((cls, idx) => (
            <div
              key={idx}
              className="p-3 bg-gray-50 rounded-lg border border-gray-200"
            >
              <div className="flex justify-between items-start mb-2">
                <div>
                  <p className="font-semibold text-gray-900">
                    {formatDate(cls.date)}
                  </p>
                  <p className="text-sm text-gray-700">{cls.time}</p>
                </div>
                <a
                  href={cls.zoomLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary text-sm font-semibold hover:underline"
                >
                  Join Zoom
                </a>
              </div>
              <p className="text-sm text-gray-600">Instructor: {cls.instructor}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
        <p className="text-xs text-blue-900">
          <strong>💡 Note:</strong> All training sessions are recorded. Contact IT if you need access to a previous session.
        </p>
      </div>
    </div>
  )
}
