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
import AWS from 'aws-sdk';
import mime from 'mime-types';

import { GlobalConfigService } from '../config/global-config.service';
import { GeneratorService } from './generator.service';

@Injectable()
export class AwsService {
  private readonly S3: AWS.S3;

  constructor(
    private readonly apiConfigService: GlobalConfigService,
    private readonly generatorService: GeneratorService,
  ) {
    const awsConfig = this.apiConfigService.awsConfigForS3;

    AWS.config.update({
      s3: {
        credentials: {
          accessKeyId: awsConfig.accessKey,
          secretAccessKey: awsConfig.secretKey,
        },
      },
    });

    this.S3 = new AWS.S3();
  }

  async uploadImage(
    file: IFile,
    oldKey?: string,
    path = '',
    fileName?: string,
  ) {
    if (!file.buffer || file.buffer.length === 0) {
      return '';
    }

    const gfileName = this.generatorService.fileName(
      <string>mime.extension(file.mimetype),
      fileName,
    );

    if (oldKey) {
      await this.deleteImage(oldKey);
    }

    const key = 'images/' + path + gfileName;

    await this.S3.putObject({
      Bucket: this.apiConfigService.awsConfigForS3.bucketName,
      Body: file.buffer,
      ACL: 'public-read',
      Key: key,
    }).promise();

    return key;
  }

  // eslint-disable-next-line @typescript-eslint/require-await
  async deleteImage(key: string): Promise<unknown> {
    return this.S3.deleteObject({
      Bucket: this.apiConfigService.awsConfigForS3.bucketName,
      Key: key,
    }).promise();
  }
}
