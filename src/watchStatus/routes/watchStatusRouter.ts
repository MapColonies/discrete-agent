import { Router } from 'express';
import { FactoryFunction } from 'tsyringe';
import { WatchStatusController } from '../controllers/watchStatusController';

const watchStatusRouterFactory: FactoryFunction<Router> = (dependencyContainer) => {
  const router = Router();
  const controller = dependencyContainer.resolve(WatchStatusController);

  router.get('/', controller.getStatus);
  router.post('/start', controller.startWatcher);
  router.post('/stop', controller.stopWatcher);

  return router;
};

export const WATCH_STATUS_ROUTER_SYMBOL = Symbol('watchStatusRouterFactory');

export { watchStatusRouterFactory };
