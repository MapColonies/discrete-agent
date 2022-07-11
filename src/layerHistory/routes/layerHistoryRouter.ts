import { Router } from 'express';
import { FactoryFunction } from 'tsyringe';
import { LayerHistoryController } from '../controllers/layerHistoryController';

const layerHistoryRouterFactory: FactoryFunction<Router> = (dependencyContainer) => {
  const router = Router();
  const controller = dependencyContainer.resolve(LayerHistoryController);

  router.get('/:directory', controller.getLayerHistory);
  router.post('/:directory', controller.createLayerHistory);
  router.put('/:directory', controller.updateLayerHistoryStatus);

  return router;
};

export const LAYER_HISTORY_ROUTER_SYMBOL = Symbol('layerHistoryRouterFactory');

export { layerHistoryRouterFactory };
