import { useState } from 'react'
import { Button } from './button'
import { Textarea } from './textarea'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './Card'
import { AlertTriangle, Send, ThumbsDown, ThumbsUp, MessageSquare } from 'lucide-react'
import { reportError, addBreadcrumb } from '../../lib/sentry'

interface ErrorFeedbackProps {
  error?: Error
  errorId?: string
  onFeedbackSubmitted?: (feedback: ErrorFeedback) => void
}

interface ErrorFeedback {
  errorId: string
  helpful: boolean | null
  feedback: string
  userAgent: string
  timestamp: number
  url: string
}

export function ErrorFeedback({ error, errorId, onFeedbackSubmitted }: ErrorFeedbackProps) {
  const [feedback, setFeedback] = useState('')
  const [helpful, setHelpful] = useState<boolean | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isSubmitted, setIsSubmitted] = useState(false)

  const handleSubmitFeedback = async () => {
    if (isSubmitting || isSubmitted) return

    setIsSubmitting(true)

    const feedbackData: ErrorFeedback = {
      errorId: errorId || error?.message || 'unknown',
      helpful,
      feedback,
      userAgent: navigator.userAgent,
      timestamp: Date.now(),
      url: window.location.href
    }

    try {
      // Add breadcrumb for feedback submission
      addBreadcrumb('User submitted error feedback', 'user', 'info')

      // Report feedback as a custom event to Sentry
      reportError(new Error('User Error Feedback'), {
        type: 'user_feedback',
        feedback: feedbackData,
        originalError: error?.message,
        errorStack: error?.stack
      })

      // Call callback if provided
      if (onFeedbackSubmitted) {
        onFeedbackSubmitted(feedbackData)
      }

      setIsSubmitted(true)
    } catch (err) {
      console.error('Failed to submit feedback:', err)
      reportError(err instanceof Error ? err : new Error('Failed to submit feedback'), {
        type: 'feedback_submission_error',
        originalFeedback: feedbackData
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  if (isSubmitted) {
    return (
      <Card className="border-green-200 bg-green-50/50 dark:bg-green-950/20 dark:border-green-800/30">
        <CardContent className="pt-6">
          <div className="flex items-center gap-3">
            <ThumbsUp className="w-5 h-5 text-green-600" />
            <div>
              <p className="font-medium text-green-900 dark:text-green-100">
                Tak for din feedback!
              </p>
              <p className="text-sm text-green-700 dark:text-green-200">
                Din feedback hjælper os med at forbedre applikationen.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="border-orange-200 bg-orange-50/50 dark:bg-orange-950/20 dark:border-orange-800/30">
      <CardHeader className="pb-4">
        <div className="flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-orange-600 mt-0.5" />
          <div>
            <CardTitle className="text-orange-900 dark:text-orange-100">
              Hjælp os med at forbedre
            </CardTitle>
            <CardDescription className="text-orange-700 dark:text-orange-200">
              Var denne fejlbesked hjælpsom? Din feedback hjælper os med at gøre det bedre.
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Helpful rating */}
        <div className="space-y-2">
          <p className="text-sm font-medium text-orange-900 dark:text-orange-100">
            Var fejlbeskeden hjælpsom?
          </p>
          <div className="flex gap-2">
            <Button
              variant={helpful === true ? "default" : "outline"}
              size="sm"
              onClick={() => setHelpful(true)}
              className="flex items-center gap-2"
            >
              <ThumbsUp className="w-4 h-4" />
              Ja
            </Button>
            <Button
              variant={helpful === false ? "default" : "outline"}
              size="sm"
              onClick={() => setHelpful(false)}
              className="flex items-center gap-2"
            >
              <ThumbsDown className="w-4 h-4" />
              Nej
            </Button>
          </div>
        </div>

        {/* Feedback text */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-orange-900 dark:text-orange-100">
            Yderligere kommentarer (valgfrit)
          </label>
          <Textarea
            placeholder="Beskriv hvad der skete, eller hvordan vi kan forbedre fejlhåndteringen..."
            value={feedback}
            onChange={(e) => setFeedback(e.target.value)}
            className="min-h-[80px] resize-none"
          />
        </div>

        {/* Submit button */}
        <Button
          onClick={handleSubmitFeedback}
          disabled={isSubmitting || helpful === null}
          className="w-full flex items-center gap-2"
        >
          {isSubmitting ? (
            <>
              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              Sender...
            </>
          ) : (
            <>
              <Send className="w-4 h-4" />
              Send feedback
            </>
          )}
        </Button>

        {/* Privacy note */}
        <p className="text-xs text-orange-600 dark:text-orange-300">
          Din feedback sendes anonymt og hjælper os med at forbedre applikationen.
        </p>
      </CardContent>
    </Card>
  )
}