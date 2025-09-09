'use client';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { getCookie } from '@/app/functions/functions';

export default function Start() {
  const router = useRouter();

  const categoryLink = getCookie('category_link');

  // If user has visited a sportspage before, redirect to that sport
  if (categoryLink) {
    useEffect(() => {
      router.push('/train/' + categoryLink);
    }, []);
  } else {
    // If not, redirect to train page as the startpage
    useEffect(() => {
      router.push('/train');
    }, []);
  }

  return null;
}
