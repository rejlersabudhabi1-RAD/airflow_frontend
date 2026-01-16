import React from 'react'

export const EmptyDataState = ({ 
  title = "No Data Available",
  message = "No data found in the system.",
  troubleshootingSteps = [
    "Check if any data has been added to the system",
    "Verify your access permissions", 
    "Contact your administrator if this issue persists"
  ]
}) => (
  <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-6">
    <h2 className="text-yellow-800 dark:text-yellow-200 font-semibold mb-2 text-lg">
      {title}
    </h2>
    <p className="text-yellow-700 dark:text-yellow-300 mb-4">
      {message}
    </p>
    
    <div className="mt-4">
      <h3 className="text-sm font-medium text-yellow-800 dark:text-yellow-200 mb-2">
        Troubleshooting Steps:
      </h3>
      <ul className="text-sm text-yellow-600 dark:text-yellow-400 space-y-1">
        {troubleshootingSteps.map((step, index) => (
          <li key={index}>• {step}</li>
        ))}
      </ul>
    </div>
  </div>
)