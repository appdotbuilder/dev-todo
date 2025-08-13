import { db } from '../db';
import { tasksTable } from '../db/schema';
import { type GetTasksInput, type Task } from '../schema';
import { eq, desc } from 'drizzle-orm';

export async function getTasks(input: GetTasksInput): Promise<Task[]> {
  try {
    // Build query based on filter type - handle each case separately
    let results;

    if (input.filter === 'active') {
      // Show only incomplete tasks
      results = await db.select()
        .from(tasksTable)
        .where(eq(tasksTable.completed, false))
        .orderBy(desc(tasksTable.created_at))
        .execute();
    } else if (input.filter === 'completed') {
      // Show only completed tasks
      results = await db.select()
        .from(tasksTable)
        .where(eq(tasksTable.completed, true))
        .orderBy(desc(tasksTable.created_at))
        .execute();
    } else {
      // For 'all' filter, no where clause is needed
      results = await db.select()
        .from(tasksTable)
        .orderBy(desc(tasksTable.created_at))
        .execute();
    }

    return results;
  } catch (error) {
    console.error('Failed to retrieve tasks:', error);
    throw error;
  }
}