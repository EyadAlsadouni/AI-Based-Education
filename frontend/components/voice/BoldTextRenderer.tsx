import React from 'react';

interface BoldTextRendererProps {
  text: string;
  className?: string;
}

export const BoldTextRenderer: React.FC<BoldTextRendererProps> = ({ text, className = '' }) => {
  // Split text by **bold** patterns while preserving the delimiters
  const parts = text.split(/(\*\*.*?\*\*)/g);
  
  return (
    <span className={className}>
      {parts.map((part, index) => {
        // Check if this part is wrapped in **
        if (part.startsWith('**') && part.endsWith('**') && part.length > 4) {
          // Remove the ** markers and render as bold
          const boldText = part.slice(2, -2);
          return (
            <strong key={index} className="font-bold">
              {boldText}
            </strong>
          );
        }
        // Regular text
        return part;
      })}
    </span>
  );
};
