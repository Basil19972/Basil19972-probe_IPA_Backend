import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Post,
  Put,
  Query,
  Request,
  Res,
  UseGuards,
} from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { Response } from 'express';
import { CheckAbilities } from '../security/abilities.decorator';
import { AbilitiesGuard } from '../security/abilities.guard';
import { Actions } from '../security/ability.factory';
import { JwtAuthGuard } from '../security/jwt.guard';
import { AddEmployeeViaTokenDTO } from './DTO/AddEmployeeViaTokenDTO';
import { AddEmployeesAppUserDTO } from './DTO/AddEmployeesAppUserDTO';
import { AppUserDTO } from './DTO/AppUserDTO';
import { AppUserLoginDTO } from './DTO/AppUserLoginDTO';
import { NewPasswordDTO } from './DTO/NewPasswordDTO';
import { PasswordForgotDTO } from './DTO/PasswordForgotDTO';
import { ChangePasswordDTO } from './DTO/change-password.dto';
import { ForgotPasswordMessageDTO } from './DTO/forgotPasswordMessageDTO';
import { User } from './appUser.decorator';
import { AppUser } from './appUser.schema';
import { AppUserService } from './appUser.service';
import { AppUserUpdateDTO } from './DTO/app-user-update.dto';
import { plainToDTO } from '../utils/dto.util';
import { AppUserPrincipalDTO } from './DTO/AppUserPrincipalDTO';
import { VerifyMailViaTokenDTO } from './DTO/VerifyMailViaTokenDTO';
import { UpdateEmailDTO } from './DTO/updateEmailDTO';

@Controller('auth')
@ApiTags('Authentication')
export class AppUserController {
  constructor(private appUserService: AppUserService) {}

  @Post('register')
  async registerUser(@Body() appUserDTO: AppUserDTO) {
    return this.appUserService.register(appUserDTO);
  }

  @Post('login')
  async loginUser(
    @Body() appUserLoginDTO: AppUserLoginDTO,
    @Res({ passthrough: true }) res: Response,
  ) {
    const tokens = await this.appUserService.loginUser(appUserLoginDTO);

    // Setze das Access-Token als Cookie
    res.cookie('accessToken', tokens.accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      expires: new Date(Date.now() + 1000 * 60 * 60 * 24 * 7), // 7 Tage
      path: '/',
      sameSite: 'lax',
    });

    // Setze das Refresh-Token als Cookie
    res.cookie('refreshToken', tokens.refreshToken, {
      httpOnly: true,
      expires: new Date(Date.now() + 1000 * 60 * 60 * 24 * 14), // 14 Tage
      secure: process.env.NODE_ENV === 'production',
      path: '/',
      sameSite: 'lax',
    });
    return tokens;
  }

  @Put()
  @UseGuards(JwtAuthGuard, AbilitiesGuard)
  @CheckAbilities({ action: Actions.UPDATE, subject: AppUser })
  async updateUser(@Body() data: AppUserUpdateDTO, @User() user: AppUser) {
    const newUser = await this.appUserService.updateUser(user.id, data);

    return plainToDTO(AppUserPrincipalDTO, newUser);
  }

  @Post('logout')
  @UseGuards(JwtAuthGuard, AbilitiesGuard)
  @CheckAbilities({ action: Actions.READ, subject: AppUser })
  async logoutUser(@Request() req, @Res({ passthrough: true }) res: Response) {
    // Logik zum Deaktivieren der Authentifizierung auf dem Server
    await this.appUserService.logoutUser(req.cookies['refreshToken']);

    // Löschen des Access-Tokens
    res.cookie('accessToken', '', {
      httpOnly: true,
      expires: new Date(0),
      path: '/',
      sameSite: 'lax',
    });

    // Löschen des Refresh-Tokens
    res.cookie('refreshToken', '', {
      httpOnly: true,
      expires: new Date(0),
      path: '/',
      sameSite: 'lax',
    });

    // Sie können eine Bestätigungsnachricht oder einen Statuscode senden
    return { message: 'Logout erfolgreich' };
  }

  @Get('principal')
  @UseGuards(JwtAuthGuard, AbilitiesGuard)
  @CheckAbilities({ action: Actions.READ, subject: AppUser })
  async getUserPrincipal(@Request() req): Promise<AppUser> {
    const user = await this.appUserService.returnPrincipalUser(req.user.id);
    user.password = '';
    return user;
  }

  @Put('password')
  @HttpCode(HttpStatus.NO_CONTENT)
  @UseGuards(JwtAuthGuard, AbilitiesGuard)
  @CheckAbilities({ action: Actions.UPDATE, subject: AppUser })
  async changePassword(@Body() data: ChangePasswordDTO, @User() user: AppUser) {
    await this.appUserService.changePassword(
      user.id,
      data.password,
      data.newPassword,
    );
  }

  @Post('forgotPassword')
  async forgotPassword(
    @Body() passwordForgotDTO: PasswordForgotDTO,
  ): Promise<ForgotPasswordMessageDTO> {
    return this.appUserService.forgotPassword(passwordForgotDTO.email);
  }

  @Post('resetPassword')
  async resetPassword(@Body() newpasswordDTO: NewPasswordDTO) {
    return this.appUserService.resetPassword(
      newpasswordDTO.password,
      newpasswordDTO.token,
    );
  }

  @Delete('removeEmployee')
  @UseGuards(JwtAuthGuard, AbilitiesGuard)
  @CheckAbilities({ action: Actions.DELETE, subject: 'employees' })
  async removeEmployee(
    @Request() req,
    @Query('employeeId') employeeId: string,
  ) {
    await this.appUserService.removeEmployee(req.user, employeeId);
  }

  @Post('addEmployee')
  @UseGuards(JwtAuthGuard, AbilitiesGuard)
  @CheckAbilities({ action: Actions.CREATE, subject: 'employees' })
  async addEmployee(
    @Request() req,
    @Body() addEmployeesAppUserDTO: AddEmployeesAppUserDTO,
  ): Promise<AppUser> {
    const user = await this.appUserService.addEmployeeToCompany(
      addEmployeesAppUserDTO,
      req.user.id,
    );
    user.password = '';
    return user;
  }

  @Post('addEmployeeViaToken')
  async addEmployeeViaToken(
    @Body() addEmployeeViaToken: AddEmployeeViaTokenDTO,
  ): Promise<AppUser> {
    const user = await this.appUserService.addEmployeeToCompanyByToken(
      addEmployeeViaToken.token,
    );
    user.password = '';
    return user;
  }

  @Post('verifyMailViaToken')
  async verifyMailViaToken(
    @Body() verifyMailViaTokenDTO: VerifyMailViaTokenDTO,
  ): Promise<AppUser> {
    const user = await this.appUserService.verifyEmail(
      verifyMailViaTokenDTO.token,
    );
    return user;
  }

  @Get('employees')
  @UseGuards(JwtAuthGuard, AbilitiesGuard)
  @CheckAbilities({ action: Actions.READ, subject: 'employees' })
  async getAllEmployee(@Request() req): Promise<AppUser[]> {
    const employees = await this.appUserService.getAllEmployeeByCompanyId(
      req.user.company,
    );
    return employees;
  }

  @Get('sendVerificationMail')
  @UseGuards(JwtAuthGuard, AbilitiesGuard)
  @CheckAbilities({ action: Actions.READ, subject: AppUser })
  async sendVerificationMail(@Request() req): Promise<AppUser> {
    const user = await this.appUserService.sendVerificationMail(
      req.user.id,
      req.user.email,
    );
    return user;
  }

  @Put('updateUserEmail')
  @UseGuards(JwtAuthGuard, AbilitiesGuard)
  @CheckAbilities({ action: Actions.UPDATE, subject: AppUser })
  async updateUserEmail(
    @User() user: AppUser,
    @Body() data: UpdateEmailDTO,
  ): Promise<AppUser> {
    const appUser = await this.appUserService.updateUserEmailById(
      user.id,
      data.email,
    );
    return appUser;
  }
}
