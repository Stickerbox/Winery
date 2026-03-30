import { beforeEach, describe, it, expect, vi } from 'vitest';
import type { prisma as PrismaMock } from '@/lib/__mocks__/prisma';

vi.mock('@/lib/prisma');
vi.mock('next/headers', () => ({ cookies: vi.fn() }));

import { prisma } from '@/lib/prisma';
import { cookies } from 'next/headers';
import { getPasskeys, removePasskey } from './auth-actions';

const prismaMock = prisma as unknown as typeof PrismaMock;

const mockCookieStore = {
  get: vi.fn(),
  set: vi.fn(),
  delete: vi.fn(),
};

const mockUser = { id: 1, username: 'alice', createdAt: new Date() };

const mockCredentials = [
  { id: 'db-id-1', credentialId: 'cred-1', publicKey: 'pk1', counter: 0, transports: '["internal"]', userId: 1, createdAt: new Date() },
  { id: 'db-id-2', credentialId: 'cred-2', publicKey: 'pk2', counter: 0, transports: '[]', userId: 1, createdAt: new Date() },
];

beforeEach(() => {
  vi.resetAllMocks();
  vi.mocked(cookies).mockResolvedValue(mockCookieStore as any);
  mockCookieStore.get.mockReturnValue(undefined);
});

describe('getPasskeys', () => {
  it('returns empty array when not authenticated', async () => {
    mockCookieStore.get.mockReturnValue(undefined);

    const result = await getPasskeys();
    expect(result).toEqual([]);
  });

  it('returns credentials for the authenticated user', async () => {
    mockCookieStore.get.mockReturnValue({ value: '1' });
    prismaMock.user.findUnique.mockResolvedValue(mockUser as any);
    prismaMock.credential.findMany.mockResolvedValue(mockCredentials as any);

    const result = await getPasskeys();

    expect(result).toEqual(mockCredentials);
    expect(prismaMock.credential.findMany).toHaveBeenCalledWith({
      where: { userId: 1 },
      orderBy: { createdAt: 'asc' },
    });
  });
});

describe('removePasskey', () => {
  it('throws Unauthorized when not authenticated', async () => {
    mockCookieStore.get.mockReturnValue(undefined);
    await expect(removePasskey('db-id-1')).rejects.toThrow('Unauthorized');
  });

  it('throws when removing the last passkey', async () => {
    mockCookieStore.get.mockReturnValue({ value: '1' });
    prismaMock.user.findUnique.mockResolvedValue(mockUser as any);
    prismaMock.credential.count.mockResolvedValue(1);

    await expect(removePasskey('db-id-1')).rejects.toThrow('Cannot remove your only passkey');
  });

  it('deletes the credential when user has multiple', async () => {
    mockCookieStore.get.mockReturnValue({ value: '1' });
    prismaMock.user.findUnique.mockResolvedValue(mockUser as any);
    prismaMock.credential.count.mockResolvedValue(2);
    prismaMock.credential.delete.mockResolvedValue({} as any);

    await removePasskey('db-id-1');

    expect(prismaMock.credential.delete).toHaveBeenCalledWith({
      where: { id: 'db-id-1', userId: 1 },
    });
  });
});
