import { singleton } from 'tsyringe';

@singleton()
export class Probe {
  public liveFlag = false;
  public livenessFunction = async (): Promise<void> => {
    return this.liveFlag ? Promise.resolve() : Promise.reject();
  };
}
