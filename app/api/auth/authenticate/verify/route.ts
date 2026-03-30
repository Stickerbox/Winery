import { verifyAuthenticationResponse } from '@simplewebauthn/server';
import type { AuthenticatorTransportFuture } from '@simplewebauthn/server';
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

  const body = await request.json();

  const dbCredential = await prisma.credential.findUnique({
    where: { credentialId: body.id },
    include: { user: true },
  });

  if (!dbCredential) {
    cookieStore.delete('webauthn-challenge');
    return Response.json({ error: 'Credential not found' }, { status: 400 });
  }

  let verification;
  try {
    verification = await verifyAuthenticationResponse({
      response: body,
      expectedChallenge: challenge,
      expectedOrigin: origin,
      expectedRPID: rpID,
      credential: {
        id: dbCredential.credentialId,
        publicKey: new Uint8Array(Buffer.from(dbCredential.publicKey, 'base64url')),
        counter: dbCredential.counter,
        transports: JSON.parse(dbCredential.transports ?? '[]') as AuthenticatorTransportFuture[],
      },
    });
  } catch {
    cookieStore.delete('webauthn-challenge');
    return Response.json({ error: 'Verification failed' }, { status: 400 });
  }

  if (!verification.verified) {
    cookieStore.delete('webauthn-challenge');
    return Response.json({ error: 'Verification failed' }, { status: 400 });
  }

  await prisma.credential.update({
    where: { credentialId: body.id },
    data: { counter: verification.authenticationInfo.newCounter },
  });

  cookieStore.delete('webauthn-challenge');
  cookieStore.set('userId', dbCredential.userId.toString(), {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    maxAge: 60 * 60 * 24 * 7,
    path: '/',
  });

  return Response.json({ redirectTo: '/' });
}
