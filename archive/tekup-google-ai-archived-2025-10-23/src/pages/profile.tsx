import React from 'react'
import { GetServerSideProps } from 'next'
import Head from 'next/head'
import { UserProfile } from '@/components/auth/UserProfile'
import { requireAuth } from '@/middleware/supabaseAuth'

// ============================================================================
// Profile Page
// Replaces Clerk's user profile page
// ============================================================================

const ProfilePage: React.FC = () => {
  return (
    <>
      <Head>
        <title>Min Profil - RenOS</title>
        <meta name="description" content="Administrer din RenOS profil og indstillinger" />
      </Head>

      <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto">
          {/* Page Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900">Min Profil</h1>
            <p className="mt-2 text-gray-600">
              Administrer dine konto oplysninger og indstillinger
            </p>
          </div>

          {/* User Profile Component */}
          <UserProfile />
        </div>
      </div>
    </>
  )
}

// ============================================================================
// Server-side authentication check
// Require authentication to access this page
// ============================================================================

export const getServerSideProps: GetServerSideProps = async (context) => {
  return requireAuth(context, async () => {
    return {
      props: {},
    }
  })
}

export default ProfilePage