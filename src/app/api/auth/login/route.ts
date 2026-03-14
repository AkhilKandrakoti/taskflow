import { NextRequest } from 'next/server';
import { connectDB } from '@/lib/db';
import User from '@/models/User';
import { signAccessToken, signRefreshToken } from '@/lib/jwt';
import { setAuthCookies } from '@/lib/cookies';
import { loginSchema } from '@/lib/validators';
import { badRequest, serverError, unauthorized } from '@/lib/response';
import { parseBody, okE2E } from '@/lib/e2e';

export async function POST(req: NextRequest) {
  try {
    const body = await parseBody<unknown>(req);

    const parsed = loginSchema.safeParse(body);
    if (!parsed.success) {
      return badRequest('Validation failed', parsed.error.flatten().fieldErrors);
    }

    const { email, password } = parsed.data;

    await connectDB();

    const user = await User.findOne({ email }).select('+password');
    if (!user) return unauthorized('Invalid email or password');

    const passwordMatch = await user.comparePassword(password);
    if (!passwordMatch) return unauthorized('Invalid email or password');

    const payload = { userId: user._id.toString(), email: user.email };
    const accessToken  = signAccessToken(payload);
    const refreshToken = signRefreshToken(payload);

    const response = okE2E({
      user: { id: user._id, name: user.name, email: user.email },
    });

    return setAuthCookies(response, accessToken, refreshToken);
  } catch (err) {
    console.error('[POST /api/auth/login]', err);
    return serverError();
  }
}
