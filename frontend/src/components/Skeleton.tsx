import clsx from "clsx";

interface SkeletonProps {
  className?: string;
  lines?: number;
}

export function Skeleton({ className, lines = 1 }: SkeletonProps) {
  return (
    <div className={clsx("animate-pulse space-y-2", className)}>
      {Array.from({ length: lines }).map((_, i) => (
        <div
          key={i}
          className="h-3 bg-ink-100 rounded"
          style={{ width: `${100 - i * 15}%` }}
        />
      ))}
    </div>
  );
}

export function CardSkeleton() {
  return (
    <div className="cx-card p-4 animate-pulse">
      <div className="flex items-center gap-2 mb-3">
        <div className="w-8 h-8 rounded bg-ink-100" />
        <div className="flex-1">
          <div className="h-3 bg-ink-100 rounded w-1/3 mb-1.5" />
          <div className="h-2.5 bg-ink-100 rounded w-2/3" />
        </div>
      </div>
      <div className="space-y-1.5">
        <div className="h-2 bg-ink-100 rounded w-full" />
        <div className="h-2 bg-ink-100 rounded w-4/5" />
      </div>
    </div>
  );
}

export function ListSkeleton({ count = 3 }: { count?: number }) {
  return (
    <div className="space-y-2">
      {Array.from({ length: count }).map((_, i) => (
        <CardSkeleton key={i} />
      ))}
    </div>
  );
}
