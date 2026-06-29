import { ForbiddenException } from '@nestjs/common';
import { ThoughtCardsService } from './thought-cards.service';

describe('ThoughtCardsService ownership', () => {
  const solarTermService = { getTermContext: jest.fn().mockReturnValue({ name: '夏至', suitableFor: ['向光而行'] }) };

  it('rejects poster generation for bracelet non-owner', async () => {
    const card = { braceletId: 'bracelet-1', save: jest.fn() };
    const cardModel = { findById: jest.fn().mockResolvedValue(card) } as any;
    const braceletModel = { findById: jest.fn().mockResolvedValue({ _id: 'bracelet-1', userId: 'owner' }) } as any;
    const posterService = { generateThoughtCardPoster: jest.fn() } as any;
    const service = new ThoughtCardsService(cardModel, {} as any, braceletModel, posterService, solarTermService as any);

    await expect(service.generatePoster('card-1', 'other')).rejects.toBeInstanceOf(ForbiddenException);
    expect(card.save).not.toHaveBeenCalled();
    expect(posterService.generateThoughtCardPoster).not.toHaveBeenCalled();
  });

  it('generates poster for owner and stores poster url', async () => {
    const card: any = {
      braceletId: 'bracelet-1',
      title: '晨光手串',
      thought: '愿你向光而行',
      suitableFor: ['静心'],
      solarTerm: '夏至',
      save: jest.fn().mockResolvedValue({ posterUrl: 'http://localhost:3000/uploads/posters/thought-card-card-1-9x16.svg' }),
    };
    const cardModel = { findById: jest.fn().mockResolvedValue(card) } as any;
    const braceletModel = { findById: jest.fn().mockResolvedValue({ _id: 'bracelet-1', userId: 'owner' }) } as any;
    const posterService = {
      generateThoughtCardPoster: jest.fn().mockReturnValue('http://localhost:3000/uploads/posters/thought-card-card-1-9x16.svg'),
    } as any;
    const service = new ThoughtCardsService(cardModel, {} as any, braceletModel, posterService, solarTermService as any);

    await service.generatePoster('card-1', 'owner');

    expect(posterService.generateThoughtCardPoster).toHaveBeenCalledWith({
      id: 'card-1',
      title: '晨光手串',
      thought: '愿你向光而行',
      suitableFor: ['静心'],
      solarTerm: '夏至',
    });
    expect(card.posterUrl).toBe('http://localhost:3000/uploads/posters/thought-card-card-1-9x16.svg');
    expect(card.status).toBe('poster_generated');
    expect(card.save).toHaveBeenCalled();
  });

  it('lists only cards under current user bracelets', async () => {
    const cardChain = {
      sort: jest.fn().mockReturnThis(),
      skip: jest.fn().mockReturnThis(),
      limit: jest.fn().mockResolvedValue([{ braceletId: 'bracelet-1', title: '今日之念' }]),
    };
    const cardModel = {
      find: jest.fn().mockReturnValue(cardChain),
      countDocuments: jest.fn().mockResolvedValue(1),
    } as any;
    const braceletModel = { find: jest.fn().mockResolvedValue([{ _id: 'bracelet-1', userId: 'owner' }]) } as any;
    const service = new ThoughtCardsService(cardModel, {} as any, braceletModel, {} as any, solarTermService as any);

    const result = await service.listMine('owner', { page: 1, pageSize: 20 });

    expect(braceletModel.find).toHaveBeenCalledWith({ userId: 'owner' });
    expect(cardModel.find).toHaveBeenCalledWith({ braceletId: { $in: ['bracelet-1'] } });
    expect(cardModel.countDocuments).toHaveBeenCalledWith({ braceletId: { $in: ['bracelet-1'] } });
    expect(result.total).toBe(1);
  });

  it('lists only enabled templates for app users', async () => {
    const templateChain = {
      sort: jest.fn().mockReturnThis(),
      skip: jest.fn().mockReturnThis(),
      limit: jest.fn().mockResolvedValue([{ name: '温柔文字', enabled: true }]),
    };
    const templateModel = {
      find: jest.fn().mockReturnValue(templateChain),
      countDocuments: jest.fn().mockResolvedValue(1),
    } as any;
    const service = new ThoughtCardsService({} as any, templateModel, {} as any, {} as any, solarTermService as any);

    const result = await service.listAppTemplates({ page: 1, pageSize: 20, type: 'text', enabled: false });

    expect(templateModel.find).toHaveBeenCalledWith({ type: 'text', enabled: true });
    expect(templateModel.countDocuments).toHaveBeenCalledWith({ type: 'text', enabled: true });
    expect(result.total).toBe(1);
  });

  it('generates thought card with current solar term context', async () => {
    const cardModel = { create: jest.fn().mockResolvedValue({ title: '晨光手串 · 今日之念', solarTerm: '夏至' }) } as any;
    const braceletModel = { findById: jest.fn().mockResolvedValue({ _id: 'bracelet-1', userId: 'owner', name: '晨光手串' }) } as any;
    const templateModel = { findOne: jest.fn() } as any;
    const termService = { getTermContext: jest.fn().mockReturnValue({ name: '夏至', suitableFor: ['向光而行', '释放热爱'] }) };
    const service = new ThoughtCardsService(cardModel, templateModel, braceletModel, {} as any, termService as any);

    await service.generate({ braceletId: 'bracelet-1', seedText: '愿你发光' }, 'owner');

    expect(termService.getTermContext).toHaveBeenCalled();
    expect(cardModel.create).toHaveBeenCalledWith({
      braceletId: 'bracelet-1',
      title: '晨光手串 · 今日之念',
      thought: '愿你发光',
      suitableFor: ['向光而行', '释放热爱'],
      solarTerm: '夏至',
      status: 'generated',
      templateSnapshot: {},
    });
  });
});
