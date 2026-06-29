import { Injectable } from '@nestjs/common';
import { randomInt } from 'crypto';

@Injectable()
export class CodeGeneratorService {
  private readonly alphabet = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ';

  orderNo(prefix = 'YN') {
    const now = new Date();
    const date = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}`;
    return `${prefix}${date}${this.randomCode(10)}`;
  }

  private randomCode(length: number) {
    return Array.from({ length }, () => this.alphabet[randomInt(this.alphabet.length)]).join('');
  }
}
