'use client'

interface CredentialsSectionProps {
  emailLogin?: string
  lassoLogin?: string
  fpgTrainingUrl?: string
}

export default function CredentialsSection({
  emailLogin,
  lassoLogin,
  fpgTrainingUrl,
}: CredentialsSectionProps) {
  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
    alert('Copied to clipboard!')
  }

  return (
    <div className="card p-6 mb-6 border-l-4 border-secondary">
      <h2 className="text-xl font-bold text-gray-900 mb-4">🔐 Your Access Credentials</h2>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Email */}
        <div className="bg-gray-50 p-4 rounded-lg">
          <p className="text-xs font-semibold text-gray-600 mb-2">📧 Email Access</p>
          <p className="text-sm font-mono text-gray-900 mb-2">{emailLogin || 'Not configured'}</p>
          {emailLogin && (
            <button
              onClick={() => copyToClipboard(emailLogin)}
              className="text-xs text-primary hover:underline font-semibold"
            >
              📋 Copy Email
            </button>
          )}
        </div>

        {/* Lasso CRM */}
        <div className="bg-gray-50 p-4 rounded-lg">
          <p className="text-xs font-semibold text-gray-600 mb-2">💼 Lasso CRM Login</p>
          <p className="text-sm font-mono text-gray-900 mb-2">{lassoLogin || 'Not configured'}</p>
          {lassoLogin && (
            <button
              onClick={() => copyToClipboard(lassoLogin)}
              className="text-xs text-primary hover:underline font-semibold"
            >
              📋 Copy Username
            </button>
          )}
        </div>

        {/* FPG Training */}
        <div className="bg-gray-50 p-4 rounded-lg">
          <p className="text-xs font-semibold text-gray-600 mb-2">🎓 FPG Training</p>
          {fpgTrainingUrl && fpgTrainingUrl !== 'undefined' ? (
            <a
              href={fpgTrainingUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-primary hover:underline font-semibold inline-block"
            >
              🔗 Access Training
            </a>
          ) : (
            <p className="text-sm text-gray-500 italic">Contact your manager for training access</p>
          )}
        </div>
      </div>

      <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
        <p className="text-xs text-blue-900">
          <strong>💡 Tip:</strong> Save these credentials in a secure location. Contact your division manager if you need to reset any passwords.
        </p>
      </div>
    </div>
  )
}
