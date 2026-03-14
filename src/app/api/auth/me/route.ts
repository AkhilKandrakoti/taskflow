import { withAuth, AuthenticatedRequest } from '@/middleware/auth';
import { connectDB } from '@/lib/db';
import User from '@/models/User';
import { notFound, serverError } from '@/lib/response';
import { okE2E } from '@/lib/e2e';

async function handler(req: AuthenticatedRequest) {
  try {
    await connectDB();
    const user = await User.findById(req.user.userId);
    if (!user) return notFound('User not found');
    return okE2E({ user: { id: user._id, name: user.name, email: user.email } });
  } catch (err) {
    console.error('[GET /api/auth/me]', err);
    return serverError();
  }
}

export const GET = withAuth(handler as any);
