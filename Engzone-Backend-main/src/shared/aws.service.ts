/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
export interface IFile {
  encoding: string;
  buffer: Buffer;
  fieldname: string;
  mimetype: string;
  originalname: string;
  size: number;
}

import { Injectable } from '@nestjs/common';
const AWS = require('aws-sdk');
import mime from 'mime-types';
import { GeneratorService } from './generator.service';

@Injectable()
export class AwsService {
  private readonly S3: any;

  constructor(private readonly generatorService: GeneratorService) {
    // Check if required environment variables are set
    if (!process.env.AWS_S3_ACCESS_KEY || !process.env.AWS_S3_SECRET_KEY) {
      throw new Error('AWS S3 credentials not found in environment variables');
    }

    AWS.config.update({
      accessKeyId: process.env.AWS_S3_ACCESS_KEY,
      secretAccessKey: process.env.AWS_S3_SECRET_KEY,
      region: process.env.AWS_S3_REGION || 'me-south-1',
    });

    this.S3 = new AWS.S3();
  }

  getS3URL = (url: string | undefined): string =>
    url
      ? `https://${process.env.AWS_S3_BUCKET_NAME}.s3.${process.env.AWS_S3_BUCKET_REGION}.amazonaws.com/${url}`
      : '';

  async uploadImage(
    file: IFile,
    oldKey?: string,
    path = '',
    fileName?: string,
  ) {
    if (!file.buffer || file.buffer.length === 0) {
      return '';
    }

    if (!process.env.AWS_S3_BUCKET_NAME) {
      throw new Error('AWS S3 bucket name not found in environment variables');
    }

    const fileExtension =
      file.originalname.split('.').length > 0
        ? file.originalname.split('.')[file.originalname.split('.').length - 1]
        : 'jpg';

    const gfileName = this.generatorService.fileName(fileExtension, fileName);

    if (oldKey) {
      await this.deleteImage(oldKey);
    }

    const key = 'images/' + path + gfileName;

    await this.S3.putObject({
      Bucket: process.env.AWS_S3_BUCKET_NAME,
      Body: file.buffer,
      ACL: 'public-read',
      Key: key,
    }).promise();

    return this.getS3URL(key);
  }

  // eslint-disable-next-line @typescript-eslint/require-await
  async deleteImage(key: string): Promise<unknown> {
    if (!process.env.AWS_S3_BUCKET_NAME) {
      throw new Error('AWS S3 bucket name not found in environment variables');
    }

    return this.S3.deleteObject({
      Bucket: process.env.AWS_S3_BUCKET_NAME,
      Key: key,
    }).promise();
  }
}
