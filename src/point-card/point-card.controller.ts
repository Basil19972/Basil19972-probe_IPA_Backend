import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Put,
  Query,
  Request,
  UseGuards,
} from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { UserRole } from '../appUser/role.enum';
import { User } from '../appUser/appUser.decorator';
import { AppUser } from '../appUser/appUser.schema';
import { CheckAbilities } from '../security/abilities.decorator';
import { AbilitiesGuard } from '../security/abilities.guard';
import { Actions } from '../security/ability.factory';
import { JwtAuthGuard } from '../security/jwt.guard';
import { BusinessPointCardDto } from './DTO/BusinessPointCardDto';
import { BusinessPointCardUpdateDTO } from './DTO/BusinessPointCardUpdateDTO';
import { BusinessPointCard } from './point-Crad.schema';
import { PointCardService } from './point-card.service';

@Controller('business-point-card')
@ApiTags('Business Point Card')
export class PointCardController {
  constructor(private pointCardService: PointCardService) {}

  @Get('company')
  @UseGuards(JwtAuthGuard, AbilitiesGuard)
  @CheckAbilities({ action: Actions.READ, subject: BusinessPointCard })
  async findAllbyUserCompany(
    @User() user: AppUser,
  ): Promise<BusinessPointCard[]> {
    const companyId = user.roles.includes(UserRole.Employee)
      ? user.employee[0].companyId.toString()
      : user.company.toString();

    return this.pointCardService.findAllbyUserCompany(companyId);
  }

  @Get()
  @UseGuards(JwtAuthGuard, AbilitiesGuard)
  @CheckAbilities({ action: Actions.READ, subject: BusinessPointCard })
  async findAllbyUser(@Request() req): Promise<BusinessPointCard[]> {
    return this.pointCardService.findAllByUser(req.user.id);
  }

  // Create PointCard only for Admins
  @Post()
  @UseGuards(JwtAuthGuard, AbilitiesGuard)
  @CheckAbilities({ action: Actions.CREATE, subject: BusinessPointCard })
  async create(
    @Body() pointCardDto: BusinessPointCardDto,
    @Request() req,
    @User() user: AppUser,
  ): Promise<BusinessPointCardDto> {
    return this.pointCardService.create(pointCardDto, user);
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard, AbilitiesGuard)
  @CheckAbilities({ action: Actions.READ, subject: BusinessPointCard })
  async findOne(@Param('id') id: string): Promise<BusinessPointCard> {
    return this.pointCardService.findOne(id);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, AbilitiesGuard)
  @CheckAbilities({ action: Actions.DELETE, subject: BusinessPointCard })
  async delete(@Param('id') id: string, @Request() req): Promise<void> {
    return this.pointCardService.delete(req.user, id);
  }

  @Put()
  @UseGuards(JwtAuthGuard, AbilitiesGuard)
  @CheckAbilities({ action: Actions.DELETE, subject: BusinessPointCard })
  async updatePointCard(
    @Body() pointCardDto: BusinessPointCardUpdateDTO,
    @Request() req,
    @Query('pointCardId') pointCradId: string,
  ): Promise<BusinessPointCard> {
    return this.pointCardService.updatePointCard(
      pointCardDto,
      req.user,
      pointCradId,
    );
  }
}
