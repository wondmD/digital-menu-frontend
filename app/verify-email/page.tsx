"use client"

import { Suspense } from "react"
import Link from "next/link"
import { useSearchParams } from "next/navigation"
import { MailCheck, ArrowLeft, LogIn } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"

function VerifyEmailContent() {
  const searchParams = useSearchParams()
  const email = searchParams.get("email")
  const status = searchParams.get("status")

  const isSuccess = status === "success"

  return (
    <div className="min-h-screen flex items-center justify-center bg-secondary/30 p-4 font-sans">
      <Card className="w-full max-w-lg bg-white/80 backdrop-blur-md border-primary/10 shadow-xl overflow-hidden">
        {isSuccess && <div className="h-2 w-full bg-green-500" />}
        <CardHeader className="text-center space-y-3 pt-10">
          <div className={`mx-auto flex h-16 w-16 items-center justify-center rounded-full border-2 shadow-sm ${
            isSuccess ? "bg-green-50 text-green-600 border-green-200" : "bg-primary/10 text-primary border-primary/20"
          }`}>
            {isSuccess ? <MailCheck className="h-8 w-8" /> : <MailCheck className="h-7 w-7" />}
          </div>
          <CardTitle className="text-2xl font-serif text-foreground">
            {isSuccess ? "Email Verified!" : "Verify your email"}
          </CardTitle>
          <CardDescription className="text-base text-muted-foreground">
            {isSuccess ? (
              <span>Your email has been successfully verified. You can now access your dashboard.</span>
            ) : email ? (
              <span>
                We sent a verification link to <strong>{email}</strong>. Click it to activate your account, then return to log in.
              </span>
            ) : (
              <span>We sent you a verification link. Open your inbox, click the link, and then sign in.</span>
            )}
          </CardDescription>
        </CardHeader>
        {!isSuccess && (
          <CardContent className="space-y-2 text-sm text-muted-foreground">
            <p>Didn&apos;t get the email?</p>
            <ul className="list-disc list-inside space-y-1">
              <li>Check your spam or promotions folder.</li>
              <li>Make sure you entered the correct address.</li>
              <li>Wait a minute—some providers delay delivery.</li>
            </ul>
          </CardContent>
        )}
        <CardFooter className="flex flex-col gap-3 sm:flex-row sm:justify-between pb-8">
          {!isSuccess && (
            <Button variant="ghost" asChild className="w-full sm:w-auto">
              <Link href="/register" className="flex items-center gap-2">
                <ArrowLeft className="h-4 w-4" />
                Go back
              </Link>
            </Button>
          )}
          <Button asChild className={`w-full ${!isSuccess ? "sm:w-auto" : ""}`}>
            <Link href="/login" className="flex items-center justify-center gap-2">
              <LogIn className="h-4 w-4" />
              {isSuccess ? "Go to Login" : "Continue to login"}
            </Link>
          </Button>
        </CardFooter>
      </Card>
    </div>
  )
}

export default function VerifyEmailPage() {
  return (
    <Suspense>
      <VerifyEmailContent />
    </Suspense>
  )
}
