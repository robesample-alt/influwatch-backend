import { Router } from 'express';
import * as AmbassadorRoutes from './ambassador.routes';

const router = Router();

// Static routes must come before /:id
router.get('/monitor',          AmbassadorRoutes.getMonitorSummary);
router.get('/',                  AmbassadorRoutes.listAmbassadors);
router.post('/',                 AmbassadorRoutes.createAmbassador);
router.patch('/:id/assignment',  AmbassadorRoutes.updateAssignment);
router.get('/:id',               AmbassadorRoutes.getAmbassadorDetail);

export default router;
