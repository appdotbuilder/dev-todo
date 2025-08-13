import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { useState } from 'react';
import { Pencil, Trash2, Check, X } from 'lucide-react';
import type { Task } from '../../../server/src/schema';

interface TaskItemProps {
  task: Task;
  onToggle: (id: number) => void;
  onUpdate: (id: number, title: string, description?: string | null) => void;
  onDelete: (id: number) => void;
}

export function TaskItem({ task, onToggle, onUpdate, onDelete }: TaskItemProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editTitle, setEditTitle] = useState(task.title);
  const [editDescription, setEditDescription] = useState(task.description || '');

  const handleSave = () => {
    if (!editTitle.trim()) return;
    onUpdate(task.id, editTitle.trim(), editDescription.trim() || null);
    setIsEditing(false);
  };

  const handleCancel = () => {
    setEditTitle(task.title);
    setEditDescription(task.description || '');
    setIsEditing(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && e.ctrlKey) {
      handleSave();
    } else if (e.key === 'Escape') {
      handleCancel();
    }
  };

  return (
    <Card className={`group bg-gray-900 border-gray-800 transition-colors hover:bg-gray-850 ${
      task.completed ? 'opacity-60' : ''
    }`}>
      <CardContent className="p-4">
        {isEditing ? (
          <div className="space-y-3">
            <Input
              value={editTitle}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setEditTitle(e.target.value)}
              onKeyDown={handleKeyDown}
              className="bg-black border-gray-700 text-white"
              autoFocus
            />
            <Textarea
              value={editDescription}
              onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setEditDescription(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Add a description..."
              className="bg-black border-gray-700 text-white min-h-[60px] resize-none"
            />
            <div className="flex gap-2 justify-end">
              <Button
                size="sm"
                variant="ghost"
                onClick={handleCancel}
                className="text-gray-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </Button>
              <Button
                size="sm"
                onClick={handleSave}
                disabled={!editTitle.trim()}
                className="bg-white text-black hover:bg-gray-200"
              >
                <Check className="w-4 h-4" />
              </Button>
            </div>
            <div className="text-xs text-gray-500">
              Tip: Ctrl+Enter to save, Esc to cancel
            </div>
          </div>
        ) : (
          <div className="flex items-start gap-3">
            <div className="flex items-center pt-1">
              <Checkbox
                checked={task.completed}
                onCheckedChange={() => onToggle(task.id)}
                className="border-gray-600 data-[state=checked]:bg-white data-[state=checked]:border-white"
              />
            </div>
            
            <div className="flex-1 min-w-0">
              <div className={`font-medium ${
                task.completed ? 'line-through text-gray-500' : 'text-white'
              }`}>
                {task.title}
              </div>
              {task.description && (
                <div className={`mt-1 text-sm ${
                  task.completed ? 'line-through text-gray-600' : 'text-gray-400'
                }`}>
                  {task.description}
                </div>
              )}
              <div className="mt-2 text-xs text-gray-600">
                Created {task.created_at.toLocaleDateString()}
                {task.updated_at.getTime() !== task.created_at.getTime() && (
                  <span> • Updated {task.updated_at.toLocaleDateString()}</span>
                )}
              </div>
            </div>
            
            <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
              <Button
                size="sm"
                variant="ghost"
                onClick={() => setIsEditing(true)}
                className="text-gray-500 hover:text-white p-1 h-8 w-8"
              >
                <Pencil className="w-3 h-3" />
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => onDelete(task.id)}
                className="text-gray-500 hover:text-red-400 p-1 h-8 w-8"
              >
                <Trash2 className="w-3 h-3" />
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}