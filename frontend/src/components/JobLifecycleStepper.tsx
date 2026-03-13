import { CheckCircle } from 'lucide-react'

interface Step {
  label: string
  status: 'complete' | 'active' | 'pending'
}

interface JobLifecycleStepperProps {
  steps: Step[]
}

export default function JobLifecycleStepper({ steps }: JobLifecycleStepperProps) {
  if (steps.length === 0) return null

  const getStepClass = (status: Step['status']): string => {
    switch (status) {
      case 'complete':
        return 'bg-green-500 text-white'
      case 'active':
        return 'bg-blue-600 text-white animate-pulse'
      case 'pending':
        return 'bg-gray-200 text-gray-400'
    }
  }

  return (
    <div className="flex flex-col sm:flex-row items-center justify-between gap-2 w-full">
      {steps.map((step, index) => (
        <div key={index} className="flex items-center flex-1 w-full">
          <div className="flex flex-col items-center flex-shrink-0">
            <div
              className={`w-8 h-8 rounded-full flex items-center justify-center ${getStepClass(step.status)}`}
            >
              {step.status === 'complete' ? (
                <CheckCircle size={16} />
              ) : (
                <span className="w-2 h-2 rounded-full bg-current" />
              )}
            </div>
            <span className="text-xs font-bold text-center mt-1 max-w-16">{step.label}</span>
          </div>
          {index < steps.length - 1 && (
            <div className="border-t-2 border-gray-200 flex-1 hidden sm:block mx-2" />
          )}
        </div>
      ))}
    </div>
  )
}
