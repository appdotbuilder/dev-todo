import { db } from '../db';
import { tasksTable } from '../db/schema';
import { type CreateTaskInput, type Task } from '../schema';

export const createTask = async (input: CreateTaskInput): Promise<Task> => {
  try {
    const result = await db.insert(tasksTable)
      .values({
        title: input.title,
        description: input.description || null,
        completed: false,
      })
      .returning()
      .execute();

    const task = result[0];
    return {
      ...task,
      created_at: task.created_at,
      updated_at: task.updated_at,
    };
  } catch (error) {
    console.error('Task creation failed:', error);
    throw error;
  }
};