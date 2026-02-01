import { Injectable } from '@nestjs/common';
import { v4 as uuid } from 'uuid';
import * as crypto from 'crypto';

@Injectable()
export class GeneratorService {
  public uuid(): string {
    return uuid();
  }

  public fileName(ext: string, fileName?: string): string {
    if (fileName) {
      return fileName + '.' + ext;
    }
    return this.uuid() + '.' + ext;
  }

  public generateRandomCode(length: number = 32): string {
    return crypto.randomBytes(length).toString('hex').slice(0, length);
  }

  public generateSlug(name: string): string {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');
  }
}
