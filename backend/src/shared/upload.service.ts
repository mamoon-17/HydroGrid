import { Injectable } from '@nestjs/common';
import { GeneratorService } from './generator.service';
import * as fs from 'fs';
import * as path from 'path';

export interface IFile {
  encoding: string;
  buffer: Buffer;
  fieldname: string;
  mimetype: string;
  originalname: string;
  size: number;
}

@Injectable()
export class UploadService {
  private readonly uploadsDir: string;

  constructor(private readonly generatorService: GeneratorService) {
    // Uploads directory at the root of the backend folder
    this.uploadsDir = path.join(process.cwd(), 'uploads');
    this.ensureUploadsDirExists();
  }

  private ensureUploadsDirExists(): void {
    if (!fs.existsSync(this.uploadsDir)) {
      fs.mkdirSync(this.uploadsDir, { recursive: true });
    }
  }

  /**
   * Returns the public URL path for accessing an uploaded file
   */
  getFileURL(filename: string): string {
    if (!filename) return '';
    // Return relative URL path that will be served statically
    return `/uploads/${filename}`;
  }

  /**
   * Upload a file to local disk storage
   */
  async uploadImage(
    file: IFile,
    oldFilename?: string,
    subPath = '',
  ): Promise<string> {
    if (!file.buffer || file.buffer.length === 0) {
      return '';
    }

    this.ensureUploadsDirExists();

    const fileExtension =
      file.originalname.split('.').length > 0
        ? file.originalname.split('.')[file.originalname.split('.').length - 1]
        : 'jpg';

    const filename = this.generatorService.fileName(fileExtension);

    // Delete old file if provided
    if (oldFilename) {
      await this.deleteImage(oldFilename);
    }

    // Create subdirectory if needed
    const targetDir = subPath
      ? path.join(this.uploadsDir, subPath)
      : this.uploadsDir;
    if (!fs.existsSync(targetDir)) {
      fs.mkdirSync(targetDir, { recursive: true });
    }

    const filePath = path.join(targetDir, filename);

    // Write file to disk
    await fs.promises.writeFile(filePath, file.buffer);

    // Return the relative path/filename for storage in DB
    const storedPath = subPath ? `${subPath}/${filename}` : filename;
    return this.getFileURL(storedPath);
  }

  /**
   * Delete a file from local disk storage
   */
  async deleteImage(filePathOrUrl: string): Promise<void> {
    if (!filePathOrUrl) return;

    try {
      // Extract filename from URL or path
      const filename = this.extractFilenameFromUrl(filePathOrUrl);
      const fullPath = path.join(this.uploadsDir, filename);

      if (fs.existsSync(fullPath)) {
        await fs.promises.unlink(fullPath);
      }
    } catch (error) {
      // Silently fail if file doesn't exist
      console.warn('Failed to delete file:', filePathOrUrl, error);
    }
  }

  /**
   * Extract filename from URL or path
   */
  private extractFilenameFromUrl(possibleUrl: string): string {
    try {
      // If it starts with /uploads/, strip that prefix
      if (possibleUrl.startsWith('/uploads/')) {
        return possibleUrl.slice('/uploads/'.length);
      }
      // If it's a full URL, parse and get pathname
      if (
        possibleUrl.startsWith('http://') ||
        possibleUrl.startsWith('https://')
      ) {
        const u = new URL(possibleUrl);
        const pathname = u.pathname.startsWith('/')
          ? u.pathname.slice(1)
          : u.pathname;
        // Remove 'uploads/' prefix if present
        return pathname.startsWith('uploads/')
          ? pathname.slice('uploads/'.length)
          : pathname;
      }
      return possibleUrl;
    } catch {
      return possibleUrl;
    }
  }
}
