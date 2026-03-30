import { beforeEach, describe, it, expect, vi } from 'vitest';
import type { prisma as PrismaMock } from '@/lib/__mocks__/prisma';

vi.mock('@/lib/prisma');
vi.mock('next/headers', () => ({ cookies: vi.fn() }));
vi.mock('@simplewebauthn/server', () => ({
  generateRegistrationOptions: vi.fn(),
}));
vi.mock('@/app/auth-actions', () => ({ getCurrentUser: vi.fn() }));

import { prisma } from '@/lib/prisma';
import { cookies } from 'next/headers';
import { generateRegistrationOptions } from '@simplewebauthn/server';
import { getCurrentUser } from '@/app/auth-actions';
import { POST as addOptions } from './add/options/route';

const prismaMock = prisma as unknown as typeof PrismaMock;
const getCurrentUserMock = getCurrentUser as ReturnType<typeof vi.fn>;

const mockCookieStore = {
  get: vi.fn(),
  set: vi.fn(),
  delete: vi.fn(),
};

const mockUser = { id: 1, username: 'alice', createdAt: new Date() };

beforeEach(() => {
  vi.resetAllMocks();
  vi.mocked(cookies).mockResolvedValue(mockCookieStore as any);
  process.env.RP_ID = 'localhost';
});

function makeRequest() {
  return new Request('http://localhost/api/auth/passkeys/add/options', {
    method: 'POST',
  });
}

describe('POST /api/auth/passkeys/add/options', () => {
  it('returns 401 when not authenticated', async () => {
    getCurrentUserMock.mockResolvedValue(null);

    const res = await addOptions(makeRequest());
    expect(res.status).toBe(401);
  });

  it('returns 200 with registration options for an authenticated user', async () => {
    getCurrentUserMock.mockResolvedValue(mockUser);
    prismaMock.credential.findMany.mockResolvedValue([
      { credentialId: 'existing-cred', transports: '["internal"]' },
    ] as any);
    vi.mocked(generateRegistrationOptions).mockResolvedValue({
      challenge: 'add-challenge',
    } as any);

    const res = await addOptions(makeRequest());

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.challenge).toBe('add-challenge');
    expect(mockCookieStore.set).toHaveBeenCalledWith(
      'webauthn-challenge',
      'add-challenge',
      expect.objectContaining({ httpOnly: true })
    );
  });

  it('passes existing credentials as excludeCredentials', async () => {
    getCurrentUserMock.mockResolvedValue(mockUser);
    prismaMock.credential.findMany.mockResolvedValue([
      { credentialId: 'cred-1', transports: '["internal"]' },
      { credentialId: 'cred-2', transports: '[]' },
    ] as any);
    vi.mocked(generateRegistrationOptions).mockResolvedValue({
      challenge: 'ch',
    } as any);

    await addOptions(makeRequest());

    expect(generateRegistrationOptions).toHaveBeenCalledWith(
      expect.objectContaining({
        excludeCredentials: [
          { id: 'cred-1', transports: ['internal'] },
          { id: 'cred-2', transports: [] },
        ],
      })
    );
  });
});
