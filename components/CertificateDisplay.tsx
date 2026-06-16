'use client'

import { useRef, useState } from 'react'

interface CertificateDisplayProps {
  associateName: string
  division: string
  completionDate: Date
}

export default function CertificateDisplay({
  associateName,
  division,
  completionDate,
}: CertificateDisplayProps) {
  const certificateRef = useRef<HTMLDivElement>(null)
  const [downloading, setDownloading] = useState(false)

  const dateStr = completionDate.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })

  const handleDownloadPDF = () => {
    setDownloading(true)
    try {
      // Use browser's print functionality
      window.print()
    } catch (error) {
      console.error('Error printing certificate:', error)
    } finally {
      setDownloading(false)
    }
  }


  return (
    <div className="card p-8 mb-8 text-center">
      {/* Congratulations Header */}
      <div className="mb-8">
        <div className="text-6xl mb-4">🎉</div>
        <h2 className="text-3xl font-bold text-primary mb-2">Congratulations!</h2>
        <p className="text-lg text-gray-600">
          You have successfully completed all onboarding milestones!
        </p>
      </div>

      {/* Certificate */}
      <div
        ref={certificateRef}
        className="bg-gradient-to-br from-blue-900 to-blue-700 text-white p-12 rounded-lg mb-8 relative overflow-hidden"
        style={{
          minHeight: '500px',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
          border: '8px solid #f39200',
        }}
      >
        {/* Background pattern */}
        <div className="absolute inset-0 opacity-10">
          <div className="text-8xl font-bold text-center">ADAMS HOMES</div>
        </div>

        {/* Certificate Content */}
        <div className="relative z-10 text-center">
          <h3 className="text-4xl font-bold mb-6 text-orange-400">
            Certificate of Completion
          </h3>

          <p className="text-xl mb-8 font-light">This certifies that</p>

          <h4 className="text-5xl font-bold mb-8 text-orange-300">
            {associateName}
          </h4>

          <p className="text-lg mb-2 font-light">has successfully completed the</p>

          <p className="text-2xl font-bold mb-8 text-orange-300">
            Adams Homes Sales Associate<br />Onboarding Program
          </p>

          <div className="border-t border-orange-300 pt-6">
            <p className="text-sm mb-2">Division: {division}</p>
            <p className="text-sm">Date of Completion: {dateStr}</p>
          </div>
        </div>

        {/* Signature placeholder */}
        <div className="absolute bottom-8 left-12 right-12 flex justify-between text-xs">
          <div className="text-center">
            <div className="border-t border-white w-32 mb-2"></div>
            <p>Bryan Adams</p>
            <p>President</p>
          </div>
          <div className="text-center">
            <div className="border-t border-white w-32 mb-2"></div>
            <p>{dateStr}</p>
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex flex-wrap gap-3 justify-center">
        <button
          onClick={handleDownloadPDF}
          disabled={downloading}
          className="btn-primary flex items-center gap-2"
        >
          🖨️ {downloading ? 'Opening...' : 'Print/Download Certificate'}
        </button>
        <button
          onClick={() => {
            const text = `I just completed the Adams Homes Sales Associate Onboarding Program! 🎉 #AdamsHomes`
            navigator.clipboard.writeText(text)
            alert('Celebration message copied to clipboard!')
          }}
          className="btn-outline flex items-center gap-2"
        >
          📱 Share
        </button>
      </div>

      {/* Encouragement */}
      <div className="mt-8 p-6 bg-green-50 border border-green-200 rounded-lg">
        <p className="text-green-900">
          <strong>Welcome to the Adams Homes family! 🏡</strong><br />
          You're now ready to excel in your new role. If you have any questions, don't hesitate to reach out to your division manager or admin team.
        </p>
      </div>
    </div>
  )
}
