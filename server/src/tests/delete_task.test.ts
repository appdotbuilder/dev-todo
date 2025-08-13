import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { tasksTable } from '../db/schema';
import { type DeleteTaskInput } from '../schema';
import { deleteTask } from '../handlers/delete_task';
import { eq } from 'drizzle-orm';

// Test input for deleting a task
const testDeleteInput: DeleteTaskInput = {
  id: 1
};

describe('deleteTask', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should delete an existing task', async () => {
    // First create a task to delete
    const newTask = await db.insert(tasksTable)
      .values({
        title: 'Task to Delete',
        description: 'This task will be deleted',
        completed: false
      })
      .returning()
      .execute();

    const taskId = newTask[0].id;

    // Delete the task
    const result = await deleteTask({ id: taskId });

    // Verify the deletion was successful
    expect(result.success).toBe(true);

    // Verify the task no longer exists in the database
    const deletedTask = await db.select()
      .from(tasksTable)
      .where(eq(tasksTable.id, taskId))
      .execute();

    expect(deletedTask).toHaveLength(0);
  });

  it('should throw an error when trying to delete a non-existent task', async () => {
    // Try to delete a task that doesn't exist
    const nonExistentId = 999;
    
    await expect(deleteTask({ id: nonExistentId }))
      .rejects
      .toThrow(/Task with id 999 not found/i);
  });

  it('should not affect other tasks when deleting one task', async () => {
    // Create multiple tasks
    const task1 = await db.insert(tasksTable)
      .values({
        title: 'Task 1',
        description: 'First task',
        completed: false
      })
      .returning()
      .execute();

    const task2 = await db.insert(tasksTable)
      .values({
        title: 'Task 2', 
        description: 'Second task',
        completed: true
      })
      .returning()
      .execute();

    const task3 = await db.insert(tasksTable)
      .values({
        title: 'Task 3',
        description: 'Third task',
        completed: false
      })
      .returning()
      .execute();

    // Delete the middle task
    const result = await deleteTask({ id: task2[0].id });
    expect(result.success).toBe(true);

    // Verify task 2 is deleted
    const deletedTask = await db.select()
      .from(tasksTable)
      .where(eq(tasksTable.id, task2[0].id))
      .execute();
    expect(deletedTask).toHaveLength(0);

    // Verify other tasks still exist
    const remainingTasks = await db.select()
      .from(tasksTable)
      .execute();
    
    expect(remainingTasks).toHaveLength(2);
    
    // Verify the correct tasks remain
    const taskIds = remainingTasks.map(task => task.id).sort();
    expect(taskIds).toEqual([task1[0].id, task3[0].id].sort());
  });

  it('should handle deleting a completed task', async () => {
    // Create a completed task
    const completedTask = await db.insert(tasksTable)
      .values({
        title: 'Completed Task',
        description: 'This task is already completed',
        completed: true
      })
      .returning()
      .execute();

    // Delete the completed task
    const result = await deleteTask({ id: completedTask[0].id });

    expect(result.success).toBe(true);

    // Verify the task is deleted
    const deletedTask = await db.select()
      .from(tasksTable)
      .where(eq(tasksTable.id, completedTask[0].id))
      .execute();

    expect(deletedTask).toHaveLength(0);
  });

  it('should handle deleting a task with null description', async () => {
    // Create a task with null description
    const taskWithNullDesc = await db.insert(tasksTable)
      .values({
        title: 'Task with null description',
        description: null,
        completed: false
      })
      .returning()
      .execute();

    // Delete the task
    const result = await deleteTask({ id: taskWithNullDesc[0].id });

    expect(result.success).toBe(true);

    // Verify the task is deleted
    const deletedTask = await db.select()
      .from(tasksTable)
      .where(eq(tasksTable.id, taskWithNullDesc[0].id))
      .execute();

    expect(deletedTask).toHaveLength(0);
  });
});