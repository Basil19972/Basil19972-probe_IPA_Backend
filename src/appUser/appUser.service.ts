import { HttpService } from '@nestjs/axios';
import { Inject, Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectModel } from '@nestjs/mongoose';
import * as bcrypt from 'bcrypt';
import { Model, Types } from 'mongoose';
import { CompanyService } from '../company/company.service';
import { MailService } from '../mail/mail.service';
import { RefreshTokenService } from '../refresh-token/refresh-token.service';
import { AppUserDTO } from './DTO/AppUserDTO';
import { AppUser, StripeCustomer } from './appUser.schema';
import { UserRole } from './role.enum';

import { I18nContext, I18nService } from 'nestjs-i18n';
import { CompanyUIdAlreadyExistsException } from '../exceptions/company-UId-already-exists.exception';
import { CompanyNotFoundEmailException } from '../exceptions/company-not-found-email.exception';
import { CompanyNotFoundException } from '../exceptions/company-not-found.exception';
import { EmailAlreadyExistsException } from '../exceptions/email-already-exists.exception';
import { InvalidCredentialsException } from '../exceptions/invalid-credentials.exception';
import { InvalidTokenSignatureException } from '../exceptions/invalid-token-signature.exception';
import { UserCreationException } from '../exceptions/user-creation.exception';
import { UserNotFoundException } from '../exceptions/user-not-found.exception';
import { UserNotOwnerOfCompanyException } from '../exceptions/user-not-owner-of-company.exception';
import { AddEmployeesAppUserDTO } from './DTO/AddEmployeesAppUserDTO';
import { AppUserLoginDTO } from './DTO/AppUserLoginDTO';
import { AppUserUpdateDTO } from './DTO/app-user-update.dto';
import { ForgotPasswordMessageDTO } from './DTO/forgotPasswordMessageDTO';

import { resetPasswordTemplate } from '../mail/email-templates/reset-password.template';
import { invitationToCompanyTemplate } from '../mail/email-templates/company-invitation.template';
import { emailVerificationTemplate } from '../mail/email-templates/verification-email.template';

@Injectable()
export class AppUserService {
  //Dependecy Injections
  constructor(
    @InjectModel('AppUser') private readonly userModel: Model<AppUser>,
    @Inject('AUTH_JWT_SERVICE')
    private readonly jwtService: JwtService,
    @Inject('MAIL_JWT_SERVICE')
    private readonly mailJwtService: JwtService,
    private readonly refresgTokenService: RefreshTokenService,
    private readonly companyService: CompanyService,
    private readonly mailService: MailService,
    private readonly httpService: HttpService,
    private readonly i18n: I18nService,
  ) {}

  async register(appUserDTO: AppUserDTO): Promise<AppUserDTO> {
    // Überprüfen, ob die E-Mail bereits existiert
    const existingUser = await this.userModel.findOne({
      email: appUserDTO.email.toLowerCase(),
    });
    if (existingUser) {
      throw new EmailAlreadyExistsException(appUserDTO.email, this.i18n);
    }

    // Passwort hashen
    const hashedPassword = await bcrypt.hash(appUserDTO.password, 10);
    const user = new this.userModel({
      name: appUserDTO.name,
      email: appUserDTO.email.toLowerCase(),
      password: hashedPassword,
    });

    try {
      // check if company already exists

      // Unternehmen erstellen, wenn Daten vorhanden sind
      if (appUserDTO.company) {
        const isCompanyAlreadyExisting =
          await this.companyService.isCompanyExistByCompanyUId(
            appUserDTO.company.uId,
          );
        if (isCompanyAlreadyExisting) {
          throw new CompanyUIdAlreadyExistsException(
            appUserDTO.company.uId,
            this.i18n,
          );
        }

        const createdCompany = await this.companyService.create(
          appUserDTO.company,
          user._id,
        );
        user.company = createdCompany._id;
        user.roles = [UserRole.Owner];
        user.termsAccepted = appUserDTO.termsAccepted;
        user.emailVerified = false;
      }

      await user.save();
      if (process.env.TESTMODE !== 'true') {
        this.sendVerificationMail(user._id, user.email);
      }
      return appUserDTO;
    } catch (error) {
      if (error instanceof CompanyUIdAlreadyExistsException) {
        throw error;
      }
      console.log(error);
      throw new UserCreationException(this.i18n);
    }
  }

  async loginUser(appUserDTO: AppUserLoginDTO): Promise<any> {
    const user = await this.userModel.findOne({
      email: appUserDTO.email,
    });

    if (user && (await bcrypt.compare(appUserDTO.password, user.password))) {
      const payload = { sub: user._id, role: user.roles };
      return {
        accessToken: this.jwtService.sign(payload),

        refreshToken: await this.refresgTokenService.createRefreshToken(
          user._id,
        ),
      };
    }
    throw new InvalidCredentialsException(this.i18n);
  }

  async findById(id: string): Promise<AppUser> {
    return this.userModel.findById(id);
  }

  async logoutUser(refreshToken: string): Promise<any> {
    return await this.refresgTokenService.deleteRefreshTokenByToken(
      refreshToken,
    );
  }

  async updateUser(id: string, data: AppUserUpdateDTO): Promise<AppUser> {
    const user = await this.userModel.findById(id);

    if (!user) {
      throw new UserNotFoundException(id, this.i18n);
    }

    user.set(data);

    await user.save();
    return user;
  }

  async updateAppUserBusinessPointCard(
    userId: string,
    businessPointCardId: string,
  ): Promise<void> {
    const user = await this.userModel.findById(userId);
    if (!user) {
      throw new UserNotFoundException(userId, this.i18n);
    }
    const businessPointCardID = new Types.ObjectId(businessPointCardId);

    user.businessPointCards.push(businessPointCardID);
    await user.save();
  }

  async updateAppUserCustomerPointCard(
    userId: string,
    customerPointCardId: string,
  ): Promise<void> {
    const user = await this.userModel.findById(userId);
    if (!user) {
      throw new UserNotFoundException(userId, this.i18n);
    }
    const customerPointCardID = new Types.ObjectId(customerPointCardId);

    user.customerPointCards.push(customerPointCardID);
    await user.save();
  }

  async removeAllCustomerPointCardsFromUsers(
    customerPointCardIds: Types.ObjectId[],
  ): Promise<void> {
    await this.userModel.updateMany(
      {}, // Dieses leere Objekt bedeutet, dass die Änderung auf alle Dokumente in der Sammlung angewendet wird
      { $pullAll: { customerPointCards: customerPointCardIds } },
    );
  }

  async returnPrincipalUser(userId: string): Promise<AppUser> {
    const user = await this.findById(userId);
    if (!user) {
      throw new UserNotFoundException(userId, this.i18n);
    }
    return user;
  }

  async deleteById(id: Types.ObjectId): Promise<void> {
    await this.userModel.findByIdAndDelete(id);
  }

  async changePassword(userId: string, password: string, newPassword: string) {
    const user = await this.userModel.findById(userId);
    if (!user) {
      throw new UserNotFoundException(userId, this.i18n);
    }

    if (!(await bcrypt.compare(password, user.password))) {
      throw new InvalidCredentialsException(this.i18n);
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);
    await this.userModel.updateOne(
      { _id: new Types.ObjectId(userId) },
      { $set: { password: hashedPassword } },
    );
  }

  async forgotPassword(email: string): Promise<ForgotPasswordMessageDTO> {
    const user = await this.userModel.exists({ email: email });

    if (user) {
      await this.sendForgotPasswordEmail(email);
    }

    const message = this.i18n.translate(
      'events.emailMessages.forgot_password_mail_sent',
      {
        lang: I18nContext.current().lang,
      },
    );
    const forgotPasswordMessageDTO: ForgotPasswordMessageDTO = {
      message: message,
    };
    return forgotPasswordMessageDTO;
  }

  async sendForgotPasswordEmail(email: string): Promise<any> {
    const payload = {
      email: email,
    };

    const token = this.mailJwtService.sign(payload);

    const htmlContent = resetPasswordTemplate
      .replace(
        '${process.env.FRONTEND_BASE_URL}',
        process.env.FRONTEND_BASE_URL,
      )
      .replace('${token}', token);

    return await this.mailService.sendMail(
      payload.email,
      'Passwort zurücksetzen',
      '',
      htmlContent,
    );
  }

  async resetPassword(password: string, token: string): Promise<any> {
    //Exceptionhandling wird auch übernommen von verify
    await this.mailJwtService.verify(token);

    const decodedToken = this.mailJwtService.decode(token) as any;
    const userMail = decodedToken.email;

    // Passwort hashen
    const hashedPassword = await bcrypt.hash(password, 10);

    // Benutzer suchen und Passwort aktualisieren, wenn er existiert
    await this.userModel.updateOne(
      { email: userMail },
      { $set: { password: hashedPassword } },
    );

    // Sie können hier eine Bestätigungsnachricht oder ein ähnliches Ergebnis zurückgeben
    return { message: 'Password successfully reset' };
  }

  async addEmployeeToCompany(
    addEmployeesAppUserDTO: AddEmployeesAppUserDTO,
    companyOwnerUserId: string,
  ): Promise<AppUser> {
    // check if user is owner from company
    const company = await this.companyService.findCompanyById(
      addEmployeesAppUserDTO.companyId,
    );
    if (!company) {
      throw new CompanyNotFoundEmailException(
        addEmployeesAppUserDTO.companyId,
        this.i18n,
      );
    }
    const isOwner = company.ownerAppUserID.equals(companyOwnerUserId);

    if (!isOwner) {
      throw new UserNotOwnerOfCompanyException(
        companyOwnerUserId,
        addEmployeesAppUserDTO.companyId,
        this.i18n,
      );
    }

    const userExists = await this.checkIfUserExistsByEmail(
      addEmployeesAppUserDTO.email,
    );

    if (userExists) {
      throw new EmailAlreadyExistsException(
        addEmployeesAppUserDTO.email,
        this.i18n,
      );
    }

    const hashedPassword = await bcrypt.hash(
      addEmployeesAppUserDTO.password,
      10,
    );

    //user erstellen und speichern
    const newEmployee = { companyId: company._id, isVerified: false };

    const user = await this.userModel.create({
      email: addEmployeesAppUserDTO.email,
      password: hashedPassword,
      employee: [newEmployee],

      roles: [UserRole.Employee],
    });

    await this.companyService.addNewEmployee(company._id, user._id);
    if (process.env.TESTMODE !== 'true') {
      await this.sendAddEmployeeVerificationMail(
        user._id,
        user.email,
        company._id,
        company.companyName,
      );
    }

    return user;
  }

  async addEmployeeToCompanyByToken(token: string): Promise<AppUser> {
    if (!this.mailJwtService.verify(token)) {
      throw new InvalidTokenSignatureException(this.i18n);
    }

    // Dekodieren des Tokens und Typsicherheit gewährleisten
    const decodedToken: {
      companyId: string;
      userId: string;
      iat: number;
      exp: number;
    } = this.mailJwtService.decode(token) as any;

    // überprüfen, ob der Benutzer bereits employee ist

    const companyId = new Types.ObjectId(decodedToken.companyId);
    const userId = new Types.ObjectId(decodedToken.userId);

    const user = await this.userModel.findById(userId);
    if (user) {
      const employeeIndex = user.employee.findIndex((emp) =>
        emp.companyId.equals(companyId),
      );

      if (employeeIndex > -1) {
        user.employee[employeeIndex].isVerified = true;
        await user.save();
      }
    }

    const company = await this.companyService.findCompanyById(
      decodedToken.companyId,
    );

    if (process.env.TESTMODE !== 'true') {
      this.companyService.sendWelomeToCompanyEmail(
        user.email,
        company.companyName,
      );
    }
    return user;
  }

  async addUserAsEmployeeToCompany(): Promise<any> {
    return 'addUserAsEmployeeToCompany';
  }

  async checkIfUserExistsByEmail(email: string): Promise<boolean> {
    const user = await this.userModel.findOne({ email }).exec();
    return !!user;
  }

  async sendAddEmployeeVerificationMail(
    userId: string,
    email: string,
    companyId: string,
    companyName: string,
  ): Promise<any> {
    const payload = {
      companyId: companyId,
      userId: userId,
    };
    const token = this.mailJwtService.sign(payload);

    const htmlContent = invitationToCompanyTemplate
      .replace(
        '${process.env.FRONTEND_BASE_URL}',
        process.env.FRONTEND_BASE_URL,
      )
      .replace('${token}', token)
      .replace('${companyName}', companyName)
      .replace('${companyName}', companyName);

    return await this.mailService.sendMail(email, 'Einladung', '', htmlContent);
  }

  async sendVerificationMail(userId: string, email: string): Promise<any> {
    const payload = {
      userId: userId,
    };
    const token = this.mailJwtService.sign(payload);

    const htmlContent = emailVerificationTemplate
      .replace(
        '${process.env.FRONTEND_BASE_URL}',
        process.env.FRONTEND_BASE_URL,
      )
      .replace('${token}', token);

    return await this.mailService.sendMail(
      email,
      'Verifizieren Sie Ihre E-Mail-Adresse',
      '',
      htmlContent,
    );
  }

  async findAppUserByPointCardId(pointCardId: string): Promise<AppUser> {
    const user = await this.userModel.findOne({
      businessPointCards: new Types.ObjectId(pointCardId),
    });
    if (!user) {
      throw new UserNotFoundException(user._id, this.i18n);
    }

    return user;
  }

  async updateAppUserRoleByUserId(appUserId: string, role: UserRole) {
    await this.userModel.updateOne(
      { _id: new Types.ObjectId(appUserId) },
      { $set: { roles: [role] } },
    );
  }

  async deleteStripeCustomerFromUser(appUserId: string) {
    await this.userModel.updateOne(
      { _id: new Types.ObjectId(appUserId) },
      { $unset: { stripeCustomer: '' } },
    );
  }

  async addStripeCustomerToUser(
    stripeCustomer: StripeCustomer,
    appUserId: string,
  ) {
    await this.userModel.updateOne(
      { _id: new Types.ObjectId(appUserId) },
      { $push: { stripeCustomer: stripeCustomer } },
    );
  }

  async getUserByStripeCustomerId(stripeCustomerId: string): Promise<AppUser> {
    const user = await this.userModel.findOne({
      'stripeCustomer.stripeCustomerId': stripeCustomerId,
    });

    /*
    if (!user) {
      throw new UserNotFoundException(stripeCustomerId);
    }
    */

    return user;
  }

  async getAllUsersWithRoleDevInterface(role?: string): Promise<AppUser[]> {
    let query = {}; // Standardmäßig leer, um alle Benutzer zurückzugeben

    // Wenn eine Rolle spezifiziert ist, passe die Query an, um diese Rolle zu filtern
    if (role) {
      query = { roles: role };
    }

    // Führe die Abfrage mit den spezifizierten Bedingungen aus und schließe das Passwortfeld aus
    return await this.userModel.find(query, { password: 0 });
  }

  async getAllEmployeeByCompanyId(companyId: string): Promise<AppUser[]> {
    const company = await this.companyService.findCompanyById(companyId);
    if (!company) {
      throw new CompanyNotFoundException(companyId, this.i18n);
    }

    // finde unser by user Id from comoany.employee
    const employees = await this.userModel
      .find({
        _id: { $in: company.employeesAppUsersIds },
      })
      .select('-password');

    return employees;
  }

  async removeEmployee(
    ownerAppUser: AppUser,
    employeeId: string,
  ): Promise<void> {
    const company = await this.companyService.findCompanyById(
      ownerAppUser.company.toString(),
    );
    if (!company) {
      throw new CompanyNotFoundException(
        ownerAppUser.company.toString(),
        this.i18n,
      );
    }

    // Überprüfung, ob der Mitarbeiter existiert
    const employee = await this.userModel.findOne({
      _id: employeeId,
      'employee.companyId': company._id,
    });
    if (!employee) {
      // Wirf eine Ausnahme, wenn der Mitarbeiter nicht gefunden wird
      throw new UserNotFoundException(employeeId, this.i18n);
    }

    // Entfernen des Mitarbeiters aus der embedded relation im AppUser-Dokument
    await this.userModel.updateOne(
      { _id: employeeId },
      {
        $pull: { employee: { companyId: company._id } }, // Anpassung, um nach companyId zu filtern
        $set: { roles: [UserRole.User] }, // Setzt die Rolle des Benutzers auf 'User'
      },
    );

    // Entfernen des Mitarbeiters aus der Unternehmensmitarbeiterliste
    await this.companyService.removeEmployee(company._id, employeeId);
  }

  async verifyEmail(token: string): Promise<AppUser> {
    if (!this.mailJwtService.verify(token)) {
      throw new InvalidTokenSignatureException(this.i18n);
    }

    const decodedToken = this.mailJwtService.decode(token) as any;
    const userId = new Types.ObjectId(decodedToken.userId);

    const user = await this.userModel
      .findOneAndUpdate(
        { _id: userId },
        { $set: { emailVerified: true } },
        { new: true }, // Diese Option gibt das aktualisierte Dokument zurück
      )
      .select('-password'); // Attribute, die ausgeschlossen werden sollen

    return user;
  }

  async removeBusinessPointCardFromUserById(
    userId: string,
    pointCardId: string,
  ) {
    await this.userModel.updateOne(
      { _id: new Types.ObjectId(userId) },
      { $pull: { businessPointCards: new Types.ObjectId(pointCardId) } },
    );
  }

  async updateUserEmailById(
    userId: string,
    newEmail: string,
  ): Promise<AppUser> {
    // Check if the new email is already in use by another user
    const existingUser = await this.userModel.findOne({
      email: newEmail,
      _id: { $ne: userId },
    });

    if (existingUser) {
      throw new EmailAlreadyExistsException(newEmail, this.i18n);
    }

    // Update the user's email and mark it as not verified
    const updatedUser = await this.userModel
      .findOneAndUpdate(
        { _id: new Types.ObjectId(userId) },
        { $set: { email: newEmail, emailVerified: false } },
        { new: true },
      )
      .select('-password');

    // Send verification email if not in test mode
    if (process.env.TESTMODE !== 'true' && updatedUser) {
      this.sendVerificationMail(updatedUser._id, updatedUser.email);
    }

    return updatedUser;
  }

  async setUserAsDeleted(userId: string): Promise<void> {
    await this.userModel.updateOne(
      { _id: new Types.ObjectId(userId) },
      { $set: { email: 'deleted', name: 'deleted' } },
    );
  }

  async deleteEmployeesByCompanyIds(
    companyIds: Types.ObjectId[],
  ): Promise<void> {
    await this.userModel.deleteMany({
      'employee.companyId': { $in: companyIds },
    });
  }
}
