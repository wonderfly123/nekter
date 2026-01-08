'use client';

interface TimeRangeFilterProps {
  value: string;
  onChange: (value: string) => void;
}

export function TimeRangeFilter({ value, onChange }: TimeRangeFilterProps) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="
        px-4 py-2.5 pr-10 border border-gray-200 dark:border-gray-700 rounded-lg
        bg-white dark:bg-gray-800 text-sm font-medium text-gray-900 dark:text-white
        cursor-pointer appearance-none
        transition-all duration-200
        hover:border-amber-500
        focus:outline-none focus:border-amber-500 focus:ring-4 focus:ring-amber-500/10
        min-w-[140px]
      "
      style={{
        backgroundImage: `url("data:image/svg+xml,%3Csvg width='12' height='8' viewBox='0 0 12 8' fill='none' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M1 1.5L6 6.5L11 1.5' stroke='%2394a3b8' stroke-width='1.5' stroke-linecap='round' stroke-linejoin='round'/%3E%3C/svg%3E")`,
        backgroundRepeat: 'no-repeat',
        backgroundPosition: 'right 1rem center',
      }}
    >
      <option value="7d">7D</option>
      <option value="30d">30D</option>
      <option value="60d">60D</option>
      <option value="90d">90D</option>
      <option value="120d">120D</option>
      <option value="180d">180D</option>
    </select>
  );
}
