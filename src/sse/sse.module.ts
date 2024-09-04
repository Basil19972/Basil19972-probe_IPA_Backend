import { Module } from '@nestjs/common';
import { AppUserModule } from '../appUser/appUser.module';
import { SseService } from './sse.service';
import { SseController } from './sse.controller';

@Module({
  imports: [AppUserModule],
  providers: [SseService],
  exports: [SseService],
  controllers: [SseController],
})
export class SseModule {}
