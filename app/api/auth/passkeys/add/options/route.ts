import { generateRegistrationOptions } from '@simplewebauthn/server';
import type { AuthenticatorTransportFuture } from '@simplewebauthn/server';
import { prisma } from '@/lib/prisma';
import { cookies } from 'next/headers';
import { getCurrentUser } from '@/app/auth-actions';

const rpID = process.env.RP_ID ?? 'localhost';

export async function POST() {
  const user = await getCurrentUser();

  if (!user) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const existingCredentials = await prisma.credential.findMany({
    where: { userId: user.id },
  });

  const options = await generateRegistrationOptions({
    rpName: 'VinoVault',
    rpID,
    userName: user.username,
    attestation: 'none',
    authenticatorSelection: {
      residentKey: 'preferred',
      userVerification: 'preferred',
    },
    excludeCredentials: existingCredentials.map((c) => ({
      id: c.credentialId,
      transports: JSON.parse(c.transports ?? '[]') as AuthenticatorTransportFuture[],
    })),
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
