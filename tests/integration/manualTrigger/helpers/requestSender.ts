import * as supertest from 'supertest';

export class ManualTriggerRequestSender {
  public constructor(private readonly app: Express.Application) {}

  public async createLayer(data: string | Record<string, unknown>): Promise<supertest.Response> {
    return supertest.agent(this.app).post('/trigger').set('Content-Type', 'application/json').send(data);
  }
}
