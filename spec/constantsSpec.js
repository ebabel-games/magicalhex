define(['../src/modules/constants'], (C) => {
  

  describe('constants', () => {
    it('set keyboard keys', () => {
      expect(C.KEY.UP).toBe(38);
    });
  });
});
