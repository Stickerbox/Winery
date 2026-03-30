import { beforeEach, describe, it, expect, vi } from 'vitest';
import type { prisma as PrismaMock } from '@/lib/__mocks__/prisma';

vi.mock('@/lib/prisma');
vi.mock('next/headers', () => ({ cookies: vi.fn() }));
vi.mock('@simplewebauthn/server', () => ({
  generateAuthenticationOptions: vi.fn(),
  verifyAuthenticationResponse: vi.fn(),
}));

import { prisma } from '@/lib/prisma';
import { cookies } from 'next/headers';
import { generateAuthenticationOptions } from '@simplewebauthn/server';
import { POST as authenticateOptions } from './options/route';

const prismaMock = prisma as unknown as typeof PrismaMock;

const mockCookieStore = {
  get: vi.fn(),
  set: vi.fn(),
  delete: vi.fn(),
};

beforeEach(() => {
  vi.resetAllMocks();
  vi.mocked(cookies).mockResolvedValue(mockCookieStore as any);
  process.env.RP_ID = 'localhost';
  process.env.ORIGIN = 'http://localhost:3000';
});

function makeRequest(body: unknown) {
  return new Request('http://localhost/api/auth/authenticate/options', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
}

const mockUser = { id: 1, username: 'alice', createdAt: new Date() };
const mockCredentials = [
  {
    id: 'db-id',
    credentialId: 'cred-base64url',
    publicKey: 'pubkey-base64url',
    counter: 0,
    transports: '["internal"]',
    userId: 1,
    createdAt: new Date(),
  },
];

// ---------------------------------------------------------------------------
// authenticate/options
// ---------------------------------------------------------------------------

describe('POST /api/auth/authenticate/options', () => {
  it('returns 404 when user does not exist', async () => {
    prismaMock.user.findUnique.mockResolvedValue(null);

    const res = await authenticateOptions(makeRequest({ username: 'ghost' }));
    expect(res.status).toBe(404);
  });

  it('returns 404 when user exists but has no credentials', async () => {
    prismaMock.user.findUnique.mockResolvedValue({
      ...mockUser,
      credentials: [],
    } as any);

    const res = await authenticateOptions(makeRequest({ username: 'alice' }));
    expect(res.status).toBe(404);
  });

  it('returns 200 with auth options and stores challenge cookie', async () => {
    prismaMock.user.findUnique.mockResolvedValue({
      ...mockUser,
      credentials: mockCredentials,
    } as any);
    vi.mocked(generateAuthenticationOptions).mockResolvedValue({
      challenge: 'auth-challenge',
    } as any);

    const res = await authenticateOptions(makeRequest({ username: 'alice' }));

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.challenge).toBe('auth-challenge');
    expect(mockCookieStore.set).toHaveBeenCalledWith(
      'webauthn-challenge',
      'auth-challenge',
      expect.objectContaining({ httpOnly: true, maxAge: 300, path: '/' })
    );
  });
});
