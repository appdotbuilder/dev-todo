import { db } from '../db';
import { tasksTable } from '../db/schema';
import { type ToggleTaskCompletionInput, type Task } from '../schema';
import { eq } from 'drizzle-orm';

export const toggleTaskCompletion = async (input: ToggleTaskCompletionInput): Promise<Task> => {
  try {
    // First, get the current task to determine its completion status
    const currentTask = await db.select()
      .from(tasksTable)
      .where(eq(tasksTable.id, input.id))
      .execute();

    if (currentTask.length === 0) {
      throw new Error(`Task with id ${input.id} not found`);
    }

    // Toggle the completion status
    const newCompletedStatus = !currentTask[0].completed;

    const result = await db.update(tasksTable)
      .set({
        completed: newCompletedStatus,
        updated_at: new Date(),
      })
      .where(eq(tasksTable.id, input.id))
      .returning()
      .execute();

    const task = result[0];
    return {
      ...task,
      created_at: task.created_at,
      updated_at: task.updated_at,
    };
  } catch (error) {
    console.error('Task completion toggle failed:', error);
    throw error;
  }
};