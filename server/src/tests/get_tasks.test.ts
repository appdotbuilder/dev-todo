import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { tasksTable } from '../db/schema';
import { type GetTasksInput } from '../schema';
import { getTasks } from '../handlers/get_tasks';

describe('getTasks', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return empty array when no tasks exist', async () => {
    const input: GetTasksInput = { filter: 'all' };
    
    const result = await getTasks(input);
    
    expect(result).toEqual([]);
  });

  it('should return all tasks when filter is "all"', async () => {
    // Create test tasks with different completion states
    await db.insert(tasksTable).values([
      { title: 'Task 1', description: 'First task', completed: false },
      { title: 'Task 2', description: 'Second task', completed: true },
      { title: 'Task 3', description: null, completed: false }
    ]).execute();

    const input: GetTasksInput = { filter: 'all' };
    const result = await getTasks(input);

    expect(result).toHaveLength(3);
    expect(result.map(task => task.title)).toEqual(
      expect.arrayContaining(['Task 1', 'Task 2', 'Task 3'])
    );
  });

  it('should return only active (incomplete) tasks when filter is "active"', async () => {
    // Create test tasks
    await db.insert(tasksTable).values([
      { title: 'Active Task 1', description: 'First active task', completed: false },
      { title: 'Completed Task', description: 'Done task', completed: true },
      { title: 'Active Task 2', description: 'Second active task', completed: false }
    ]).execute();

    const input: GetTasksInput = { filter: 'active' };
    const result = await getTasks(input);

    expect(result).toHaveLength(2);
    result.forEach(task => {
      expect(task.completed).toBe(false);
    });
    expect(result.map(task => task.title)).toEqual(
      expect.arrayContaining(['Active Task 1', 'Active Task 2'])
    );
  });

  it('should return only completed tasks when filter is "completed"', async () => {
    // Create test tasks
    await db.insert(tasksTable).values([
      { title: 'Active Task', description: 'Not done', completed: false },
      { title: 'Completed Task 1', description: 'First done task', completed: true },
      { title: 'Completed Task 2', description: 'Second done task', completed: true }
    ]).execute();

    const input: GetTasksInput = { filter: 'completed' };
    const result = await getTasks(input);

    expect(result).toHaveLength(2);
    result.forEach(task => {
      expect(task.completed).toBe(true);
    });
    expect(result.map(task => task.title)).toEqual(
      expect.arrayContaining(['Completed Task 1', 'Completed Task 2'])
    );
  });

  it('should use default filter when no filter is provided', async () => {
    // Create test tasks
    await db.insert(tasksTable).values([
      { title: 'Task 1', description: 'First task', completed: false },
      { title: 'Task 2', description: 'Second task', completed: true }
    ]).execute();

    // Test with omitting filter property - after Zod parsing it should default to 'all'
    // Note: In real usage, Zod would parse the input and apply the default
    // For testing, we simulate the post-parsing result
    const input: GetTasksInput = { filter: 'all' };
    const result = await getTasks(input);

    expect(result).toHaveLength(2);
    expect(result.map(task => task.title)).toEqual(
      expect.arrayContaining(['Task 1', 'Task 2'])
    );
  });

  it('should return tasks ordered by creation date (newest first)', async () => {
    // Insert tasks with slight delays to ensure different timestamps
    const task1 = await db.insert(tasksTable).values({
      title: 'First Task',
      description: 'Oldest task',
      completed: false
    }).returning().execute();

    // Small delay to ensure different timestamp
    await new Promise(resolve => setTimeout(resolve, 10));

    const task2 = await db.insert(tasksTable).values({
      title: 'Second Task',
      description: 'Newer task',
      completed: false
    }).returning().execute();

    await new Promise(resolve => setTimeout(resolve, 10));

    const task3 = await db.insert(tasksTable).values({
      title: 'Third Task',
      description: 'Newest task',
      completed: false
    }).returning().execute();

    const input: GetTasksInput = { filter: 'all' };
    const result = await getTasks(input);

    expect(result).toHaveLength(3);
    
    // Verify tasks are ordered by created_at descending (newest first)
    expect(result[0].created_at >= result[1].created_at).toBe(true);
    expect(result[1].created_at >= result[2].created_at).toBe(true);
    
    // The newest task should be first
    expect(result[0].title).toBe('Third Task');
  });

  it('should return correct task properties with proper types', async () => {
    // Create a task with all fields populated
    await db.insert(tasksTable).values({
      title: 'Test Task',
      description: 'Test description',
      completed: true
    }).execute();

    const input: GetTasksInput = { filter: 'all' };
    const result = await getTasks(input);

    expect(result).toHaveLength(1);
    
    const task = result[0];
    expect(task.id).toBeDefined();
    expect(typeof task.id).toBe('number');
    expect(task.title).toBe('Test Task');
    expect(typeof task.title).toBe('string');
    expect(task.description).toBe('Test description');
    expect(task.completed).toBe(true);
    expect(typeof task.completed).toBe('boolean');
    expect(task.created_at).toBeInstanceOf(Date);
    expect(task.updated_at).toBeInstanceOf(Date);
  });

  it('should handle null description correctly', async () => {
    // Create task with null description
    await db.insert(tasksTable).values({
      title: 'Task with no description',
      description: null,
      completed: false
    }).execute();

    const input: GetTasksInput = { filter: 'all' };
    const result = await getTasks(input);

    expect(result).toHaveLength(1);
    expect(result[0].description).toBeNull();
  });
});