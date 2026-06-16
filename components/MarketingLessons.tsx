'use client'

const YOUTUBE_PLAYLIST_URL = 'https://www.youtube.com/playlist?list=PLfwHPrzjohJorq01OX4yZkirHDcuowUed'

export default function MarketingLessons() {
  return (
    <div className="card p-4 mb-6 bg-gradient-to-r from-blue-50 to-orange-50 border-l-4 border-primary">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-bold text-gray-900 mb-1">📚 Marketing Lessons Library</h3>
          <p className="text-sm text-gray-600">
            30-minute video training lessons to enhance your skills
          </p>
        </div>
        <a
          href={YOUTUBE_PLAYLIST_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="btn-primary text-sm whitespace-nowrap ml-4"
        >
          🎥 Watch Videos
        </a>
      </div>
    </div>
  )
}
