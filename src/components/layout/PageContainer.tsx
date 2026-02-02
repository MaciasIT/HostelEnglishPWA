import React from 'react';

interface PageContainerProps {
  children: React.ReactNode;
  title?: string;
}

const PageContainer: React.FC<PageContainerProps> = ({ children, title }) => {
  return (
    <div
      className="p-2 sm:p-4 pb-10 sm:pb-12 bg-primary-dark text-white min-h-screen w-full max-w-full overflow-x-hidden flex flex-col relative"
      style={{
        backgroundColor: '#1a252f', // Fallback color
        backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='24' height='24' viewBox='0 0 24 24'%3E%3Cg fill='%239C92AC' fill-opacity='0.1'%3E%3Cpolygon fill-rule='evenodd' points='8 4 12 6 8 8 6 12 4 8 0 6 4 4 6 0 8 4'/%3E%3C/g%3E%3C/svg%3E")`,
        backgroundAttachment: 'fixed'
      }}
    >
      {title && <h1 className="text-xl sm:text-2xl font-bold mb-4 text-white">{title}</h1>}
      <div className="flex-grow flex flex-col w-full">
        {children}
      </div>
    </div>
  );
};

export default PageContainer;
