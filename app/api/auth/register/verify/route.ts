import { verifyRegistrationResponse } from '@simplewebauthn/server';
import { prisma } from '@/lib/prisma';
import { cookies } from 'next/headers';

const rpID = process.env.RP_ID ?? 'localhost';
const origin = process.env.ORIGIN ?? 'http://localhost:3000';

export async function POST(request: Request) {
  const cookieStore = await cookies();
  const challenge = cookieStore.get('webauthn-challenge')?.value;

  if (!challenge) {
    return Response.json({ error: 'No challenge found' }, { status: 400 });
  }

  const { username, credential } = await request.json();

  let verification;
  try {
    verification = await verifyRegistrationResponse({
      response: credential,
      expectedChallenge: challenge,
      expectedOrigin: origin,
      expectedRPID: rpID,
    });
  } catch {
    cookieStore.delete('webauthn-challenge');
    return Response.json({ error: 'Verification failed' }, { status: 400 });
  }

  if (!verification.verified || !verification.registrationInfo) {
    cookieStore.delete('webauthn-challenge');
    return Response.json({ error: 'Verification failed' }, { status: 400 });
  }

  const { credential: regCredential } = verification.registrationInfo;
  const transports: string[] = credential.response?.transports ?? [];

  let user = await prisma.user.findUnique({ where: { username } });
  if (!user) {
    user = await prisma.user.create({ data: { username } });
  }

  await prisma.credential.create({
    data: {
      userId: user.id,
      credentialId: regCredential.id,
      publicKey: Buffer.from(regCredential.publicKey).toString('base64url'),
      counter: regCredential.counter,
      transports: JSON.stringify(transports),
    },
  });

  cookieStore.delete('webauthn-challenge');
  cookieStore.set('userId', user.id.toString(), {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    maxAge: 60 * 60 * 24 * 7,
    path: '/',
  });

  return Response.json({ redirectTo: '/' });
}
