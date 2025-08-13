import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { tasksTable } from '../db/schema';
import { type CreateTaskInput } from '../schema';
import { createTask } from '../handlers/create_task';
import { eq } from 'drizzle-orm';

// Test inputs with all required fields
const testInput: CreateTaskInput = {
  title: 'Test Task',
  description: 'A task for testing'
};

const testInputWithoutDescription: CreateTaskInput = {
  title: 'Task Without Description'
};

describe('createTask', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should create a task with description', async () => {
    const result = await createTask(testInput);

    // Basic field validation
    expect(result.title).toEqual('Test Task');
    expect(result.description).toEqual('A task for testing');
    expect(result.completed).toEqual(false);
    expect(result.id).toBeDefined();
    expect(result.created_at).toBeInstanceOf(Date);
    expect(result.updated_at).toBeInstanceOf(Date);
  });

  it('should create a task without description', async () => {
    const result = await createTask(testInputWithoutDescription);

    // Basic field validation
    expect(result.title).toEqual('Task Without Description');
    expect(result.description).toBeNull();
    expect(result.completed).toEqual(false);
    expect(result.id).toBeDefined();
    expect(result.created_at).toBeInstanceOf(Date);
    expect(result.updated_at).toBeInstanceOf(Date);
  });

  it('should save task to database', async () => {
    const result = await createTask(testInput);

    // Query using proper drizzle syntax
    const tasks = await db.select()
      .from(tasksTable)
      .where(eq(tasksTable.id, result.id))
      .execute();

    expect(tasks).toHaveLength(1);
    expect(tasks[0].title).toEqual('Test Task');
    expect(tasks[0].description).toEqual('A task for testing');
    expect(tasks[0].completed).toEqual(false);
    expect(tasks[0].created_at).toBeInstanceOf(Date);
    expect(tasks[0].updated_at).toBeInstanceOf(Date);
  });

  it('should create multiple tasks with unique IDs', async () => {
    const task1 = await createTask(testInput);
    const task2 = await createTask(testInputWithoutDescription);

    expect(task1.id).not.toEqual(task2.id);
    expect(task1.title).toEqual('Test Task');
    expect(task2.title).toEqual('Task Without Description');

    // Verify both tasks exist in database
    const allTasks = await db.select()
      .from(tasksTable)
      .execute();

    expect(allTasks).toHaveLength(2);
  });

  it('should set default values correctly', async () => {
    const result = await createTask(testInput);

    // New tasks should be incomplete by default
    expect(result.completed).toBe(false);
    
    // Timestamps should be set automatically
    expect(result.created_at).toBeInstanceOf(Date);
    expect(result.updated_at).toBeInstanceOf(Date);
    
    // Timestamps should be recent (within last minute)
    const now = new Date();
    const oneMinuteAgo = new Date(now.getTime() - 60000);
    
    expect(result.created_at >= oneMinuteAgo).toBe(true);
    expect(result.created_at <= now).toBe(true);
    expect(result.updated_at >= oneMinuteAgo).toBe(true);
    expect(result.updated_at <= now).toBe(true);
  });
});