'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { formStorage } from '../lib/utils';
import { Step1Component } from '../components/steps/Step1';

export default function Home() {
  const router = useRouter();

  useEffect(() => {
    // Check if user has already started the process
    const currentStep = formStorage.getCurrentStep();
    const userId = formStorage.getUserId();
    
    if (userId && currentStep > 1) {
      // Redirect to the appropriate step
      if (currentStep === 5) {
        router.push('/dashboard');
      } else {
        router.push(`/step-${currentStep}`);
      }
    }
  }, [router]);

  return (
    <div className="min-h-screen bg-gray-50">
      <Step1Component />
    </div>
  );
}
