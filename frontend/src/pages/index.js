import { useEffect } from 'react';
import { useRouter } from 'next/router';
import useAuthStore from '../hooks/useAuthStore';

export default function Home() {
  const router = useRouter();
  const { isAuthenticated } = useAuthStore();
  useEffect(() => { router.push(isAuthenticated ? '/dashboard' : '/login'); }, [isAuthenticated]);
  return null;
}
