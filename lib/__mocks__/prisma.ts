import { vi } from 'vitest';

export const prisma = {
  wine: {
    findMany: vi.fn(),
    findUnique: vi.fn(),
    count: vi.fn(),
    delete: vi.fn(),
    update: vi.fn(),
    create: vi.fn(),
  },
  follow: {
    create: vi.fn(),
    deleteMany: vi.fn(),
  },
  user: {
    findUnique: vi.fn(),
  },
  wishlistItem: {
    create: vi.fn(),
  },
};
