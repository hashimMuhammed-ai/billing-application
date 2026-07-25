const mockPdfBuffer = Buffer.from('%PDF-1.4 Mock PDF Content');

module.exports = {
  launch: jest.fn().mockImplementation(() =>
    Promise.resolve({
      newPage: jest.fn().mockImplementation(() =>
        Promise.resolve({
          setContent: jest.fn().mockResolvedValue(undefined),
          pdf: jest.fn().mockResolvedValue(mockPdfBuffer),
        }),
      ),
      close: jest.fn().mockResolvedValue(undefined),
    }),
  ),
};
