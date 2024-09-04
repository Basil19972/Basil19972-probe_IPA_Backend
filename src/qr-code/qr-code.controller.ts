import { Body, Controller, Post, UseGuards, Request } from '@nestjs/common';
import { QrCodeService } from './qr-code.service';
import { JwtAuthGuard } from '../security/jwt.guard';
import { AbilitiesGuard } from '../security/abilities.guard';
import { CheckAbilities } from '../security/abilities.decorator';
import { Actions } from '../security/ability.factory';
import { QRCode } from './qr-code.schema';
import { QRCodeDTO } from './DTO/qr-code-DTO';
import { ApiTags } from '@nestjs/swagger';
import { GeneratedTokenDTO } from './DTO/generatedTokenDTO';
import { ReceiveTokenDto } from './DTO/receiveTokenDTO';
import { CustomerPointCardUpdateDto } from '../customer-point-card/DTO/CustomerPointCardUpdateDTO';

@Controller('qrcode')
@ApiTags('QR Code')
export class QrCodeController {
  constructor(private qrCodeService: QrCodeService) {}

  @Post('/generate')
  @UseGuards(JwtAuthGuard, AbilitiesGuard)
  @CheckAbilities({ action: Actions.CREATE, subject: QRCode })
  async generateQrCode(
    @Body() qRCodeDTO: QRCodeDTO,
    @Request() req,
  ): Promise<GeneratedTokenDTO> {
    const token = await this.qrCodeService.generateQrCode(qRCodeDTO, req.user);
    const generatedTokenDTO = new GeneratedTokenDTO();
    generatedTokenDTO.token = token;
    return generatedTokenDTO;
  }

  @Post('/receive')
  @UseGuards(JwtAuthGuard, AbilitiesGuard)
  @CheckAbilities({ action: Actions.READ, subject: QRCode })
  async decodeQrToken(
    @Request() req,
    @Body() receiveTokenDto: ReceiveTokenDto,
  ): Promise<CustomerPointCardUpdateDto> {
    const token = receiveTokenDto.token;

    const customerPointCardUpdateDto = this.qrCodeService.decodeQrToken(
      token,
      req.user.id,
    );
    return customerPointCardUpdateDto;
  }
}
