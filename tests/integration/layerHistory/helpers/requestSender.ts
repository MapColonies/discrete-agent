import * as supertest from 'supertest';

export class LayerHistoryRequestSender {
  public constructor(private readonly app: Express.Application) {}

  public async getHistory(directory: string): Promise<supertest.Response> {
    directory = encodeURIComponent(directory);
    return supertest.agent(this.app).get(`/layers/${directory}`).set('Content-Type', 'application/json');
  }

  public async createHistory(directory: string): Promise<supertest.Response> {
    directory = encodeURIComponent(directory);
    return supertest.agent(this.app).post(`/layers/${directory}`).set('Content-Type', 'application/json');
  }

  public async updateHistoryStatus(directory: string, body: Record<string, unknown>): Promise<supertest.Response> {
    directory = encodeURIComponent(directory);
    return supertest.agent(this.app).put(`/layers/${directory}`).set('Content-Type', 'application/json').send(body);
  }
}
