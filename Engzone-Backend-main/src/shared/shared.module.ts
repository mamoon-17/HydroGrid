import { Module, Global } from '@nestjs/common';
import { AwsService } from './aws.service';

@Global()
@Module({
  exports: [AwsService],
})
export class SharedModule {}
