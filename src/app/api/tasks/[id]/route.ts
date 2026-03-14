import { withAuth, AuthenticatedRequest } from '@/middleware/auth';
import { connectDB } from '@/lib/db';
import Task from '@/models/Task';
import { updateTaskSchema } from '@/lib/validators';
import { encryptAtRest, decryptAtRest } from '@/lib/crypto';
import { badRequest, forbidden, notFound, serverError } from '@/lib/response';
import { parseBody, okE2E } from '@/lib/e2e';
import mongoose from 'mongoose';

type Context = { params: { id: string } };

async function getTask(req: AuthenticatedRequest, { params }: Context) {
  try {
    if (!mongoose.isValidObjectId(params.id)) return notFound();
    await connectDB();
    const task = await Task.findById(params.id).lean();
    if (!task) return notFound('Task not found');
    if (task.owner.toString() !== req.user.userId) return forbidden();
    return okE2E({ task: { ...task, description: decryptAtRest(task.description) } });
  } catch (err) {
    console.error('[GET /api/tasks/:id]', err);
    return serverError();
  }
}

async function updateTask(req: AuthenticatedRequest, { params }: Context) {
  try {
    if (!mongoose.isValidObjectId(params.id)) return notFound();

    const body   = await parseBody<unknown>(req);
    const parsed = updateTaskSchema.safeParse(body);
    if (!parsed.success)
      return badRequest('Validation failed', parsed.error.flatten().fieldErrors);

    await connectDB();
    const task = await Task.findById(params.id);
    if (!task) return notFound('Task not found');
    if (task.owner.toString() !== req.user.userId) return forbidden();

    const updates = { ...parsed.data } as Record<string, unknown>;
    if (typeof updates.description === 'string')
      updates.description = encryptAtRest(updates.description as string);

    Object.assign(task, updates);
    await task.save();

    const plain = decryptAtRest(task.description);
    return okE2E({ task: { ...task.toJSON(), description: plain } });
  } catch (err) {
    console.error('[PATCH /api/tasks/:id]', err);
    return serverError();
  }
}

async function deleteTask(req: AuthenticatedRequest, { params }: Context) {
  try {
    if (!mongoose.isValidObjectId(params.id)) return notFound();
    await connectDB();
    const task = await Task.findById(params.id);
    if (!task) return notFound('Task not found');
    if (task.owner.toString() !== req.user.userId) return forbidden();
    await task.deleteOne();
    return okE2E({ message: 'Task deleted successfully' });
  } catch (err) {
    console.error('[DELETE /api/tasks/:id]', err);
    return serverError();
  }
}

async function handler(req: AuthenticatedRequest, context: Context) {
  if (req.method === 'GET')    return getTask(req, context);
  if (req.method === 'PATCH')  return updateTask(req, context);
  if (req.method === 'DELETE') return deleteTask(req, context);
}

export const GET    = withAuth(handler as any);
export const PATCH  = withAuth(handler as any);
export const DELETE = withAuth(handler as any);
