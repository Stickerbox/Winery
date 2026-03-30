import { beforeEach, describe, it, expect, vi } from 'vitest';
import type { prisma as PrismaMock } from '@/lib/__mocks__/prisma';

vi.mock('@/lib/prisma');
vi.mock('next/headers', () => ({ cookies: vi.fn() }));
vi.mock('@simplewebauthn/server', () => ({
  generateRegistrationOptions: vi.fn(),
  verifyRegistrationResponse: vi.fn(),
}));

import { prisma } from '@/lib/prisma';
import { cookies } from 'next/headers';
import { generateRegistrationOptions } from '@simplewebauthn/server';
import { POST as registerOptions } from './options/route';

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
  return new Request('http://localhost/api/auth/register/options', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
}

// ---------------------------------------------------------------------------
// register/options
// ---------------------------------------------------------------------------

describe('POST /api/auth/register/options', () => {
  it('returns 400 when username is missing', async () => {
    const res = await registerOptions(makeRequest({}));
    expect(res.status).toBe(400);
  });

  it('returns 409 when user already has credentials', async () => {
    prismaMock.user.findUnique.mockResolvedValue({
      id: 1,
      username: 'alice',
      createdAt: new Date(),
      credentials: [{ id: 'cred-1' }],
    } as any);

    const res = await registerOptions(makeRequest({ username: 'alice' }));
    expect(res.status).toBe(409);
  });

  it('returns 200 with options for a new username', async () => {
    prismaMock.user.findUnique.mockResolvedValue(null);
    vi.mocked(generateRegistrationOptions).mockResolvedValue({
      challenge: 'test-challenge',
      rp: { name: 'VinoVault', id: 'localhost' },
    } as any);

    const res = await registerOptions(makeRequest({ username: 'newuser' }));

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.challenge).toBe('test-challenge');
  });

  it('stores the challenge in the webauthn-challenge cookie', async () => {
    prismaMock.user.findUnique.mockResolvedValue(null);
    vi.mocked(generateRegistrationOptions).mockResolvedValue({
      challenge: 'abc123',
    } as any);

    await registerOptions(makeRequest({ username: 'newuser' }));

    expect(mockCookieStore.set).toHaveBeenCalledWith(
      'webauthn-challenge',
      'abc123',
      expect.objectContaining({ httpOnly: true, maxAge: 300, path: '/' })
    );
  });
});

import { verifyRegistrationResponse } from '@simplewebauthn/server';
import { POST as registerVerify } from './verify/route';

function makeVerifyRequest(body: unknown) {
  return new Request('http://localhost/api/auth/register/verify', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
}

const mockCredential = {
  id: 'cred-id-base64url',
  rawId: 'cred-id-base64url',
  response: {
    clientDataJSON: 'abc',
    attestationObject: 'def',
    transports: ['internal'],
  },
  type: 'public-key',
  clientExtensionResults: {},
};

describe('POST /api/auth/register/verify', () => {
  it('returns 400 when no challenge cookie is present', async () => {
    mockCookieStore.get.mockReturnValue(undefined);

    const res = await registerVerify(
      makeVerifyRequest({ username: 'alice', credential: mockCredential })
    );
    expect(res.status).toBe(400);
  });

  it('returns 400 when verification fails', async () => {
    mockCookieStore.get.mockReturnValue({ value: 'stored-challenge' });
    vi.mocked(verifyRegistrationResponse).mockResolvedValue({
      verified: false,
    } as any);

    const res = await registerVerify(
      makeVerifyRequest({ username: 'alice', credential: mockCredential })
    );
    expect(res.status).toBe(400);
  });

  it('creates User and Credential on success and sets session cookie', async () => {
    mockCookieStore.get.mockReturnValue({ value: 'stored-challenge' });
    prismaMock.user.findUnique.mockResolvedValue(null);
    prismaMock.user.create.mockResolvedValue({
      id: 1,
      username: 'alice',
      createdAt: new Date(),
    } as any);
    prismaMock.credential.create.mockResolvedValue({} as any);
    vi.mocked(verifyRegistrationResponse).mockResolvedValue({
      verified: true,
      registrationInfo: {
        credential: {
          id: 'cred-id-base64url',
          publicKey: new Uint8Array([1, 2, 3]),
          counter: 0,
        },
      },
    } as any);

    const res = await registerVerify(
      makeVerifyRequest({ username: 'alice', credential: mockCredential })
    );

    expect(res.status).toBe(200);
    expect(prismaMock.user.create).toHaveBeenCalledWith({
      data: { username: 'alice' },
    });
    expect(prismaMock.credential.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        userId: 1,
        credentialId: 'cred-id-base64url',
        counter: 0,
      }),
    });
    expect(mockCookieStore.set).toHaveBeenCalledWith(
      'userId',
      '1',
      expect.objectContaining({ httpOnly: true })
    );
    expect(mockCookieStore.delete).toHaveBeenCalledWith('webauthn-challenge');
  });

  it('uses existing user instead of creating a new one when username already exists', async () => {
    mockCookieStore.get.mockReturnValue({ value: 'stored-challenge' });
    prismaMock.user.findUnique.mockResolvedValue({
      id: 5,
      username: 'alice',
      createdAt: new Date(),
    } as any);
    prismaMock.credential.create.mockResolvedValue({} as any);
    vi.mocked(verifyRegistrationResponse).mockResolvedValue({
      verified: true,
      registrationInfo: {
        credential: {
          id: 'new-cred',
          publicKey: new Uint8Array([1, 2, 3]),
          counter: 0,
        },
      },
    } as any);

    const res = await registerVerify(
      makeVerifyRequest({ username: 'alice', credential: mockCredential })
    );

    expect(res.status).toBe(200);
    expect(prismaMock.user.create).not.toHaveBeenCalled();
    expect(prismaMock.credential.create).toHaveBeenCalledWith({
      data: expect.objectContaining({ userId: 5 }),
    });
  });
});
