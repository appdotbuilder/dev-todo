import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { trpc } from '@/utils/trpc';
import { useState, useEffect, useCallback } from 'react';
import type { Task, CreateTaskInput, TaskFilter, UpdateTaskInput } from '../../server/src/schema';
import './App.css';

function App() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [filter, setFilter] = useState<TaskFilter>('all');
  const [isLoading, setIsLoading] = useState(false);
  const [editingTask, setEditingTask] = useState<number | null>(null);
  
  const [formData, setFormData] = useState<CreateTaskInput>({
    title: '',
    description: null
  });

  const [editFormData, setEditFormData] = useState<{
    title: string;
    description: string | null;
  }>({
    title: '',
    description: null
  });

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title.trim()) return;
    
    setIsLoading(true);
    try {
      const response = await trpc.createTask.mutate(formData);
      setTasks((prev: Task[]) => [response, ...prev]);
      setFormData({
        title: '',
        description: null
      });
    } catch (error) {
      console.error('Failed to create task:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleToggleComplete = async (taskId: number) => {
    try {
      const updatedTask = await trpc.toggleTaskCompletion.mutate({ id: taskId });
      setTasks((prev: Task[]) => 
        prev.map((task: Task) => task.id === taskId ? updatedTask : task)
      );
    } catch (error) {
      console.error('Failed to toggle task completion:', error);
    }
  };

  const handleDelete = async (taskId: number) => {
    try {
      await trpc.deleteTask.mutate({ id: taskId });
      setTasks((prev: Task[]) => prev.filter((task: Task) => task.id !== taskId));
    } catch (error) {
      console.error('Failed to delete task:', error);
    }
  };

  const handleEdit = (task: Task) => {
    setEditingTask(task.id);
    setEditFormData({
      title: task.title,
      description: task.description || ''
    });
  };

  const handleEditSubmit = async (taskId: number) => {
    try {
      const updateData: UpdateTaskInput = {
        id: taskId,
        title: editFormData.title,
        description: editFormData.description || null
      };
      
      const updatedTask = await trpc.updateTask.mutate(updateData);
      setTasks((prev: Task[]) => 
        prev.map((task: Task) => task.id === taskId ? updatedTask : task)
      );
      setEditingTask(null);
    } catch (error) {
      console.error('Failed to update task:', error);
    }
  };

  const handleEditCancel = () => {
    setEditingTask(null);
    setEditFormData({ title: '', description: null });
  };

  const getTaskCounts = () => {
    const total = tasks.length;
    const completed = tasks.filter((task: Task) => task.completed).length;
    const active = total - completed;
    return { total, completed, active };
  };

  const counts = getTaskCounts();

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="container mx-auto max-w-4xl px-4 py-12">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 dark:text-gray-100 mb-2">
            ~/tasks
          </h1>
          <p className="text-gray-500 dark:text-gray-400 text-lg">
            Minimalist task management for developers
          </p>
        </div>

        {/* Task Creation Form */}
        <Card className="shadow-sm border border-gray-200 dark:border-gray-800 mb-8">
          <CardContent className="p-6">
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-3">
                <Input
                  placeholder="$ new task"
                  value={formData.title}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    setFormData((prev: CreateTaskInput) => ({ ...prev, title: e.target.value }))
                  }
                  className="text-base border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-950 focus:ring-2 focus:ring-gray-400 focus:border-transparent"
                  required
                />
                <Textarea
                  placeholder="Description (optional)..."
                  value={formData.description || ''}
                  onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
                    setFormData((prev: CreateTaskInput) => ({
                      ...prev,
                      description: e.target.value || null
                    }))
                  }
                  className="resize-none border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-950 focus:ring-2 focus:ring-gray-400 focus:border-transparent"
                  rows={3}
                />
              </div>
              <Button 
                type="submit" 
                disabled={isLoading || !formData.title.trim()}
                className="transition-all duration-200 bg-gray-900 hover:bg-gray-800 text-white dark:bg-gray-100 dark:hover:bg-gray-200 dark:text-gray-900 font-medium"
              >
                {isLoading ? 'Creating...' : '+ Add Task'}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Filter Tabs */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex space-x-1 border border-gray-200 dark:border-gray-800 rounded-lg p-1 bg-white dark:bg-gray-950">
            {(['all', 'active', 'completed'] as TaskFilter[]).map((filterOption) => (
              <button
                key={filterOption}
                onClick={() => setFilter(filterOption)}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                  filter === filterOption
                    ? 'bg-gray-900 text-white dark:bg-gray-100 dark:text-gray-900'
                    : 'text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100'
                }`}
              >
                {filterOption}
              </button>
            ))}
          </div>
          
          {/* Stats */}
          <div className="flex space-x-4 text-sm text-gray-500 dark:text-gray-400">
            <span>Total: {counts.total}</span>
            <span>Active: {counts.active}</span>
            <span>Done: {counts.completed}</span>
          </div>
        </div>

        {/* Tasks List */}
        <div className="space-y-3">
          {tasks.length === 0 ? (
            <Card className="border border-gray-200 dark:border-gray-800 shadow-sm">
              <CardContent className="p-8 text-center">
                <p className="text-gray-500 dark:text-gray-400 text-lg">
                  No tasks found. Create one above to get started.
                </p>
              </CardContent>
            </Card>
          ) : (
            tasks.map((task: Task) => (
              <Card 
                key={task.id} 
                className={`border border-gray-200 dark:border-gray-800 shadow-sm transition-all duration-200 hover:shadow-lg ${
                  task.completed ? 'bg-gray-50 dark:bg-gray-900/50' : 'bg-white dark:bg-gray-950'
                }`}
              >
                <CardContent className="p-4">
                  {editingTask === task.id ? (
                    /* Edit Mode */
                    <div className="space-y-3">
                      <Input
                        value={editFormData.title}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                          setEditFormData(prev => ({ ...prev, title: e.target.value }))
                        }
                        className="border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-950"
                      />
                      <Textarea
                        value={editFormData.description || ''}
                        onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
                          setEditFormData(prev => ({
                            ...prev,
                            description: e.target.value || null
                          }))
                        }
                        className="resize-none border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-950"
                        rows={2}
                      />
                      <div className="flex space-x-2">
                        <Button
                          onClick={() => handleEditSubmit(task.id)}
                          size="sm"
                          className="bg-green-600 hover:bg-green-700 text-white"
                        >
                          Save
                        </Button>
                        <Button
                          onClick={handleEditCancel}
                          variant="outline"
                          size="sm"
                          className="border border-gray-200 dark:border-gray-800"
                        >
                          Cancel
                        </Button>
                      </div>
                    </div>
                  ) : (
                    /* View Mode */
                    <div className="flex items-start space-x-4">
                      <Checkbox
                        checked={task.completed}
                        onCheckedChange={() => handleToggleComplete(task.id)}
                        className="mt-1"
                      />
                      <div className="flex-1 min-w-0">
                        <h3 className={`font-medium ${
                          task.completed 
                            ? 'line-through text-gray-500 dark:text-gray-400' 
                            : 'text-gray-900 dark:text-gray-100'
                        }`}>
                          {task.title}
                        </h3>
                        {task.description && (
                          <p className={`mt-1 text-sm ${
                            task.completed 
                              ? 'line-through text-gray-500 dark:text-gray-400' 
                              : 'text-gray-600 dark:text-gray-300'
                          }`}>
                            {task.description}
                          </p>
                        )}
                        <div className="flex items-center space-x-3 mt-3">
                          <Badge 
                            variant={task.completed ? "secondary" : "outline"} 
                            className="text-xs"
                          >
                            {task.completed ? 'completed' : 'active'}
                          </Badge>
                          <span className="text-xs text-gray-500 dark:text-gray-400">
                            {task.created_at.toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                      <div className="flex space-x-2">
                        <Button
                          onClick={() => handleEdit(task)}
                          variant="ghost"
                          size="sm"
                          className="text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100"
                        >
                          Edit
                        </Button>
                        <Button
                          onClick={() => handleDelete(task.id)}
                          variant="ghost"
                          size="sm"
                          className="text-red-500 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300"
                        >
                          Delete
                        </Button>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))
          )}
        </div>

        {/* Footer */}
        <footer className="mt-16 text-center">
          <p className="text-gray-500 dark:text-gray-400 text-sm">
            Built for developers, by developers
          </p>
        </footer>
      </div>
    </div>
  );
}

export default App;