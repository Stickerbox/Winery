import { generateAuthenticationOptions } from '@simplewebauthn/server';
import type { AuthenticatorTransportFuture } from '@simplewebauthn/server';
import { prisma } from '@/lib/prisma';
import { cookies } from 'next/headers';

const rpID = process.env.RP_ID ?? 'localhost';

export async function POST(request: Request) {
  const { username } = await request.json();

  const user = await prisma.user.findUnique({
    where: { username },
    include: { credentials: true },
  });

  if (!user || user.credentials.length === 0) {
    return Response.json({ error: 'User not found' }, { status: 404 });
  }

  const options = await generateAuthenticationOptions({
    rpID,
    allowCredentials: user.credentials.map((c) => ({
      id: c.credentialId,
      transports: JSON.parse(c.transports ?? '[]') as AuthenticatorTransportFuture[],
    })),
    userVerification: 'preferred',
  });

  const cookieStore = await cookies();
  cookieStore.set('webauthn-challenge', options.challenge, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    maxAge: 300,
    path: '/',
  });

  return Response.json(options);
}
