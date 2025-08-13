import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { tasksTable } from '../db/schema';
import { type UpdateTaskInput, type CreateTaskInput } from '../schema';
import { updateTask } from '../handlers/update_task';
import { eq } from 'drizzle-orm';

// Test data
const testTask: CreateTaskInput = {
  title: 'Original Task',
  description: 'Original description'
};

describe('updateTask', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should update task title', async () => {
    // Create a task first
    const createdTask = await db.insert(tasksTable)
      .values({
        title: testTask.title,
        description: testTask.description,
        completed: false
      })
      .returning()
      .execute();

    const taskId = createdTask[0].id;

    const updateInput: UpdateTaskInput = {
      id: taskId,
      title: 'Updated Task Title'
    };

    const result = await updateTask(updateInput);

    expect(result.id).toEqual(taskId);
    expect(result.title).toEqual('Updated Task Title');
    expect(result.description).toEqual('Original description');
    expect(result.completed).toEqual(false);
    expect(result.updated_at).toBeInstanceOf(Date);
    expect(result.created_at).toBeInstanceOf(Date);
  });

  it('should update task description', async () => {
    // Create a task first
    const createdTask = await db.insert(tasksTable)
      .values({
        title: testTask.title,
        description: testTask.description,
        completed: false
      })
      .returning()
      .execute();

    const taskId = createdTask[0].id;

    const updateInput: UpdateTaskInput = {
      id: taskId,
      description: 'Updated description'
    };

    const result = await updateTask(updateInput);

    expect(result.id).toEqual(taskId);
    expect(result.title).toEqual('Original Task');
    expect(result.description).toEqual('Updated description');
    expect(result.completed).toEqual(false);
    expect(result.updated_at).toBeInstanceOf(Date);
  });

  it('should update completion status', async () => {
    // Create a task first
    const createdTask = await db.insert(tasksTable)
      .values({
        title: testTask.title,
        description: testTask.description,
        completed: false
      })
      .returning()
      .execute();

    const taskId = createdTask[0].id;

    const updateInput: UpdateTaskInput = {
      id: taskId,
      completed: true
    };

    const result = await updateTask(updateInput);

    expect(result.id).toEqual(taskId);
    expect(result.title).toEqual('Original Task');
    expect(result.description).toEqual('Original description');
    expect(result.completed).toEqual(true);
    expect(result.updated_at).toBeInstanceOf(Date);
  });

  it('should update multiple fields at once', async () => {
    // Create a task first
    const createdTask = await db.insert(tasksTable)
      .values({
        title: testTask.title,
        description: testTask.description,
        completed: false
      })
      .returning()
      .execute();

    const taskId = createdTask[0].id;

    const updateInput: UpdateTaskInput = {
      id: taskId,
      title: 'Updated Title',
      description: 'Updated Description',
      completed: true
    };

    const result = await updateTask(updateInput);

    expect(result.id).toEqual(taskId);
    expect(result.title).toEqual('Updated Title');
    expect(result.description).toEqual('Updated Description');
    expect(result.completed).toEqual(true);
    expect(result.updated_at).toBeInstanceOf(Date);
  });

  it('should set description to null', async () => {
    // Create a task first
    const createdTask = await db.insert(tasksTable)
      .values({
        title: testTask.title,
        description: testTask.description,
        completed: false
      })
      .returning()
      .execute();

    const taskId = createdTask[0].id;

    const updateInput: UpdateTaskInput = {
      id: taskId,
      description: null
    };

    const result = await updateTask(updateInput);

    expect(result.id).toEqual(taskId);
    expect(result.title).toEqual('Original Task');
    expect(result.description).toBeNull();
    expect(result.completed).toEqual(false);
  });

  it('should update the updated_at timestamp', async () => {
    // Create a task first
    const createdTask = await db.insert(tasksTable)
      .values({
        title: testTask.title,
        description: testTask.description,
        completed: false
      })
      .returning()
      .execute();

    const taskId = createdTask[0].id;
    const originalUpdatedAt = createdTask[0].updated_at;

    // Wait a small amount to ensure different timestamps
    await new Promise(resolve => setTimeout(resolve, 10));

    const updateInput: UpdateTaskInput = {
      id: taskId,
      title: 'Updated Title'
    };

    const result = await updateTask(updateInput);

    expect(result.updated_at).toBeInstanceOf(Date);
    expect(result.updated_at.getTime()).toBeGreaterThan(originalUpdatedAt.getTime());
  });

  it('should persist changes to database', async () => {
    // Create a task first
    const createdTask = await db.insert(tasksTable)
      .values({
        title: testTask.title,
        description: testTask.description,
        completed: false
      })
      .returning()
      .execute();

    const taskId = createdTask[0].id;

    const updateInput: UpdateTaskInput = {
      id: taskId,
      title: 'Updated Title',
      completed: true
    };

    await updateTask(updateInput);

    // Verify the changes were persisted
    const updatedTask = await db.select()
      .from(tasksTable)
      .where(eq(tasksTable.id, taskId))
      .execute();

    expect(updatedTask).toHaveLength(1);
    expect(updatedTask[0].title).toEqual('Updated Title');
    expect(updatedTask[0].completed).toEqual(true);
    expect(updatedTask[0].description).toEqual('Original description');
  });

  it('should throw error when task does not exist', async () => {
    const nonExistentId = 99999;

    const updateInput: UpdateTaskInput = {
      id: nonExistentId,
      title: 'Updated Title'
    };

    await expect(updateTask(updateInput)).rejects.toThrow(/task with id .* not found/i);
  });

  it('should handle partial updates correctly', async () => {
    // Create a task first
    const createdTask = await db.insert(tasksTable)
      .values({
        title: testTask.title,
        description: testTask.description,
        completed: false
      })
      .returning()
      .execute();

    const taskId = createdTask[0].id;

    // Update only one field
    const updateInput: UpdateTaskInput = {
      id: taskId,
      completed: true
    };

    const result = await updateTask(updateInput);

    // Verify only the specified field changed, others remain the same
    expect(result.title).toEqual('Original Task');
    expect(result.description).toEqual('Original description');
    expect(result.completed).toEqual(true);
  });
});