import * as supertest from 'supertest';
import { IStatus } from '../../../../src/status/interfaces';

export class StatusRequestSender {
  public constructor(private readonly app: Express.Application) {}

  public async getStatus(): Promise<supertest.Response> {
    return supertest.agent(this.app).get('/status').set('Content-Type', 'application/json');
  }

  public async updateStatus(status: IStatus): Promise<supertest.Response> {
    return supertest.agent(this.app).put('/status').set('Content-Type', 'application/json').send(status);
  }
}
