import { redirect } from 'next/navigation';
import { createServerComponentClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { LandingPage } from '@/components/landing/LandingPage';

export default async function HomePage() {
  const supabase = createServerComponentClient({ cookies });
  
  try {
    const { data: { session } } = await supabase.auth.getSession();
    
    if (session?.user) {
      // Redirect authenticated users based on their role
      const { data: profile } = await supabase
        .from('users')
        .select('role')
        .eq('id', session.user.id)
        .single();
      
      if (profile?.role) {
        redirect(`/${profile.role}`);
      }
    }
  } catch (error) {
    console.error('Error checking session:', error);
  }

  return <LandingPage />;
}