/**
 * 🏠 Index - Redirects to Home
 */

import { useEffect } from 'react';
import { router } from 'expo-router';

export default function Index() {
  useEffect(() => {
    // Redirect to home tab
    router.replace('/(tabs)/home');
  }, []);

  return null;
}
