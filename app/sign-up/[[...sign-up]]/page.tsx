'use client'

import { SignUp } from '@clerk/nextjs'

export default function SignUpPage() {
  return (
    <div className="flex items-center justify-center min-h-[calc(100vh-8rem)]">
      <div className="w-full max-w-md rounded-lg border p-8 bg-card shadow mx-4">
        <SignUp
          appearance={{
            elements: {
              formButtonPrimary: 'bg-primary hover:bg-primary/90',
              footerActionLink: 'text-primary hover:text-primary/90',
            },
          }}
        />
      </div>
    </div>
  )
} 