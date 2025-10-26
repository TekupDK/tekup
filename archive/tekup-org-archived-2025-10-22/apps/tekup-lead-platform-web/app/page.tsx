import { redirect } from 'next/navigation'

export default function HomePage() {
  // Redirect to tenant selection or default dashboard
  redirect('/dashboard')
}
