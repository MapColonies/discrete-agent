import mockAxios from 'jest-mock-axios';

export default {
  ...mockAxios,
  create: jest.fn(() => {
    return {
      ...mockAxios,
      interceptors: {
        request: { use: jest.fn(), eject: jest.fn() },
        response: { use: jest.fn(), eject: jest.fn() },
      },
    };
  }),
};
