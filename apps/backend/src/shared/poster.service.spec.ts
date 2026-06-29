import { existsSync, readFileSync, rmSync } from 'fs';
import { join } from 'path';
import { PosterService } from './poster.service';

describe('PosterService', () => {
  const uploadDir = 'uploads-test-poster-service';
  const posterPath = join(process.cwd(), uploadDir, 'posters', 'thought-card-card-1-9x16.svg');

  afterEach(() => {
    rmSync(join(process.cwd(), uploadDir), { recursive: true, force: true });
  });

  it('generates a local 9:16 thought card SVG and public url', () => {
    const config = {
      get: jest.fn((key: string, fallback?: string) => {
        if (key === 'UPLOAD_LOCAL_DIR') return uploadDir;
        if (key === 'PUBLIC_BASE_URL') return 'http://localhost:3000';
        return fallback;
      }),
    } as any;
    const service = new PosterService(config);

    const url = service.generateThoughtCardPoster({
      id: 'card-1',
      title: '晨光手串',
      thought: '愿你向光而行，安住当下。',
      suitableFor: ['静心', '整理思绪'],
      solarTerm: '夏至',
    });

    expect(url).toBe('http://localhost:3000/uploads/posters/thought-card-card-1-9x16.svg');
    expect(existsSync(posterPath)).toBe(true);
    const svg = readFileSync(posterPath, 'utf8');
    expect(svg).toContain('width="1080" height="1920"');
    expect(svg).toContain('晨光手串');
    expect(svg).toContain('宜 · 静心');
  });
});
