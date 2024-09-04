import { Module, forwardRef } from '@nestjs/common';
import { DevInterfaceControllerController } from './dev-interface-controller.controller';
import { DevInterfaceService } from './dev-interface.service';
import { AppUserModule } from '../appUser/appUser.module';

@Module({
  imports: [forwardRef(() => AppUserModule)],
  controllers: [DevInterfaceControllerController],
  providers: [DevInterfaceService],
})
export class DevInterfaceModule {}
