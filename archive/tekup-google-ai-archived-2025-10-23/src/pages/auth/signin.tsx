import React from 'react'
import { GetServerSideProps } from 'next'
import Head from 'next/head'
import { SignInForm } from '@/components/auth/SignInForm'
import { getServerUser } from '@/middleware/supabaseAuth'

// ============================================================================
// Sign In Page
// Replaces Clerk's sign-in page
// ============================================================================

const SignInPage: React.FC = () => {
  return (
    <>
      <Head>
        <title>Log ind - RenOS</title>
        <meta name="description" content="Log ind på din RenOS konto" />
      </Head>

      <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full space-y-8">
          {/* Logo/Brand */}
          <div className="text-center">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">RenOS</h1>
            <p className="text-gray-600">Rengørings Management System</p>
          </div>

          {/* Sign In Form */}
          <SignInForm />
        </div>
      </div>
    </>
  )
}

// ============================================================================
// Server-side authentication check
// Redirect to dashboard if already logged in
// ============================================================================

export const getServerSideProps: GetServerSideProps = async (context) => {
  try {
    const user = await getServerUser(context.req, context.res)
    
    if (user) {
      return {
        redirect: {
          destination: '/dashboard',
          permanent: false,
        },
      }
    }
  } catch (error) {
    // User not authenticated, continue to sign-in page
    console.log('User not authenticated, showing sign-in page')
  }

  return {
    props: {},
  }
}

export default SignInPage