import { Module, Global } from '@nestjs/common';
import { AwsService } from './aws.service';
import { GlobalConfigModule } from 'src/config/global-config.module';
import { GeneratorService } from './generator.service';

@Global()
@Module({
  exports: [AwsService],
  imports: [GlobalConfigModule],
  providers: [AwsService, GeneratorService],
})
export class SharedModule {}
