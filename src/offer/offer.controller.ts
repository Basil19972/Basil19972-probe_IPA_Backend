import { Controller, Post, UseGuards, Request, Body } from '@nestjs/common';
import { OfferService } from './offer.service';
import { CheckAbilities } from '../security/abilities.decorator';
import { AbilitiesGuard } from '../security/abilities.guard';
import { JwtAuthGuard } from '../security/jwt.guard';
import { Actions } from '../security/ability.factory';
import { Offer } from './offer.schema';
import { CreateOfferDto } from './DTO/createOfferDto';
import { OfferTokenDTO } from './DTO/offerTokenDTO';

@Controller('offer')
export class OfferController {
  constructor(private offerService: OfferService) {}

  @Post('create')
  @UseGuards(JwtAuthGuard, AbilitiesGuard)
  @CheckAbilities({ action: Actions.CREATE, subject: Offer })
  async createOffer(
    @Request() req,
    @Body() createOfferDto: CreateOfferDto,
  ): Promise<Offer> {
    return await this.offerService.createOffer(req.user, createOfferDto);
  }

  @Post('scan')
  @UseGuards(JwtAuthGuard, AbilitiesGuard)
  @CheckAbilities({ action: Actions.READ, subject: Offer })
  async scanOffer(
    @Request() req,
    @Body() offerTokenDTO: OfferTokenDTO,
  ): Promise<Offer> {
    return await this.offerService.scanOffer(req.user, offerTokenDTO.token);
  }
}
