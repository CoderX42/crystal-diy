import { BadRequestException, ForbiddenException } from '@nestjs/common';
import { DesignsService } from './designs.service';

describe('DesignsService', () => {
  it('quotes a makeable design with total amount', async () => {
    const model = { create: jest.fn().mockResolvedValue({ _id: 'design-id' }) } as any;
    const catalogService = {
      findSkusByIds: jest.fn().mockResolvedValue([
        { _id: 'sku-bead', price: 10, stock: 20, lockedStock: 0 },
        { _id: 'sku-cord', price: 5, stock: 10, lockedStock: 0 },
      ]),
    } as any;
    const service = new DesignsService(model, catalogService);

    const quote = await service.quote({
      userId: 'user-1',
      items: [
        { instanceId: 'i1', skuId: 'sku-bead', productId: 'p1', category: 'bead', quantity: 2, position: 1 },
        { instanceId: 'i2', skuId: 'sku-cord', productId: 'p2', category: 'cord', quantity: 1, position: 2 },
      ],
    });

    expect(quote.makeable).toBe(true);
    expect(quote.totalAmount).toBe(25);
    expect(model.create).toHaveBeenCalledWith(expect.objectContaining({ status: 'quoted' }));
  });

  it('rejects empty designs', async () => {
    const service = new DesignsService({} as any, {} as any);
    await expect(service.quote({ userId: 'user-1', items: [] })).rejects.toBeInstanceOf(BadRequestException);
  });

  it('saves draft items sorted by position', async () => {
    const model = { create: jest.fn().mockResolvedValue({ _id: 'draft-id' }) } as any;
    const service = new DesignsService(model, {} as any);

    await service.saveDraft({
      userId: 'user-1',
      items: [
        { instanceId: 'i2', skuId: 'sku-cord', productId: 'p2', category: 'cord', quantity: 1, position: 2 },
        { instanceId: 'i1', skuId: 'sku-bead', productId: 'p1', category: 'bead', quantity: 1, position: 1 },
      ],
    });

    expect(model.create).toHaveBeenCalledWith(
      expect.objectContaining({
        status: 'draft',
        items: [
          expect.objectContaining({ instanceId: 'i1', position: 1 }),
          expect.objectContaining({ instanceId: 'i2', position: 2 }),
        ],
      }),
    );
  });

  it('reorders owner draft and invalidates previous quote snapshot', async () => {
    const design = { userId: 'user-1', status: 'quoted', quoteSnapshot: { totalAmount: 100 }, save: jest.fn().mockResolvedValue(true) } as any;
    const model = { findById: jest.fn().mockResolvedValue(design) } as any;
    const service = new DesignsService(model, {} as any);

    await service.reorder(
      'design-1',
      {
        items: [
          { instanceId: 'i2', skuId: 'sku-cord', productId: 'p2', category: 'cord', quantity: 1, position: 2 },
          { instanceId: 'i1', skuId: 'sku-bead', productId: 'p1', category: 'bead', quantity: 1, position: 1 },
        ],
      },
      'user-1',
    );

    expect(design.status).toBe('draft');
    expect(design.quoteSnapshot).toEqual({});
    expect(design.items[0]).toMatchObject({ instanceId: 'i1' });
    expect(design.save).toHaveBeenCalled();
  });

  it('rejects reading another user design draft', async () => {
    const model = { findById: jest.fn().mockResolvedValue({ userId: 'owner' }) } as any;
    const service = new DesignsService(model, {} as any);

    await expect(service.getMine('design-1', 'other')).rejects.toBeInstanceOf(ForbiddenException);
  });
});
