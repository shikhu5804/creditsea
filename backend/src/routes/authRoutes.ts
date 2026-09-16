import { Router } from 'express';
import { signup, login, getMe, submitEligibility } from '../controllers/authController';
import { authenticateJWT } from '../middleware/auth';

const router = Router();

router.post('/signup', signup);
router.post('/login', login);
router.get('/me', authenticateJWT, getMe);
router.post('/profile/eligibility', authenticateJWT, submitEligibility);

export default router;
