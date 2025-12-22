import { Badge } from '@/components/ui/badge';
import {
  getHealthStatusColor,
  getHealthStatusIcon,
} from '@/lib/utils/health-calculations';
import type { HealthStatus } from '@/lib/supabase/types';

interface HealthBadgeProps {
  status: HealthStatus;
  size?: 'sm' | 'md' | 'lg';
}

export function HealthBadge({ status, size = 'md' }: HealthBadgeProps) {
  const icon = getHealthStatusIcon(status);
  const colorClass = getHealthStatusColor(status);

  const sizeClasses = {
    sm: 'text-xs px-2 py-0.5',
    md: 'text-sm px-3 py-1',
    lg: 'text-base px-4 py-1.5',
  };

  return (
    <Badge
      variant="outline"
      className={`${colorClass} ${sizeClasses[size]} font-medium`}
    >
      <span className="mr-1">{icon}</span>
      {status}
    </Badge>
  );
}
