'use client'

import { useEffect } from 'react'
import { useAuth, useClerk } from '@clerk/nextjs'

/**
 * Ensures mutual exclusion between admin and Clerk user authentication
 * If admin is logged in and user signs in via Clerk, admin is logged out
 * If user is logged in and admin logs in, user is logged out
 */
export function AuthMutex() {
  const { isSignedIn } = useAuth()
  const { signOut } = useClerk()

  useEffect(() => {
    // If Clerk user is signed in, check if admin is also logged in
    if (isSignedIn) {
      const adminAuth = localStorage.getItem('adminAuth')
      if (adminAuth === 'authenticated') {
        // Admin is logged in, log them out
        localStorage.removeItem('adminAuth')
        console.log('[AuthMutex] Logged out admin because Clerk user signed in')
      }
    }
  }, [isSignedIn])

  return null
}
