import { Module, Global } from '@nestjs/common';
import { UploadService } from './upload.service';
import { GlobalConfigModule } from 'src/config/global-config.module';
import { GeneratorService } from './generator.service';

@Global()
@Module({
  exports: [UploadService, GeneratorService],
  imports: [GlobalConfigModule],
  providers: [UploadService, GeneratorService],
})
export class SharedModule {}
