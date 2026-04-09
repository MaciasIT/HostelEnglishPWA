import React from 'react';

interface PageContainerProps {
  children: React.ReactNode;
  title?: string;
}

const PageContainer: React.FC<PageContainerProps> = ({ children, title }) => {
  return (
    <div className="p-4 sm:p-6 lg:p-8 pb-10 sm:pb-12 bg-primary-dark text-white min-h-screen w-full max-w-full overflow-x-hidden flex flex-col relative">
      {title && (
        <h1 className="text-xl sm:text-2xl font-bold mb-6 text-white tracking-tight">{title}</h1>
      )}
      <div className="flex-grow flex flex-col w-full">
        {children}
      </div>
    </div>
  );
};

export default PageContainer;
