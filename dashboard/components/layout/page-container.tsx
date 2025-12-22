import { ReactNode } from 'react';

interface PageContainerProps {
  children: ReactNode;
  title?: string;
  description?: string;
}

export function PageContainer({
  children,
  title,
  description,
}: PageContainerProps) {
  return (
    <div className="container mx-auto px-6 py-8">
      {(title || description) && (
        <div className="mb-8">
          {title && <h2 className="text-3xl font-bold text-gray-900">{title}</h2>}
          {description && (
            <p className="mt-2 text-gray-600">{description}</p>
          )}
        </div>
      )}
      {children}
    </div>
  );
}
