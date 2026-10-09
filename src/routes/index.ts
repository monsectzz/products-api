import { Router } from 'express';
import productsRoutes from './products.routes';

const router: any = Router();

router.use('/products', productsRoutes);

export default router;
