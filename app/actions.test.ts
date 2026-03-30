import { beforeEach, describe, it, expect, vi } from 'vitest';
import { Prisma } from '@prisma/client';

// vi.mock calls are hoisted to the top of the file by Vitest before any imports run.
// This means the mocks are in place before actions.ts is imported and its module-level
// code executes — so next/cache, next/navigation, and auth-actions are already mocked.
vi.mock('@/lib/prisma');
vi.mock('./auth-actions', () => ({ getCurrentUser: vi.fn() }));
vi.mock('next/cache', () => ({ revalidatePath: vi.fn() }));
vi.mock('next/navigation', () => ({ redirect: vi.fn() }));

import { prisma } from '@/lib/prisma';
import { getCurrentUser } from './auth-actions';
import {
  getWines,
  deleteWine,
  addSharedWine,
  generateShareToken,
  followUser,
  unfollowUser,
  addToWishlist,
} from './actions';

const prismaMock = prisma as any;
const getCurrentUserMock = getCurrentUser as ReturnType<typeof vi.fn>;

// Shared fixtures
const mockUser = { id: 1, username: 'alice', createdAt: new Date() };
const mockWine = {
  id: 1,
  name: 'Merlot',
  description: 'Full bodied',
  rating: 4,
  notes: null,
  imagePath: '/uploads/test.jpg',
  userId: 1,
  shareToken: null,
  sharedByUsername: null,
  createdAt: new Date(),
};

beforeEach(() => {
  vi.resetAllMocks();
  getCurrentUserMock.mockResolvedValue(null); // default: not authenticated
});

// ---------------------------------------------------------------------------
// getWines
// ---------------------------------------------------------------------------

describe('getWines', () => {
  it('returns empty array when not authenticated', async () => {
    getCurrentUserMock.mockResolvedValue(null);
    expect(await getWines()).toEqual([]);
  });

  it('returns wines for the authenticated user', async () => {
    getCurrentUserMock.mockResolvedValue(mockUser);
    prismaMock.wine.findMany.mockResolvedValue([mockWine]);

    const result = await getWines();

    expect(result).toEqual([mockWine]);
    expect(prismaMock.wine.findMany).toHaveBeenCalledWith({
      where: { userId: mockUser.id },
      orderBy: { createdAt: 'desc' },
    });
  });
});

// ---------------------------------------------------------------------------
// deleteWine
// ---------------------------------------------------------------------------

describe('deleteWine', () => {
  it('throws Unauthorized when not authenticated', async () => {
    getCurrentUserMock.mockResolvedValue(null);
    await expect(deleteWine(1)).rejects.toThrow('Unauthorized');
  });

  it('throws Not found when the wine does not exist', async () => {
    getCurrentUserMock.mockResolvedValue(mockUser);
    prismaMock.wine.findUnique.mockResolvedValue(null);
    await expect(deleteWine(99)).rejects.toThrow('Not found');
  });

  it('throws Not found when the wine belongs to another user', async () => {
    getCurrentUserMock.mockResolvedValue(mockUser);
    prismaMock.wine.findUnique.mockResolvedValue({ ...mockWine, userId: 999 });
    await expect(deleteWine(1)).rejects.toThrow('Not found');
  });

  it('deletes the wine when the user owns it', async () => {
    getCurrentUserMock.mockResolvedValue(mockUser);
    prismaMock.wine.findUnique.mockResolvedValue(mockWine);
    prismaMock.wine.count.mockResolvedValue(0);
    prismaMock.wine.delete.mockResolvedValue(mockWine);
    await deleteWine(1);
    expect(prismaMock.wine.delete).toHaveBeenCalledWith({ where: { id: 1 } });
  });
});

// ---------------------------------------------------------------------------
// generateShareToken
// ---------------------------------------------------------------------------

describe('generateShareToken', () => {
  it('throws Unauthorized when not authenticated', async () => {
    getCurrentUserMock.mockResolvedValue(null);
    await expect(generateShareToken(1)).rejects.toThrow('Unauthorized');
  });

  it('returns the existing token without creating a new one', async () => {
    getCurrentUserMock.mockResolvedValue(mockUser);
    prismaMock.wine.findUnique.mockResolvedValue({ ...mockWine, shareToken: 'existing-uuid' });

    const token = await generateShareToken(1);

    expect(token).toBe('existing-uuid');
    expect(prismaMock.wine.update).not.toHaveBeenCalled();
  });

  it('generates and returns a UUID token when none exists', async () => {
    getCurrentUserMock.mockResolvedValue(mockUser);
    prismaMock.wine.findUnique.mockResolvedValue({ ...mockWine, shareToken: null });
    // The return value of wine.update is not used by the action — it returns
    // the locally-generated UUID. Mock it to avoid an "unresolved promise" warning.
    prismaMock.wine.update.mockResolvedValue({ ...mockWine, shareToken: 'ignored' });

    const token = await generateShareToken(1);

    // The token comes from randomUUID() — verify it looks like a UUID
    expect(token).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/);
    expect(prismaMock.wine.update).toHaveBeenCalledWith({
      where: { id: 1 },
      data: { shareToken: expect.stringMatching(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/) },
    });
  });
});

// ---------------------------------------------------------------------------
// addSharedWine
// ---------------------------------------------------------------------------

describe('addSharedWine', () => {
  it('throws Unauthorized when not authenticated', async () => {
    getCurrentUserMock.mockResolvedValue(null);
    await expect(addSharedWine('token')).rejects.toThrow('Unauthorized');
  });

  it('throws Wine not found when the token does not match any wine', async () => {
    getCurrentUserMock.mockResolvedValue(mockUser);
    prismaMock.wine.findUnique.mockResolvedValue(null);
    await expect(addSharedWine('bad-token')).rejects.toThrow('Wine not found');
  });

  it('throws Already in your collection when the wine is yours', async () => {
    getCurrentUserMock.mockResolvedValue(mockUser);
    prismaMock.wine.findUnique.mockResolvedValue({
      ...mockWine,
      userId: mockUser.id,
      shareToken: 'token',
      user: { id: mockUser.id, username: 'alice', createdAt: new Date() },
    } as any);
    await expect(addSharedWine('token')).rejects.toThrow('Already in your collection');
  });

  it('copies the wine into the current user collection', async () => {
    const otherUser = { id: 2, username: 'bob', createdAt: new Date() };
    getCurrentUserMock.mockResolvedValue(mockUser);
    prismaMock.wine.findUnique.mockResolvedValue({
      ...mockWine,
      id: 5,
      name: 'Pinot',
      userId: otherUser.id,
      shareToken: 'token',
      user: otherUser,
    } as any);
    prismaMock.wine.create.mockResolvedValue({ ...mockWine, id: 6 });

    await addSharedWine('token');

    expect(prismaMock.wine.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        name: 'Pinot',
        userId: mockUser.id,
        sharedByUsername: 'bob',
      }),
    });
  });
});

// ---------------------------------------------------------------------------
// followUser / unfollowUser
// ---------------------------------------------------------------------------

describe('followUser', () => {
  it('throws Unauthorized when not authenticated', async () => {
    getCurrentUserMock.mockResolvedValue(null);
    await expect(followUser(2)).rejects.toThrow('Unauthorized');
  });

  it('throws Cannot follow yourself', async () => {
    getCurrentUserMock.mockResolvedValue(mockUser);
    await expect(followUser(mockUser.id)).rejects.toThrow('Cannot follow yourself');
  });

  it('creates a Follow record', async () => {
    getCurrentUserMock.mockResolvedValue(mockUser);
    prismaMock.follow.create.mockResolvedValue({
      id: 1,
      followerId: mockUser.id,
      followingId: 2,
      createdAt: new Date(),
    });

    await followUser(2);

    expect(prismaMock.follow.create).toHaveBeenCalledWith({
      data: { followerId: mockUser.id, followingId: 2 },
    });
  });
});

describe('unfollowUser', () => {
  it('throws Unauthorized when not authenticated', async () => {
    getCurrentUserMock.mockResolvedValue(null);
    await expect(unfollowUser(2)).rejects.toThrow('Unauthorized');
  });

  it('deletes the Follow record', async () => {
    getCurrentUserMock.mockResolvedValue(mockUser);
    prismaMock.follow.deleteMany.mockResolvedValue({ count: 1 });

    await unfollowUser(2);

    expect(prismaMock.follow.deleteMany).toHaveBeenCalledWith({
      where: { followerId: mockUser.id, followingId: 2 },
    });
  });
});

// ---------------------------------------------------------------------------
// addToWishlist
// ---------------------------------------------------------------------------

describe('addToWishlist', () => {
  const otherUserWine = { ...mockWine, id: 10, userId: 2 };
  const owner = { id: 2, username: 'bob', createdAt: new Date() };

  it('throws Unauthorized when not authenticated', async () => {
    getCurrentUserMock.mockResolvedValue(null);
    await expect(addToWishlist(10)).rejects.toThrow('Unauthorized');
  });

  it('throws Wine not found when the wine does not exist', async () => {
    getCurrentUserMock.mockResolvedValue(mockUser);
    prismaMock.wine.findUnique.mockResolvedValue(null);
    await expect(addToWishlist(999)).rejects.toThrow('Wine not found');
  });

  it('creates a WishlistItem', async () => {
    getCurrentUserMock.mockResolvedValue(mockUser);
    prismaMock.wine.findUnique.mockResolvedValue(otherUserWine);
    prismaMock.user.findUnique.mockResolvedValue(owner);
    prismaMock.wishlistItem.create.mockResolvedValue({
      id: 1,
      userId: mockUser.id,
      name: otherUserWine.name,
      description: otherUserWine.description,
      imagePath: otherUserWine.imagePath,
      addedByUsername: owner.username,
      createdAt: new Date(),
    });

    await addToWishlist(10);

    expect(prismaMock.wishlistItem.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        userId: mockUser.id,
        name: otherUserWine.name,
        addedByUsername: owner.username,
      }),
    });
  });

  it('silently ignores a P2002 duplicate constraint error', async () => {
    getCurrentUserMock.mockResolvedValue(mockUser);
    prismaMock.wine.findUnique.mockResolvedValue(otherUserWine);
    prismaMock.user.findUnique.mockResolvedValue(owner);
    prismaMock.wishlistItem.create.mockRejectedValue(
      new Prisma.PrismaClientKnownRequestError('Unique constraint failed', {
        code: 'P2002',
        clientVersion: '6.0.0',
        meta: {},
      })
    );

    // Should resolve without throwing — duplicate is a no-op
    await expect(addToWishlist(10)).resolves.toBeUndefined();
  });
});
