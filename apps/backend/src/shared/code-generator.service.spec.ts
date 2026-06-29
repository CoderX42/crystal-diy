import { CodeGeneratorService } from './code-generator.service';

describe('CodeGeneratorService', () => {
  it('generates an order number with prefix and date', () => {
    const service = new CodeGeneratorService();
    const orderNo = service.orderNo('YN');

    expect(orderNo).toMatch(/^YN\d{8}[0-9A-Z]{10}$/);
  });
});
