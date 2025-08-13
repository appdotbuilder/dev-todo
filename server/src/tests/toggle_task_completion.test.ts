import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { tasksTable } from '../db/schema';
import { type ToggleTaskCompletionInput } from '../schema';
import { toggleTaskCompletion } from '../handlers/toggle_task_completion';
import { eq } from 'drizzle-orm';

describe('toggleTaskCompletion', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should toggle task from incomplete to complete', async () => {
    // Create a test task that is incomplete
    const createResult = await db.insert(tasksTable)
      .values({
        title: 'Test Task',
        description: 'A task for testing',
        completed: false
      })
      .returning()
      .execute();

    const createdTask = createResult[0];
    const originalUpdatedAt = createdTask.updated_at;

    const input: ToggleTaskCompletionInput = {
      id: createdTask.id
    };

    // Wait a small amount to ensure updated_at changes
    await new Promise(resolve => setTimeout(resolve, 10));

    const result = await toggleTaskCompletion(input);

    // Verify the task was toggled to completed
    expect(result.id).toEqual(createdTask.id);
    expect(result.title).toEqual('Test Task');
    expect(result.description).toEqual('A task for testing');
    expect(result.completed).toBe(true); // Should be toggled to true
    expect(result.created_at).toEqual(createdTask.created_at);
    expect(result.updated_at).not.toEqual(originalUpdatedAt); // Should be updated
    expect(result.updated_at).toBeInstanceOf(Date);
  });

  it('should toggle task from complete to incomplete', async () => {
    // Create a test task that is already completed
    const createResult = await db.insert(tasksTable)
      .values({
        title: 'Completed Task',
        description: 'Already done',
        completed: true
      })
      .returning()
      .execute();

    const createdTask = createResult[0];
    const originalUpdatedAt = createdTask.updated_at;

    const input: ToggleTaskCompletionInput = {
      id: createdTask.id
    };

    // Wait a small amount to ensure updated_at changes
    await new Promise(resolve => setTimeout(resolve, 10));

    const result = await toggleTaskCompletion(input);

    // Verify the task was toggled to incomplete
    expect(result.id).toEqual(createdTask.id);
    expect(result.title).toEqual('Completed Task');
    expect(result.description).toEqual('Already done');
    expect(result.completed).toBe(false); // Should be toggled to false
    expect(result.created_at).toEqual(createdTask.created_at);
    expect(result.updated_at).not.toEqual(originalUpdatedAt); // Should be updated
    expect(result.updated_at).toBeInstanceOf(Date);
  });

  it('should save the toggled status to database', async () => {
    // Create a test task
    const createResult = await db.insert(tasksTable)
      .values({
        title: 'Database Test Task',
        completed: false
      })
      .returning()
      .execute();

    const createdTask = createResult[0];

    const input: ToggleTaskCompletionInput = {
      id: createdTask.id
    };

    await toggleTaskCompletion(input);

    // Query database directly to verify the change was persisted
    const dbTask = await db.select()
      .from(tasksTable)
      .where(eq(tasksTable.id, createdTask.id))
      .execute();

    expect(dbTask).toHaveLength(1);
    expect(dbTask[0].completed).toBe(true); // Should be toggled in database
    expect(dbTask[0].updated_at).not.toEqual(createdTask.updated_at); // Should be updated in database
  });

  it('should handle task with null description', async () => {
    // Create a test task with null description
    const createResult = await db.insert(tasksTable)
      .values({
        title: 'Null Description Task',
        description: null,
        completed: false
      })
      .returning()
      .execute();

    const createdTask = createResult[0];

    const input: ToggleTaskCompletionInput = {
      id: createdTask.id
    };

    const result = await toggleTaskCompletion(input);

    expect(result.id).toEqual(createdTask.id);
    expect(result.title).toEqual('Null Description Task');
    expect(result.description).toBeNull();
    expect(result.completed).toBe(true);
  });

  it('should throw error when task does not exist', async () => {
    const input: ToggleTaskCompletionInput = {
      id: 999999 // Non-existent ID
    };

    await expect(toggleTaskCompletion(input)).rejects.toThrow(/task with id 999999 not found/i);
  });

  it('should handle multiple toggles correctly', async () => {
    // Create a test task
    const createResult = await db.insert(tasksTable)
      .values({
        title: 'Multiple Toggle Task',
        completed: false
      })
      .returning()
      .execute();

    const createdTask = createResult[0];

    const input: ToggleTaskCompletionInput = {
      id: createdTask.id
    };

    // First toggle: false -> true
    const firstToggle = await toggleTaskCompletion(input);
    expect(firstToggle.completed).toBe(true);

    // Wait to ensure updated_at changes
    await new Promise(resolve => setTimeout(resolve, 10));

    // Second toggle: true -> false
    const secondToggle = await toggleTaskCompletion(input);
    expect(secondToggle.completed).toBe(false);
    expect(secondToggle.updated_at).not.toEqual(firstToggle.updated_at);

    // Wait to ensure updated_at changes
    await new Promise(resolve => setTimeout(resolve, 10));

    // Third toggle: false -> true
    const thirdToggle = await toggleTaskCompletion(input);
    expect(thirdToggle.completed).toBe(true);
    expect(thirdToggle.updated_at).not.toEqual(secondToggle.updated_at);
  });
});