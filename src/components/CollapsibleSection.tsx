
import React, { useState, ReactNode } from 'react';
import { ChevronDownIcon } from '@heroicons/react/24/solid';

interface CollapsibleSectionProps {
  title: string;
  children: ReactNode;
}

const CollapsibleSection: React.FC<CollapsibleSectionProps> = ({ title, children }) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="bg-primary-dark rounded-lg mb-4">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex justify-between items-center p-4 text-left"
      >
        <h3 className="text-lg font-bold text-white">{title}</h3>
        <ChevronDownIcon
          className={`w-6 h-6 text-white transform transition-transform ${
            isOpen ? 'rotate-180' : ''
          }`}
        />
      </button>
      {isOpen && <div className="p-4 pt-0">{children}</div>}
    </div>
  );
};

export default CollapsibleSection;
