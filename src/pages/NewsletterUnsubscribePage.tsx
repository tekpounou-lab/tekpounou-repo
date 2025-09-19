// Newsletter Unsubscribe Page
// File: src/pages/NewsletterUnsubscribePage.tsx

import React, { useState } from "react"
import { useSearchParams } from "react-router-dom"
import { Button } from "@/components/ui/Button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card"
import { AlertCircle, CheckCircle2 } from "lucide-react"

export default function NewsletterUnsubscribePage() {
  const [searchParams] = useSearchParams()
  const email = searchParams.get("email")

  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleUnsubscribe = async () => {
    if (!email) {
      setError("Nou pa jwenn imel ou nan demann lan.")
      return
    }

    setLoading(true)
    setError(null)
    try {
      const response = await fetch("/api/newsletter/unsubscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      })

      if (response.ok) {
        setSuccess(true)
      } else {
        const data = await response.json()
        setError(data.error || "Yon erè rive pandan dezabònman an.")
      }
    } catch (err) {
      setError("Pa gen koneksyon. Eseye ankò.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center px-6">
      <Card className="max-w-md w-full">
        <CardHeader>
          <CardTitle className="text-center text-xl">
            Dezabònman nan Newsletter
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6 text-center">
          {!success && !error && (
            <>
              <p className="text-gray-600 dark:text-gray-300">
                {email
                  ? `Ou anrejistre ak imel: ${email}.`
                  : "Nou pa jwenn imel ou."}
              </p>
              <p className="text-gray-500 dark:text-gray-400 text-sm">
                Si ou kontinye, ou pap resevwa okenn lòt imel nan men nou.
              </p>
              <Button
                onClick={handleUnsubscribe}
                disabled={loading || !email}
                className="w-full"
              >
                {loading ? "Nap trete..." : "Wi, dezabòne mwen"}
              </Button>
            </>
          )}

          {success && (
            <div className="flex flex-col items-center space-y-3">
              <CheckCircle2 className="h-12 w-12 text-green-500" />
              <p className="text-green-600 dark:text-green-400 font-medium">
                Ou dezabòne avèk siksè.
              </p>
              <p className="text-gray-500 dark:text-gray-400 text-sm">
                Ou pap resevwa okenn lòt imel ankò.
              </p>
            </div>
          )}

          {error && (
            <div className="flex flex-col items-center space-y-3">
              <AlertCircle className="h-12 w-12 text-red-500" />
              <p className="text-red-600 dark:text-red-400 font-medium">
                {error}
              </p>
              <Button
                onClick={handleUnsubscribe}
                disabled={loading}
                className="w-full"
              >
                Eseye ankò
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
