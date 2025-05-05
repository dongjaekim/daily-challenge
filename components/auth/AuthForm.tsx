'use client'

import { SignIn, SignUp } from '@clerk/nextjs'
import { usePathname } from 'next/navigation'

export function AuthForm() {
  const pathname = usePathname()

  return (
    <div className="w-full max-w-md rounded-lg border p-8 bg-card shadow">
      {pathname === '/sign-in' ? (
        <SignIn
          appearance={{
            elements: {
              formButtonPrimary: 'bg-primary hover:bg-primary/90',
              footerActionLink: 'text-primary hover:text-primary/90',
            },
          }}
        />
      ) : (
        <SignUp
          appearance={{
            elements: {
              formButtonPrimary: 'bg-primary hover:bg-primary/90',
              footerActionLink: 'text-primary hover:text-primary/90',
            },
          }}
        />
      )}
    </div>
  )
} 