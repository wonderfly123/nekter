'use client';

interface CsmFilterProps {
  selectedCsm: string | null;
  onCsmChange: (csm: string | null) => void;
  csmList: string[];
}

export function CsmFilter({ selectedCsm, onCsmChange, csmList }: CsmFilterProps) {
  return (
    <div className="flex items-center gap-3 mb-6">
      <label htmlFor="csm-filter" className="text-sm font-medium text-gray-700">
        Filter by CSM:
      </label>
      <select
        id="csm-filter"
        value={selectedCsm || ''}
        onChange={(e) => onCsmChange(e.target.value || null)}
        className="block w-64 rounded-lg border-gray-300 border py-2 px-3 text-sm focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500"
      >
        <option value="">All CSMs</option>
        {csmList.map((csm) => (
          <option key={csm} value={csm}>
            {csm}
          </option>
        ))}
      </select>
    </div>
  );
}
