import { db } from '../db';
import { tasksTable } from '../db/schema';
import { type UpdateTaskInput, type Task } from '../schema';
import { eq } from 'drizzle-orm';

export const updateTask = async (input: UpdateTaskInput): Promise<Task> => {
  try {
    const updateData: Partial<typeof tasksTable.$inferInsert> = {
      updated_at: new Date(),
    };

    if (input.title !== undefined) {
      updateData.title = input.title;
    }
    if (input.description !== undefined) {
      updateData.description = input.description;
    }
    if (input.completed !== undefined) {
      updateData.completed = input.completed;
    }

    const result = await db.update(tasksTable)
      .set(updateData)
      .where(eq(tasksTable.id, input.id))
      .returning()
      .execute();

    if (result.length === 0) {
      throw new Error(`Task with id ${input.id} not found`);
    }

    const task = result[0];
    return {
      ...task,
      created_at: task.created_at,
      updated_at: task.updated_at,
    };
  } catch (error) {
    console.error('Task update failed:', error);
    throw error;
  }
};