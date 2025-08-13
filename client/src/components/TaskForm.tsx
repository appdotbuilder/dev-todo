import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useState } from 'react';
import type { CreateTaskInput } from '../../../server/src/schema';

interface TaskFormProps {
  onSubmit: (data: CreateTaskInput) => Promise<void>;
  isLoading?: boolean;
}

export function TaskForm({ onSubmit, isLoading = false }: TaskFormProps) {
  const [formData, setFormData] = useState<CreateTaskInput>({
    title: '',
    description: null
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title.trim()) return;
    
    await onSubmit({
      title: formData.title.trim(),
      description: formData.description?.trim() || null
    });
    
    // Reset form after successful submission
    setFormData({
      title: '',
      description: null
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <Input
          value={formData.title}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
            setFormData((prev: CreateTaskInput) => ({ ...prev, title: e.target.value }))
          }
          placeholder="What needs to be done?"
          className="bg-black border-gray-700 text-white placeholder:text-gray-500 focus:border-gray-500"
          required
          disabled={isLoading}
        />
      </div>
      <div>
        <Textarea
          value={formData.description || ''}
          onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
            setFormData((prev: CreateTaskInput) => ({
              ...prev,
              description: e.target.value || null
            }))
          }
          placeholder="Add a description (optional)"
          className="bg-black border-gray-700 text-white placeholder:text-gray-500 focus:border-gray-500 min-h-[80px] resize-none"
          disabled={isLoading}
        />
      </div>
      <Button 
        type="submit" 
        disabled={isLoading || !formData.title.trim()}
        className="w-full bg-white text-black hover:bg-gray-200"
      >
        {isLoading ? 'Adding...' : 'Add Task'}
      </Button>
    </form>
  );
}