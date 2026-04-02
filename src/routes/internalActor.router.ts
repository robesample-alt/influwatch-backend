import { Router } from 'express';
import * as InternalActorRoutes from './internalActor.routes';

const router = Router();

router.get('/supervisors', InternalActorRoutes.listSupervisors);
router.get('/',            InternalActorRoutes.listInternalActors);

export default router;
