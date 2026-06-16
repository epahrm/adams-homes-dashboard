'use client'

import { useState } from 'react'

const YOUTUBE_PLAYLIST_ID = 'PLfwHPrzjohJorq01OX4yZkirHDcuowUed'
const YOUTUBE_PLAYLIST_URL = 'https://www.youtube.com/playlist?list=PLfwHPrzjohJorq01OX4yZkirHDcuowUed'

export default function MarketingLessons() {
  const [selectedVideo, setSelectedVideo] = useState<string | null>(null)

  return (
    <div className="card p-6 mb-8">
      <h2 className="text-2xl font-bold text-gray-900 mb-2">📚 Marketing Lessons Library</h2>
      <p className="text-gray-600 mb-6">
        Access 30-minute marketing training lessons to enhance your skills and knowledge.
      </p>

      {/* YouTube Playlist Embed */}
      <div className="mb-6">
        <div className="bg-black rounded-lg overflow-hidden">
          <iframe
            width="100%"
            height="400"
            src={`https://www.youtube.com/embed/videoseries?list=${YOUTUBE_PLAYLIST_ID}`}
            title="Adams Homes Marketing Training Lessons"
            frameBorder="0"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
          />
        </div>
      </div>

      {/* Info Box */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <p className="text-blue-900 text-sm">
          <strong>💡 Tip:</strong> Click the playlist icon in the YouTube player to see all lessons and navigate between them.
        </p>
      </div>

      {/* Direct Link */}
      <div className="mt-6 text-center">
        <a
          href={YOUTUBE_PLAYLIST_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="btn-primary inline-block"
        >
          🔗 Open Full Playlist in YouTube
        </a>
      </div>
    </div>
  )
}
