import { mkdirSync, writeFileSync } from 'fs';
import { join } from 'path';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

export interface ThoughtPosterInput {
  id: string;
  solarTerm?: string;
  suitableFor: string[];
  thought: string;
  title: string;
}

@Injectable()
export class PosterService {
  constructor(private readonly config: ConfigService) {}

  generateThoughtCardPoster(input: ThoughtPosterInput) {
    const uploadDir = this.config.get<string>('UPLOAD_LOCAL_DIR', 'uploads');
    const publicBaseUrl = this.config.get<string>('PUBLIC_BASE_URL', 'http://localhost:3000');
    const posterDir = join(process.cwd(), uploadDir, 'posters');
    mkdirSync(posterDir, { recursive: true });

    const filename = `thought-card-${input.id}-9x16.svg`;
    const filepath = join(posterDir, filename);
    const svg = this.renderSvg(input);
    writeFileSync(filepath, svg, 'utf8');
    return `${publicBaseUrl}/uploads/posters/${filename}`;
  }

  private renderSvg(input: ThoughtPosterInput) {
    const title = this.escape(input.title).slice(0, 48);
    const thoughtLines = this.wrapText(input.thought, 16, 8).map((line) => this.escape(line));
    const suitable = input.suitableFor.slice(0, 4).map((item) => this.escape(item));
    const solarTerm = this.escape(input.solarTerm || '一念一串');
    const thoughtTspans = thoughtLines
      .map((line, index) => `<tspan x="140" y="${710 + index * 64}">${line}</tspan>`)
      .join('');
    const suitableNodes = suitable
      .map((item, index) => {
        const x = 140 + (index % 2) * 360;
        const y = 1280 + Math.floor(index / 2) * 96;
        return `<g><rect x="${x}" y="${y}" width="300" height="58" rx="29" fill="rgba(255,255,255,0.28)" stroke="rgba(255,255,255,0.48)"/><text x="${x + 34}" y="${y + 38}" font-size="28" fill="#fff7e8">宜 · ${item}</text></g>`;
      })
      .join('');

    return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="1080" height="1920" viewBox="0 0 1080 1920">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#2b2118"/>
      <stop offset="48%" stop-color="#8a6f4d"/>
      <stop offset="100%" stop-color="#f0d8b2"/>
    </linearGradient>
    <radialGradient id="moon" cx="50%" cy="50%" r="50%">
      <stop offset="0%" stop-color="#fff8df" stop-opacity="0.95"/>
      <stop offset="100%" stop-color="#fff8df" stop-opacity="0"/>
    </radialGradient>
    <filter id="shadow" x="-20%" y="-20%" width="140%" height="140%">
      <feDropShadow dx="0" dy="24" stdDeviation="28" flood-color="#2b2118" flood-opacity="0.28"/>
    </filter>
  </defs>
  <rect width="1080" height="1920" fill="url(#bg)"/>
  <circle cx="820" cy="260" r="250" fill="url(#moon)"/>
  <circle cx="170" cy="1580" r="340" fill="#fff6df" opacity="0.08"/>
  <path d="M80 260 C260 130 430 310 610 180 S950 160 1000 330" fill="none" stroke="#fff4da" stroke-opacity="0.22" stroke-width="3"/>
  <g filter="url(#shadow)">
    <rect x="88" y="184" width="904" height="1552" rx="64" fill="rgba(48,35,25,0.34)" stroke="rgba(255,250,232,0.34)"/>
  </g>
  <text x="140" y="310" font-size="28" letter-spacing="8" fill="#f8e7c7" opacity="0.78">YI NIAN YI CHUAN</text>
  <text x="140" y="430" font-size="58" font-weight="700" fill="#fff8e6">${title}</text>
  <line x1="140" y1="510" x2="940" y2="510" stroke="#fff4da" stroke-opacity="0.34"/>
  <text x="140" y="610" font-size="30" fill="#ffeecb" opacity="0.78">今日之念</text>
  <text font-size="42" font-weight="500" fill="#fffaf0">${thoughtTspans}</text>
  <text x="140" y="1210" font-size="30" fill="#ffeecb" opacity="0.78">${solarTerm} · 宜</text>
  ${suitableNodes}
  <text x="140" y="1580" font-size="26" fill="#fff4da" opacity="0.62">愿每一次抬手，都看见自己心里的光。</text>
  <text x="140" y="1660" font-size="24" fill="#fff4da" opacity="0.48">小程序 · 一念一串</text>
</svg>`;
  }

  private wrapText(text: string, lineLength: number, maxLines: number) {
    const chars = [...text.replace(/\s+/g, '')];
    const lines: string[] = [];
    for (let index = 0; index < chars.length && lines.length < maxLines; index += lineLength) {
      lines.push(chars.slice(index, index + lineLength).join(''));
    }
    return lines.length ? lines : ['愿你在当下安住，向光而行。'];
  }

  private escape(value: string) {
    return value.replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;').replaceAll('"', '&quot;');
  }
}
