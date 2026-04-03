import { Router } from 'express';
import { login } from './auth.routes';

const router = Router();

router.post('/login', login);

export default router;
