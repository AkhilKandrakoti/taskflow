import { withAuth, AuthenticatedRequest } from '@/middleware/auth';
import { connectDB } from '@/lib/db';
import Task from '@/models/Task';
import { createTaskSchema, taskQuerySchema } from '@/lib/validators';
import { encryptAtRest, decryptAtRest } from '@/lib/crypto';
import { badRequest, serverError } from '@/lib/response';
import { parseBody, okE2E, createdE2E } from '@/lib/e2e';
import mongoose from 'mongoose';

async function getTasks(req: AuthenticatedRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const parsed = taskQuerySchema.safeParse({
      page:   searchParams.get('page')   ?? 1,
      limit:  searchParams.get('limit')  ?? 10,
      status: searchParams.get('status') ?? 'all',
      search: searchParams.get('search') ?? undefined,
    });

    if (!parsed.success)
      return badRequest('Invalid query parameters', parsed.error.flatten().fieldErrors);

    const { page, limit, status, search } = parsed.data;
    const ownerId = new mongoose.Types.ObjectId(req.user.userId);

    const filter: Record<string, unknown> = { owner: ownerId };
    if (status !== 'all') filter.status = status;
    if (search?.length) {
      filter.$or = [
        { title:       { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
      ];
    }

    const skip = (page - 1) * limit;
    const [tasks, total] = await Promise.all([
      Task.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
      Task.countDocuments(filter),
    ]);

    const decryptedTasks = tasks.map((t) => ({
      ...t,
      description: decryptAtRest(t.description),
    }));

    return okE2E({
      tasks: decryptedTasks,
      pagination: {
        page, limit, total,
        totalPages:  Math.ceil(total / limit),
        hasNextPage: page < Math.ceil(total / limit),
        hasPrevPage: page > 1,
      },
    });
  } catch (err) {
    console.error('[GET /api/tasks]', err);
    return serverError();
  }
}

async function createTask(req: AuthenticatedRequest) {
  try {
    const body   = await parseBody<unknown>(req);
    const parsed = createTaskSchema.safeParse(body);

    if (!parsed.success)
      return badRequest('Validation failed', parsed.error.flatten().fieldErrors);

    const { title, description, status } = parsed.data;

    const task = await Task.create({
      title,
      description: description ? encryptAtRest(description) : '',
      status,
      owner: new mongoose.Types.ObjectId(req.user.userId),
    });

    return createdE2E({
      task: { ...task.toJSON(), description },
    });
  } catch (err) {
    console.error('[POST /api/tasks]', err);
    return serverError();
  }
}

async function handler(req: AuthenticatedRequest) {
  await connectDB();
  if (req.method === 'GET')  return getTasks(req);
  if (req.method === 'POST') return createTask(req);
}

export const GET  = withAuth(handler as any);
export const POST = withAuth(handler as any);
