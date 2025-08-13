import { db } from '../db';
import { tasksTable } from '../db/schema';
import { type GetTasksInput, type Task } from '../schema';
import { eq, desc } from 'drizzle-orm';

export const getTasks = async (input: GetTasksInput): Promise<Task[]> => {
  try {
    // Build complete queries based on filter without reassignment
    let results;
    
    if (input.filter === 'active') {
      results = await db.select()
        .from(tasksTable)
        .where(eq(tasksTable.completed, false))
        .orderBy(desc(tasksTable.created_at))
        .execute();
    } else if (input.filter === 'completed') {
      results = await db.select()
        .from(tasksTable)
        .where(eq(tasksTable.completed, true))
        .orderBy(desc(tasksTable.created_at))
        .execute();
    } else {
      // For 'all' filter, no where condition
      results = await db.select()
        .from(tasksTable)
        .orderBy(desc(tasksTable.created_at))
        .execute();
    }

    return results.map(task => ({
      ...task,
      created_at: task.created_at,
      updated_at: task.updated_at,
    }));
  } catch (error) {
    console.error('Task retrieval failed:', error);
    throw error;
  }
};