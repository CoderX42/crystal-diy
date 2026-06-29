import { BadRequestException, NotFoundException } from '@nestjs/common';
import { CatalogService } from './catalog.service';

describe('CatalogService', () => {
  it('prevents locked stock from exceeding total stock', async () => {
    const sku = { stock: 3, lockedStock: 1, save: jest.fn() };
    const skuModel = { findById: jest.fn().mockResolvedValue(sku) } as any;
    const service = new CatalogService({} as any, skuModel, {} as any);

    await expect(service.adjustInventory('sku-1', { type: 'lock', quantity: 3 })).rejects.toBeInstanceOf(BadRequestException);
  });

  it('returns enabled app skus with available stock and grouped picker data', async () => {
    const bead = { _id: 'sku-bead', productId: 'p1', skuCode: 'B001', name: '白水晶', category: 'bead', price: 12, stock: 10, lockedStock: 3 };
    const cord = { _id: 'sku-cord', productId: 'p2', skuCode: 'C001', name: '弹力绳', category: 'cord', price: 5, stock: 8, lockedStock: 0 };
    const chain = {
      sort: jest.fn().mockReturnThis(),
      skip: jest.fn().mockReturnThis(),
      limit: jest.fn().mockResolvedValue([bead, cord]),
    };
    const skuModel = {
      find: jest.fn().mockReturnValue(chain),
      countDocuments: jest.fn().mockResolvedValue(2),
    } as any;
    const service = new CatalogService({} as any, skuModel, {} as any);

    const result = await service.listAppPicker({ page: 1, pageSize: 20 });

    expect(skuModel.find).toHaveBeenCalledWith({ enabled: true });
    expect(result.items[0]).toMatchObject({ id: 'sku-bead', availableStock: 7 });
    expect(result.grouped.bead).toHaveLength(1);
    expect(result.grouped.cord).toHaveLength(1);
  });

  it('rejects updating a missing catalog item', async () => {
    const itemModel = { findByIdAndUpdate: jest.fn().mockResolvedValue(null) } as any;
    const service = new CatalogService(itemModel, {} as any, {} as any);

    await expect(service.update('missing', { name: '白水晶' })).rejects.toBeInstanceOf(NotFoundException);
  });

  it('rejects updating a missing sku', async () => {
    const skuModel = { findByIdAndUpdate: jest.fn().mockResolvedValue(null) } as any;
    const service = new CatalogService({} as any, skuModel, {} as any);

    await expect(service.updateSku('missing', { price: 12 })).rejects.toBeInstanceOf(NotFoundException);
  });
});
