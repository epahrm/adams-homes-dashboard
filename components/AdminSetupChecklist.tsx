'use client'

export default function AdminSetupChecklist() {
  const setupSteps = [
    {
      category: 'Profile Information',
      items: [
        { id: 1, label: 'Full Name', required: true },
        { id: 2, label: 'Email Address', required: true },
        { id: 3, label: 'Division/City', required: true },
        { id: 4, label: 'Hire/Start Date', required: true },
        { id: 5, label: 'Division Manager Assignment', required: true },
      ],
    },
    {
      category: 'System Access',
      items: [
        { id: 6, label: 'Email Login Credentials', required: true },
        { id: 7, label: 'Lasso CRM Username', required: true },
        { id: 8, label: 'FPG Training URL', required: false },
        { id: 9, label: 'Create Dashboard Account', required: true },
      ],
    },
    {
      category: '543 Training Setup',
      items: [
        { id: 10, label: 'Schedule Training Date', required: true },
        { id: 11, label: 'Add Video Link (when available)', required: false },
        { id: 12, label: 'Confirm Zoom Class Schedule', required: true },
      ],
    },
    {
      category: 'Communication',
      items: [
        { id: 13, label: 'Send Welcome Email', required: true },
        { id: 14, label: 'Confirm Division Manager Notification', required: true },
        { id: 15, label: 'Schedule 1:1 Onboarding Call', required: true },
      ],
    },
  ]

  return (
    <div className="card p-6">
      <h1 className="text-3xl font-bold text-gray-900 mb-2">
        Sales Associate Onboarding Setup Checklist
      </h1>
      <p className="text-gray-600 mb-6">
        Complete all required steps before Sales Associate begins onboarding program
      </p>

      <div className="space-y-6">
        {setupSteps.map((section) => (
          <div key={section.category} className="border rounded-lg p-4">
            <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
              <span className="text-xl">📋</span>
              {section.category}
            </h2>

            <div className="space-y-2">
              {section.items.map((item) => (
                <div
                  key={item.id}
                  className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg"
                >
                  <input
                    type="checkbox"
                    id={`item-${item.id}`}
                    className="w-5 h-5 cursor-pointer"
                  />
                  <label
                    htmlFor={`item-${item.id}`}
                    className="flex-1 cursor-pointer"
                  >
                    <span className="text-gray-900 font-medium">
                      {item.label}
                    </span>
                    {item.required && (
                      <span className="ml-2 text-xs bg-red-100 text-red-700 px-2 py-1 rounded font-semibold">
                        REQUIRED
                      </span>
                    )}
                  </label>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      <div className="mt-6 p-4 bg-green-50 border border-green-200 rounded-lg">
        <p className="text-green-900 font-semibold">
          ✅ Once all required items are complete, Sales Associate can begin dashboard onboarding
        </p>
      </div>
    </div>
  )
}
