import { Controller, Post, Res, UseGuards } from '@nestjs/common';
import { RefreshTokenService } from './refresh-token.service';
import { JwtRefreshTokenGuard } from './JwtRefreshTokenGuard';
import { ApiTags } from '@nestjs/swagger';

@Controller('refresh-token')
@ApiTags('Refresh Token')
export class RefreshTokenController {
  constructor(private refreshTokenService: RefreshTokenService) {}

  @Post()
  @UseGuards(JwtRefreshTokenGuard)
  async createRefreshToken(@Res() response): Promise<any> {
    const userIdFromPayload = response.req.user.id;

    let currentRefreshToken = response.req.body?.refreshToken;

    // If it's not in the body, try to get it from the cookies
    if (!currentRefreshToken) {
      currentRefreshToken = response.req.cookies?.['refreshToken'];
    }

    const tokens = await this.refreshTokenService.generateAccessToken(
      userIdFromPayload,
      currentRefreshToken,
    );

    // Setze das Access-Token als Cookie
    response.cookie('accessToken', tokens.accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      expires: new Date(Date.now() + 1000 * 60 * 60 * 24 * 7), // 7 Tage
      path: '/',
      sameSite: 'lax',
    });

    // Setze das Refresh-Token als Cookie
    response.cookie('refreshToken', tokens.refreshToken, {
      httpOnly: true,
      expires: new Date(Date.now() + 1000 * 60 * 60 * 24 * 14), // 14 Tage
      secure: process.env.NODE_ENV === 'production',
      path: '/',
      sameSite: 'lax',
    });

    response.json(tokens);
  }
}
