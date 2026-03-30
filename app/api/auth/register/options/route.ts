import { generateRegistrationOptions } from '@simplewebauthn/server';
import { prisma } from '@/lib/prisma';
import { cookies } from 'next/headers';

const rpID = process.env.RP_ID ?? 'localhost';

export async function POST(request: Request) {
  const { username } = await request.json();

  if (!username || typeof username !== 'string' || !username.trim()) {
    return Response.json({ error: 'Username is required' }, { status: 400 });
  }

  const user = await prisma.user.findUnique({
    where: { username },
    include: { credentials: true },
  });

  if (user && user.credentials.length > 0) {
    return Response.json({ error: 'User already registered' }, { status: 409 });
  }

  const options = await generateRegistrationOptions({
    rpName: 'VinoVault',
    rpID,
    userName: username,
    authenticatorSelection: {
      residentKey: 'preferred',
      userVerification: 'preferred',
    },
    excludeCredentials: [],
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
