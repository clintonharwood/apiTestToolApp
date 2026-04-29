const apiController = require('../../src/controllers/apiController');

const mockRes = () => {
  const res = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
};

describe('apiController', () => {
  describe('getProducts', () => {
    test('returns JSON with products array after delay', async () => {
      jest.useFakeTimers();
      const res = mockRes();
      apiController.getProducts({}, res);

      jest.advanceTimersByTime(20000);

      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
        products: expect.arrayContaining([
          expect.objectContaining({ id: 1, title: 'Phone' }),
          expect.objectContaining({ id: 2, title: 'Wallet' }),
        ])
      }));
      jest.useRealTimers();
    });
  });

  describe('serverError', () => {
    test('returns 500 status with error JSON', () => {
      const res = mockRes();
      apiController.serverError({}, res);
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({ result: '500 error' });
    });
  });

  describe('createRecord', () => {
    test('returns 201 status with created JSON', () => {
      const res = mockRes();
      apiController.createRecord({}, res);
      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith({ result: 'Record created' });
    });
  });
});
