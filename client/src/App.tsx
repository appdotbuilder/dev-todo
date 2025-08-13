import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { trpc } from '@/utils/trpc';
import { useState, useEffect, useCallback } from 'react';
import { TaskList } from '@/components/TaskList';
import { TaskForm } from '@/components/TaskForm';
import { TaskFilter } from '@/components/TaskFilter';
import type { Task, CreateTaskInput, TaskFilter as TaskFilterType } from '../../server/src/schema';

function App() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [filter, setFilter] = useState<TaskFilterType>('all');
  const [isLoading, setIsLoading] = useState(false);

  const loadTasks = useCallback(async () => {
    try {
      const result = await trpc.getTasks.query({ filter });
      setTasks(result);
    } catch (error) {
      console.error('Failed to load tasks:', error);
    }
  }, [filter]);

  useEffect(() => {
    loadTasks();
  }, [loadTasks]);

  const handleCreateTask = async (input: CreateTaskInput) => {
    setIsLoading(true);
    try {
      const newTask = await trpc.createTask.mutate(input);
      setTasks((prev: Task[]) => [newTask, ...prev]);
    } catch (error) {
      console.error('Failed to create task:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleToggleTask = async (id: number) => {
    try {
      const task = tasks.find(t => t.id === id);
      if (!task) return;
      
      const updatedTask = await trpc.toggleTaskCompletion.mutate({ id });
      setTasks((prev: Task[]) =>
        prev.map(t => t.id === id ? updatedTask : t)
      );
    } catch (error) {
      console.error('Failed to toggle task:', error);
    }
  };

  const handleUpdateTask = async (id: number, title: string, description?: string | null) => {
    try {
      const updatedTask = await trpc.updateTask.mutate({
        id,
        title,
        description
      });
      setTasks((prev: Task[]) =>
        prev.map(t => t.id === id ? updatedTask : t)
      );
    } catch (error) {
      console.error('Failed to update task:', error);
    }
  };

  const handleDeleteTask = async (id: number) => {
    try {
      await trpc.deleteTask.mutate({ id });
      setTasks((prev: Task[]) => prev.filter(t => t.id !== id));
    } catch (error) {
      console.error('Failed to delete task:', error);
    }
  };

  const activeTasks = tasks.filter(task => !task.completed);
  const completedTasks = tasks.filter(task => task.completed);

  return (
    <div className="min-h-screen bg-black text-white">
      <div className="max-w-2xl mx-auto py-8 px-4">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold tracking-tight mb-2">Tasks</h1>
          <p className="text-gray-400">A minimalist task manager for developers</p>
        </div>

        {/* Quick Stats */}
        <div className="flex gap-4 mb-8">
          <div className="flex items-center gap-2">
            <Badge variant="secondary" className="bg-gray-800 text-gray-300 hover:bg-gray-700">
              {activeTasks.length} active
            </Badge>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="secondary" className="bg-gray-800 text-gray-300 hover:bg-gray-700">
              {completedTasks.length} completed
            </Badge>
          </div>
        </div>

        {/* Task Creation Form */}
        <Card className="bg-gray-900 border-gray-800 mb-8">
          <CardContent className="p-6">
            <TaskForm onSubmit={handleCreateTask} isLoading={isLoading} />
          </CardContent>
        </Card>

        {/* Filter */}
        <div className="mb-6">
          <TaskFilter currentFilter={filter} onFilterChange={setFilter} />
        </div>

        {/* Task List */}
        <TaskList
          tasks={tasks}
          onToggle={handleToggleTask}
          onUpdate={handleUpdateTask}
          onDelete={handleDeleteTask}
        />

        {tasks.length === 0 && (
          <div className="text-center py-12">
            <div className="text-gray-600 text-lg mb-2">No tasks yet</div>
            <div className="text-gray-500">Create your first task above to get started</div>
          </div>
        )}
      </div>
    </div>
  );
}

export default App;