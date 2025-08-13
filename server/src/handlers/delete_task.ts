import { db } from '../db';
import { tasksTable } from '../db/schema';
import { type DeleteTaskInput } from '../schema';
import { eq } from 'drizzle-orm';

export const deleteTask = async (input: DeleteTaskInput): Promise<{ success: boolean; id: number }> => {
  try {
    const result = await db.delete(tasksTable)
      .where(eq(tasksTable.id, input.id))
      .returning({ id: tasksTable.id })
      .execute();

    if (result.length === 0) {
      throw new Error(`Task with id ${input.id} not found`);
    }

    return {
      success: true,
      id: result[0].id,
    };
  } catch (error) {
    console.error('Task deletion failed:', error);
    throw error;
  }
};