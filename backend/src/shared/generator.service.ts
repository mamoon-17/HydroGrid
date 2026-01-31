import { Injectable } from '@nestjs/common';
import { v4 as uuid } from 'uuid';

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
}
