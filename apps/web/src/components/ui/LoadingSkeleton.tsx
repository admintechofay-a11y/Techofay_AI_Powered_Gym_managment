import React from 'react';
import { clsx } from 'clsx';

export const Skeleton: React.FC<React.HTMLAttributes<HTMLDivElement>> = ({ className, ...props }) => {
  return (
    <div
      className={clsx('animate-pulse rounded-md bg-muted/80', className)}
      {...props}
    />
  );
};

export const CardSkeleton: React.FC = () => {
  return (
    <div className="rounded-xl border border-border bg-card p-6 space-y-4">
      <Skeleton className="h-4 w-1/3" />
      <Skeleton className="h-8 w-1/2" />
      <Skeleton className="h-3 w-3/4" />
    </div>
  );
};

export const TableSkeleton: React.FC<{ rows?: number }> = ({ rows = 5 }) => {
  return (
    <div className="w-full space-y-3">
      <div className="flex justify-between items-center py-2">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-8 w-24" />
      </div>
      <div className="rounded-xl border border-border bg-card overflow-hidden">
        <div className="h-10 bg-muted/50 border-b border-border flex items-center px-4 gap-4">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-4 w-28" />
          <Skeleton className="h-4 w-20" />
        </div>
        {Array.from({ length: rows }).map((_, i) => (
          <div key={i} className="h-14 border-b border-border/50 flex items-center px-4 gap-4">
            <Skeleton className="h-4 w-20" />
            <Skeleton className="h-4 w-36" />
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-6 w-16 rounded-full" />
          </div>
        ))}
      </div>
    </div>
  );
};
export const LoadingSkeleton: React.FC<{ rows?: number; count?: number; className?: string }> = ({
  rows = 4,
  count,
  className,
}) => {
  const n = count || rows;
  return (
    <div className={clsx('w-full space-y-4 py-4', className)}>
      {Array.from({ length: n }).map((_, i) => (
        <Skeleton key={i} className="h-16 w-full rounded-xl" />
      ))}
    </div>
  );
};

