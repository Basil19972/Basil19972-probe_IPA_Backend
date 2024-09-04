import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Put,
  Query,
  Request,
  Res,
  UploadedFile,
  UseGuards,
  UseInterceptors,
  ValidationPipe,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiTags } from '@nestjs/swagger';
import { Response } from 'express';
import { I18nService } from 'nestjs-i18n';
import { CompanyLogoInvalidSvgException } from '../exceptions/company-logo-invalide-SVG-logo.exception';
import { CheckAbilities } from '../security/abilities.decorator';
import { AbilitiesGuard } from '../security/abilities.guard';
import { Actions } from '../security/ability.factory';
import { JwtAuthGuard } from '../security/jwt.guard';
import { GetCompaniesInRadiusDto } from '././DTO/getCompaniesInRadiusDTO';
import { CompanyService } from './company.service';
import { Company } from './compnay.schema';
import { CompanyPublicDto } from './DTO/companyPublicDTO';
import { CompanyUpdateDTO } from './DTO/companyUpdateDTO';
import { GetCompaniesNearByDto } from './DTO/getCompaniesNearByDTO';

@Controller('company')
@ApiTags('Company')
export class CompanyController {
  constructor(
    private companyService: CompanyService,
    private readonly i18n: I18nService,
  ) {}

  @Get('companiesInRadius')
  @UseGuards(JwtAuthGuard, AbilitiesGuard)
  @CheckAbilities({ action: Actions.READ, subject: Company })
  async getCompaniesInRadius(
    @Query() params: GetCompaniesInRadiusDto,
  ): Promise<Company[]> {
    const companies = await this.companyService.getCompanyAroundPointByRadius(
      params.longitude,
      params.latitude,
      params.radius,
    );
    return companies;
  }
  @Post('uploadCompanyLogo')
  @UseGuards(JwtAuthGuard, AbilitiesGuard)
  @CheckAbilities({ action: Actions.UPDATE, subject: Company })
  @UseInterceptors(FileInterceptor('file'))
  async uploadCompanyLogo(
    @Request() req,
    @UploadedFile() file: Express.Multer.File,
  ) {
    const companyId = req.user.company;
    if (!file || file.mimetype !== 'image/svg+xml') {
      throw new CompanyLogoInvalidSvgException(this.i18n);
    }

    return await this.companyService.uploadSVGLogo(
      companyId,
      file.buffer.toString(),
    );
  }

  @UseGuards(JwtAuthGuard, AbilitiesGuard)
  @CheckAbilities({ action: Actions.READ, subject: Company })
  @Get('nearest')
  async findNearestPaginated(
    @Query(new ValidationPipe({ transform: true }))
    params: GetCompaniesNearByDto,
  ): Promise<Company[]> {
    return this.companyService.findNearestPaginated(
      params.longitude,
      params.latitude,
      params.page,
      params.pageSize,
    );
  }

  @Put()
  @UseGuards(JwtAuthGuard, AbilitiesGuard)
  @CheckAbilities({ action: Actions.UPDATE, subject: Company })
  async updateCompany(
    @Query('companyId') companyId: string,
    @Body() updateCompanyDto: CompanyUpdateDTO,
    @Request() req,
  ): Promise<Company> {
    return this.companyService.updateCompany(
      companyId,
      updateCompanyDto,
      req.user,
    );
  }

  @Get('own')
  @UseGuards(JwtAuthGuard, AbilitiesGuard)
  @CheckAbilities({ action: Actions.READ, subject: Company })
  async getCompnayById(@Request() req): Promise<Company> {
    return this.companyService.getCompanyById(req.user.company);
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard, AbilitiesGuard)
  @CheckAbilities({ action: Actions.READ, subject: Company })
  async getCompnayByIdPublic(
    @Param('id') companyId: string,
  ): Promise<CompanyPublicDto> {
    return this.companyService.getCompanyByIdPublic(companyId);
  }

  @Get('address/:query')
  async getAddress(@Param('query') query: string): Promise<any> {
    return this.companyService.searchAddress(query);
  }

  @Get(':id/logo.png')
  async getPngLogo(
    @Param('id') companyId: string,
    @Res() res: Response,
  ): Promise<any> {
    const pngBuffer = await this.companyService.getPngLogo(companyId);
    res.setHeader('Content-Type', 'image/png');
    res.send(pngBuffer);
  }
}
