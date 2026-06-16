'use client'

interface ProfileInfoProps {
  name: string
  division: string
  hireDate?: string
  manager?: string
}

export default function ProfileInfo({
  name,
  division,
  hireDate,
  manager,
}: ProfileInfoProps) {
  const formatDate = (dateString?: string) => {
    if (!dateString) return 'Not set'
    const date = new Date(dateString)
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    })
  }

  return (
    <div className="card p-4 mb-6 bg-gradient-to-r from-primary to-blue-700 text-white">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div>
          <p className="text-xs opacity-90 mb-1">Name</p>
          <p className="font-bold text-lg">{name}</p>
        </div>
        <div>
          <p className="text-xs opacity-90 mb-1">📍 Division</p>
          <p className="font-bold">{division}</p>
        </div>
        <div>
          <p className="text-xs opacity-90 mb-1">📅 Start Date</p>
          <p className="font-bold">{formatDate(hireDate)}</p>
        </div>
        <div>
          <p className="text-xs opacity-90 mb-1">👤 Manager</p>
          <p className="font-bold">{manager || 'TBD'}</p>
        </div>
      </div>
    </div>
  )
}
