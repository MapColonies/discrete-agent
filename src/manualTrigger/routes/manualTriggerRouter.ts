import { Router } from 'express';
import { FactoryFunction } from 'tsyringe';
import { ManualTriggerController } from '../controllers/manualTriggerController';

const manualTriggerRouterFactory: FactoryFunction<Router> = (dependencyContainer) => {
  const router = Router();
  const controller = dependencyContainer.resolve(ManualTriggerController);

  router.post('/', controller.createLayer);

  return router;
};

export const MANUAL_TRIGGER_ROUTER_SYMBOL = Symbol('manualTriggerRouterFactory');

export { manualTriggerRouterFactory };
