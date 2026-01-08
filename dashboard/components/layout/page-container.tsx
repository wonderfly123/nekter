import { ReactNode } from 'react';
import { cn } from '@/lib/utils';

interface PageContainerProps {
  children: ReactNode;
  title?: string;
  description?: string;
  className?: string;
}

export function PageContainer({
  children,
  title,
  description,
  className,
}: PageContainerProps) {
  return (
    <div className={cn('container mx-auto px-6 py-8', className)}>
      {(title || description) && (
        <div className="mb-8">
          {title && <h2 className="text-3xl font-bold text-gray-900 dark:text-white">{title}</h2>}
          {description && (
            <p className="mt-2 text-gray-600 dark:text-gray-400">{description}</p>
          )}
        </div>
      )}
      {children}
    </div>
  );
}
