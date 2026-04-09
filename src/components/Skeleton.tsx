import React from 'react';

interface SkeletonProps {
  className?: string;
}

/** Generic skeleton loading placeholder with shimmer animation */
export const Skeleton: React.FC<SkeletonProps> = ({ className = '' }) => (
  <div className={`skeleton ${className}`} aria-hidden="true" />
);

/** Skeleton for a PhraseCard-shaped loading state */
export const PhraseCardSkeleton: React.FC = () => (
  <div className="bg-white/10 rounded-[2rem] border border-white/10 p-8 w-full" aria-hidden="true">
    <div className="flex flex-col items-center">
      <Skeleton className="w-24 h-6 rounded-full mb-6" />
      <Skeleton className="w-3/4 h-8 mb-4" />
      <Skeleton className="w-1/2 h-6 mb-10" />
      <div className="flex gap-4">
        <Skeleton className="w-14 h-14 rounded-2xl" />
        <Skeleton className="w-14 h-14 rounded-2xl" />
        <Skeleton className="w-40 h-14 rounded-2xl" />
      </div>
    </div>
  </div>
);

/** Skeleton for a DashboardModule card */
export const ModuleCardSkeleton: React.FC = () => (
  <div className="bg-white/5 rounded-[2rem] border border-white/10 p-8" aria-hidden="true">
    <div className="flex flex-col">
      <Skeleton className="w-14 h-14 rounded-2xl mb-6" />
      <Skeleton className="w-2/3 h-6 mb-3" />
      <Skeleton className="w-full h-4 mb-6" />
      <Skeleton className="w-1/3 h-4" />
    </div>
  </div>
);

/** Full page skeleton for initial load states */
export const PageSkeleton: React.FC = () => (
  <div className="max-w-4xl mx-auto p-4 space-y-8 animate-fade-in" role="status" aria-live="polite" aria-label="Cargando contenido">
    <Skeleton className="w-48 h-8 mb-4" />
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
      <ModuleCardSkeleton />
      <ModuleCardSkeleton />
      <ModuleCardSkeleton />
      <ModuleCardSkeleton />
    </div>
  </div>
);

/** Skeleton for a stats card */
export const StatCardSkeleton: React.FC = () => (
  <div className="bg-white/5 p-8 rounded-[2rem] border border-white/10 flex flex-col items-center text-center" aria-hidden="true">
    <Skeleton className="w-16 h-16 rounded-2xl mb-6" />
    <Skeleton className="w-20 h-4 mb-2" />
    <Skeleton className="w-12 h-8" />
  </div>
);
