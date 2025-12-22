import {
  getTrendIcon,
  getTrendText,
  getTrendColor,
} from '@/lib/utils/health-calculations';
import type { TrendStatus } from '@/lib/supabase/types';

interface TrendIndicatorProps {
  trend: TrendStatus;
  showText?: boolean;
}

export function TrendIndicator({
  trend,
  showText = true,
}: TrendIndicatorProps) {
  const icon = getTrendIcon(trend);
  const text = getTrendText(trend);
  const colorClass = getTrendColor(trend);

  return (
    <div className={`inline-flex items-center gap-1 ${colorClass} font-medium`}>
      <span className="text-lg">{icon}</span>
      {showText && <span className="text-sm">{text}</span>}
    </div>
  );
}
