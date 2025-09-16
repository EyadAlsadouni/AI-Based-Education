'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { formStorage } from '../../lib/utils';
import { VoiceCoachInterface } from '../../components/voice/VoiceCoachInterface';

export default function VoiceCoachPage() {
  const router = useRouter();
  const [userId, setUserId] = useState<number | null>(null);

  useEffect(() => {
    // Check if user has completed onboarding
    const currentStep = formStorage.getCurrentStep();
    const storedUserId = formStorage.getUserId();
    
    if (!storedUserId || currentStep < 5) {
      // Redirect to appropriate step if not completed
      if (storedUserId && currentStep > 1) {
        router.push(`/step-${currentStep}`);
      } else {
        router.push('/');
      }
      return;
    }
    
    setUserId(storedUserId);
  }, [router]);

  if (!userId) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading Voice Coach...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <VoiceCoachInterface userId={userId} />
    </div>
  );
}