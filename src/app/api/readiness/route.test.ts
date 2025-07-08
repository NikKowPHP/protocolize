import { GET } from './route';
import { prisma } from '@/lib/db';
import { getServerSession } from 'next-auth';
// Mock the dependencies
jest.mock('@/lib/db', () => ({
  prisma: {
    question: {
      findMany: jest.fn(),
    },
  },
}));
jest.mock('next-auth', () => ({
  getServerSession: jest.fn(),
}));

describe('GET /api/readiness', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should return a readiness score for an authenticated user', async () => {
    // Mock session
    const mockSession = { user: { id: 'user123' } };
    (getServerSession as jest.Mock).mockResolvedValue(mockSession);

    // Mock prisma response
    const mockQuestions = [
      { id: 1, reviewCount: 2, struggleCount: 0, lastReviewed: new Date() },
      { id: 2, reviewCount: 1, struggleCount: 1, lastReviewed: new Date() },
    ];
    (prisma.question.findMany as jest.Mock).mockResolvedValue(mockQuestions);

    const res = await GET();

    expect(res.status).toBe(200);
    expect(res.json).toBeDefined();
    const json = await res.json();
    expect(json).toHaveProperty('readinessScore');
    expect(typeof json.readinessScore).toBe('number');
  });

  it('should return 401 for unauthenticated users', async () => {
    // Mock session as null
    (getServerSession as jest.Mock).mockResolvedValue(null);
const res = await GET();


    expect(res.status).toBe(401);
    expect(res.json).toBeDefined();
    const json = await res.json();
    expect(json).toEqual({ error: 'Unauthorized' });
  });

  it('should return 500 for server errors', async () => {
    // Mock session
    const mockSession = { user: { id: 'user123' } };
    (getServerSession as jest.Mock).mockResolvedValue(mockSession);

    // Mock prisma to throw an error
    (prisma.question.findMany as jest.Mock).mockRejectedValue(new Error('DB error'));
const res = await GET();


    expect(res.status).toBe(500);
    expect(res.json).toBeDefined();
    const json = await res.json();
    expect(json).toEqual({ error: 'Internal server error' });
  });
});