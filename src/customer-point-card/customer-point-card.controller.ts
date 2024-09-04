import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Request,
  UseGuards,
} from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { CheckAbilities } from '../security/abilities.decorator';
import { AbilitiesGuard } from '../security/abilities.guard';
import { Actions } from '../security/ability.factory';
import { JwtAuthGuard } from '../security/jwt.guard';
import { ScanTokenDTO } from './DTO/ScanTokenDTO';
import { CustomerPointCardDTO } from './customer-point-card-DTO';
import { CustomerPointCard } from './customer-point-card.schema';
import { CustomerPointCardService } from './customer-point-card.service';

@Controller('customer-point-card')
@ApiTags('Customer Point Card')
export class CustomerPointCardController {
  constructor(private customerPointCardService: CustomerPointCardService) {}

  @Post()
  @UseGuards(JwtAuthGuard, AbilitiesGuard)
  @CheckAbilities({ action: Actions.CREATE, subject: CustomerPointCard })
  async create(
    @Body() customerPointCardDTO: CustomerPointCardDTO,
    @Request() req,
  ) {
    return await this.customerPointCardService.create(
      customerPointCardDTO,
      req.user.id,
    );
  }

  @Get()
  @UseGuards(JwtAuthGuard, AbilitiesGuard)
  @CheckAbilities({ action: Actions.READ, subject: CustomerPointCard })
  async findAllByUser(@Request() req) {
    const { redeemed } = req.query;
    //DTO nicht vergessen
    return await this.customerPointCardService.findAllByUser(
      req.user.id,
      redeemed,
    );
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, AbilitiesGuard)
  @CheckAbilities({ action: Actions.DELETE, subject: CustomerPointCard })
  async delete(@Param('id') id: string) {
    return await this.customerPointCardService.deleteById(id);
  }

  @Post('redeem')
  @UseGuards(JwtAuthGuard, AbilitiesGuard)
  @CheckAbilities({ action: Actions.UPDATE, subject: CustomerPointCard })
  async scanToken(
    @Body() scanTokenDTO: ScanTokenDTO,
    @Request() req,
  ): Promise<CustomerPointCard> {
    return await this.customerPointCardService.decodePointsIsFullToken(
      scanTokenDTO.token,
      req.user.id,
    );
  }
}
