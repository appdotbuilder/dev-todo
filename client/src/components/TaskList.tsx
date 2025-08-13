import { TaskItem } from '@/components/TaskItem';
import type { Task } from '../../../server/src/schema';

interface TaskListProps {
  tasks: Task[];
  onToggle: (id: number) => void;
  onUpdate: (id: number, title: string, description?: string | null) => void;
  onDelete: (id: number) => void;
}

export function TaskList({ tasks, onToggle, onUpdate, onDelete }: TaskListProps) {
  return (
    <div className="space-y-2">
      {tasks.map((task: Task) => (
        <TaskItem
          key={task.id}
          task={task}
          onToggle={onToggle}
          onUpdate={onUpdate}
          onDelete={onDelete}
        />
      ))}
    </div>
  );
}