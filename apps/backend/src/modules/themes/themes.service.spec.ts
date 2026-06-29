import { NotFoundException } from '@nestjs/common';
import { ThemesService } from './themes.service';

describe('ThemesService', () => {
  it('matches theme rules by profile conditions', async () => {
    const rules = [
      { conditions: { element: 'wood' }, recommendedSkuIds: ['sku-1'], enabled: true },
    ];
    const model = { find: jest.fn().mockReturnValue({ sort: jest.fn().mockResolvedValue(rules) }) } as any;
    const catalogService = { findSkusByIds: jest.fn().mockResolvedValue([{ _id: 'sku-1' }]) } as any;
    const service = new ThemesService(model, catalogService);

    const result = await service.match({ themeType: 'wuxing', profile: { element: 'wood' } });

    expect(result.rule).toBe(rules[0]);
    expect(result.skus).toHaveLength(1);
  });

  it('rejects updating a missing theme rule', async () => {
    const model = { findByIdAndUpdate: jest.fn().mockResolvedValue(null) } as any;
    const service = new ThemesService(model, {} as any);

    await expect(service.update('missing', { enabled: false })).rejects.toBeInstanceOf(NotFoundException);
  });
});
