import { Button } from '@/components/ui/button';
import type { TaskFilter } from '../../../server/src/schema';

interface TaskFilterProps {
  currentFilter: TaskFilter;
  onFilterChange: (filter: TaskFilter) => void;
}

export function TaskFilter({ currentFilter, onFilterChange }: TaskFilterProps) {
  const filters: { key: TaskFilter; label: string }[] = [
    { key: 'all', label: 'All' },
    { key: 'active', label: 'Active' },
    { key: 'completed', label: 'Completed' }
  ];

  return (
    <div className="flex gap-2">
      {filters.map(({ key, label }) => (
        <Button
          key={key}
          variant={currentFilter === key ? 'secondary' : 'ghost'}
          size="sm"
          onClick={() => onFilterChange(key)}
          className={
            currentFilter === key
              ? 'bg-gray-800 text-white hover:bg-gray-700'
              : 'text-gray-400 hover:text-white hover:bg-gray-800'
          }
        >
          {label}
        </Button>
      ))}
    </div>
  );
}