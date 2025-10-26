import { Router } from 'express';
import { getRevenue, getServiceDistribution } from '../controllers/dashboardController';

const router = Router();

// Dashboard chart endpoints
router.get('/revenue', getRevenue);
router.get('/services', getServiceDistribution);

export default router;
