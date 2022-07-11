import { Router } from 'express';
import { FactoryFunction } from 'tsyringe';
import { StatusController } from '../controllers/statusController';

const statusRouterFactory: FactoryFunction<Router> = (dependencyContainer) => {
  const router = Router();
  const controller = dependencyContainer.resolve(StatusController);

  router.get('/', controller.getStatus);
  router.put('/', controller.updateStatus);

  return router;
};

export const STATUS_ROUTER_SYMBOL = Symbol('statusRouterFactory');

export { statusRouterFactory };
