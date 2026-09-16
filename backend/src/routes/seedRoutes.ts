import { Router, Request, Response } from 'express';
import { runSeed } from '../seed/seedData';

const router = Router();

router.post('/', async (_req: Request, res: Response) => {
  try {
    const result = await runSeed();
    return res.json({
      message: 'Database seeded successfully with default role accounts and demo loans!',
      credentials: result.users,
    });
  } catch (error: any) {
    return res.status(500).json({ error: error.message || 'Seeding failed' });
  }
});

export default router;
