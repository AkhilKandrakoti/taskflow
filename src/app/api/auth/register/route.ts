import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import User from '@/models/User';
import { signAccessToken, signRefreshToken } from '@/lib/jwt';
import { setAuthCookies } from '@/lib/cookies';
import { registerSchema } from '@/lib/validators';
import { badRequest, serverError } from '@/lib/response';
import { parseBody, createdE2E } from '@/lib/e2e';

export async function POST(req: NextRequest) {
  try {
    const body = await parseBody<unknown>(req);

    const parsed = registerSchema.safeParse(body);
    if (!parsed.success) {
      return badRequest('Validation failed', parsed.error.flatten().fieldErrors);
    }

    const { name, email, password } = parsed.data;

    await connectDB();

    const existing = await User.findOne({ email });
    if (existing) return badRequest('An account with this email already exists');

    const user = await User.create({ name, email, password });

    const payload = { userId: user._id.toString(), email: user.email };
    const accessToken  = signAccessToken(payload);
    const refreshToken = signRefreshToken(payload);

    const response = createdE2E({
      user: { id: user._id, name: user.name, email: user.email },
    });

    return setAuthCookies(response, accessToken, refreshToken);
  } catch (err) {
    console.error('[POST /api/auth/register]', err);
    return serverError();
  }
}
