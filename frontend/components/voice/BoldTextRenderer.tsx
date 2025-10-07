import React from 'react';

interface BoldTextRendererProps {
  text: string;
  className?: string;
}

export const BoldTextRenderer: React.FC<BoldTextRendererProps> = ({ text, className = '' }) => {
  // Function to render text with bold formatting
  const renderWithBold = (text: string) => {
    const parts = text.split(/(\*\*.*?\*\*)/g);
    return parts.map((part, index) => {
      if (part.startsWith('**') && part.endsWith('**') && part.length > 4) {
        const boldText = part.slice(2, -2);
        return (
          <strong key={index} className="font-bold">
            {boldText}
          </strong>
        );
      }
      return <span key={index}>{part}</span>;
    });
  };

  // Split text by line breaks
  const lines = text.split('\n');
  
  return (
    <div className={className}>
      {lines.map((line, lineIndex) => {
        const trimmedLine = line.trim();
        
        // Check for numbered list (1. 2. 3. etc.)
        const numberedMatch = trimmedLine.match(/^(\d+)\.\s+(.+)$/);
        if (numberedMatch) {
          return (
            <div key={lineIndex} className="flex gap-2 mb-1.5">
              <span className="font-semibold text-blue-600 min-w-[1.5rem]">{numberedMatch[1]}.</span>
              <span className="flex-1">{renderWithBold(numberedMatch[2])}</span>
            </div>
          );
        }
        
        // Check for bullet points (-, •, *, or just starts with -)
        const bulletMatch = trimmedLine.match(/^[-•*]\s+(.+)$/);
        if (bulletMatch) {
          return (
            <div key={lineIndex} className="flex gap-2 mb-1.5">
              <span className="text-blue-600 min-w-[1rem]">•</span>
              <span className="flex-1">{renderWithBold(bulletMatch[1])}</span>
            </div>
          );
        }
        
        // Regular line with line break
        if (trimmedLine) {
          return (
            <div key={lineIndex} className="mb-1.5">
              {renderWithBold(line)}
            </div>
          );
        }
        
        // Empty line (spacing)
        return <div key={lineIndex} className="h-2"></div>;
      })}
    </div>
  );
};
