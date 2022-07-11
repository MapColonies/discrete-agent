import * as supertest from 'supertest';

export class WatchStatusRequestSender {
  public constructor(private readonly app: Express.Application) {}

  public async getStatus(): Promise<supertest.Response> {
    return supertest.agent(this.app).get('/status').set('Content-Type', 'application/json');
  }

  public async startWatching(): Promise<supertest.Response> {
    return supertest.agent(this.app).post('/status/start').set('Content-Type', 'application/json');
  }

  public async stopWatching(): Promise<supertest.Response> {
    return supertest.agent(this.app).post('/status/stop').set('Content-Type', 'application/json');
  }
}
