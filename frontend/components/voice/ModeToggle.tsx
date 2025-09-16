'use client';

import { Mic, BarChart3 } from 'lucide-react';
import { Button } from '../ui/Button';

interface ModeToggleProps {
  currentMode: 'dashboard' | 'voice';
  onModeChange: (mode: 'dashboard' | 'voice') => void;
  className?: string;
}

export const ModeToggle: React.FC<ModeToggleProps> = ({
  currentMode,
  onModeChange,
  className = ''
}) => {
  return (
    <div className={`flex bg-white rounded-lg shadow-sm border p-1 ${className}`}>
      <Button
        variant={currentMode === 'dashboard' ? 'primary' : 'secondary'}
        size="sm"
        onClick={() => onModeChange('dashboard')}
        className="flex items-center gap-2 px-4 py-2"
      >
        <BarChart3 size={16} />
        Use Dashboard
      </Button>
      
      <Button
        variant={currentMode === 'voice' ? 'primary' : 'secondary'}
        size="sm"
        onClick={() => onModeChange('voice')}
        className="flex items-center gap-2 px-4 py-2"
      >
        <Mic size={16} />
        Talk to Voice Coach
      </Button>
    </div>
  );
};