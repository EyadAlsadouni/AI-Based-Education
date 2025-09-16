'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { formStorage } from '../lib/utils';
import { Step1Component } from '../components/steps/Step1';
import { Button } from '../components/ui/Button';

export default function Home() {
  const router = useRouter();
  const [showDebugOptions, setShowDebugOptions] = useState(false);

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

  const handleClearSession = () => {
    formStorage.clearAll();
    setShowDebugOptions(false);
    window.location.reload();
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Debug panel - only show in development */}
      {process.env.NODE_ENV === 'development' && (
        <div className="fixed top-4 right-4 z-50">
          <Button
            onClick={() => setShowDebugOptions(!showDebugOptions)}
            variant="outline"
            size="sm"
            className="bg-white shadow-lg"
          >
            🔧 Debug
          </Button>
          {showDebugOptions && (
            <div className="mt-2 bg-white border rounded-lg shadow-lg p-3 min-w-[200px]">
              <p className="text-xs text-gray-600 mb-2">Development Tools</p>
              <Button
                onClick={handleClearSession}
                variant="outline"
                size="sm"
                className="w-full text-xs"
              >
                Clear Session & Restart
              </Button>
              <div className="mt-2 text-xs text-gray-500">
                Current Step: {formStorage.getCurrentStep()}<br/>
                User ID: {formStorage.getUserId() || 'None'}
              </div>
            </div>
          )}
        </div>
      )}
      
      <Step1Component />
    </div>
  );
}
