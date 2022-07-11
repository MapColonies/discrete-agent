import { Repository, ObjectType, ObjectLiteral } from 'typeorm';

//functions
const getCustomRepositoryMock = jest.fn();
const createConnection = jest.fn();

//Repository functions mock
const findOneMock = jest.fn();
const saveMock = jest.fn();
const findMock = jest.fn();

let repositories: {
  [key: string]: unknown;
};
const initTypeOrmMocks = (): void => {
  repositories = {};
  getCustomRepositoryMock.mockImplementation(<T>(key: ObjectType<T>) => {
    return repositories[key.name];
  });
  createConnection.mockReturnValue({
    getCustomRepository: getCustomRepositoryMock,
  });
};
const registerRepository = <T>(key: ObjectType<T>, instance: T): void => {
  const repo = instance as unknown as Repository<ObjectLiteral>;
  repo.findOne = findOneMock;
  repo.save = saveMock;
  repo.find = findMock;
  repositories[key.name] = repo;
};

//initializers
export { registerRepository, initTypeOrmMocks };
//mocks
export { createConnection, findOneMock, saveMock };
