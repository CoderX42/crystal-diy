import { NotFoundException } from '@nestjs/common';
import { ContentService } from './content.service';

describe('ContentService', () => {
  it('rejects updating missing content', async () => {
    const model = { findByIdAndUpdate: jest.fn().mockResolvedValue(null) } as any;
    const service = new ContentService(model);

    await expect(service.update('missing', { title: '白水晶寓意' })).rejects.toBeInstanceOf(NotFoundException);
  });

  it('lists only published app content with type and keyword filters', async () => {
    const chain = {
      sort: jest.fn().mockReturnThis(),
      skip: jest.fn().mockReturnThis(),
      limit: jest.fn().mockResolvedValue([{ title: '白水晶寓意', status: 'published' }]),
    };
    const model = {
      find: jest.fn().mockReturnValue(chain),
      countDocuments: jest.fn().mockResolvedValue(1),
    } as any;
    const service = new ContentService(model);

    const result = await service.listPublished({ page: 1, pageSize: 20, type: 'article', keyword: '白水晶' });

    expect(model.find).toHaveBeenCalledWith({ type: 'article', title: { $regex: '白水晶', $options: 'i' }, status: 'published' });
    expect(model.countDocuments).toHaveBeenCalledWith({ type: 'article', title: { $regex: '白水晶', $options: 'i' }, status: 'published' });
    expect(result.total).toBe(1);
  });

  it('rejects reading unpublished or missing content from app', async () => {
    const model = { findOne: jest.fn().mockResolvedValue(null) } as any;
    const service = new ContentService(model);

    await expect(service.getPublished('content-1')).rejects.toBeInstanceOf(NotFoundException);
    expect(model.findOne).toHaveBeenCalledWith({ _id: 'content-1', status: 'published' });
  });
});
