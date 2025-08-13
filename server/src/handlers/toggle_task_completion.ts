import { db } from '../db';
import { tasksTable } from '../db/schema';
import { type ToggleTaskCompletionInput, type Task } from '../schema';
import { eq } from 'drizzle-orm';

export const toggleTaskCompletion = async (input: ToggleTaskCompletionInput): Promise<Task> => {
  try {
    // First, find the current task to get its completion status
    const existingTask = await db.select()
      .from(tasksTable)
      .where(eq(tasksTable.id, input.id))
      .execute();

    if (existingTask.length === 0) {
      throw new Error(`Task with id ${input.id} not found`);
    }

    const currentTask = existingTask[0];
    const newCompletedStatus = !currentTask.completed;

    // Update the task with toggled completion status and new updated_at timestamp
    const result = await db.update(tasksTable)
      .set({
        completed: newCompletedStatus,
        updated_at: new Date()
      })
      .where(eq(tasksTable.id, input.id))
      .returning()
      .execute();

    return result[0];
  } catch (error) {
    console.error('Task completion toggle failed:', error);
    throw error;
  }
};