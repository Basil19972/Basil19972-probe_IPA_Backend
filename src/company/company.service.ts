import { HttpService } from '@nestjs/axios';
import { Injectable, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectModel } from '@nestjs/mongoose';
import { AxiosResponse } from 'axios';
import * as DOMPurify from 'dompurify';
import { JSDOM } from 'jsdom';
import { Model, Types } from 'mongoose';
import { I18nService } from 'nestjs-i18n';
import { firstValueFrom } from 'rxjs';
import * as sharp from 'sharp';
import { AppUser } from '../appUser/appUser.schema';
import { CompanyNotFoundException } from '../exceptions/company-not-found.exception';
import { UserNotOwnerOfCompanyException } from '../exceptions/user-not-owner-of-company.exception';
import { MailService } from '../mail/mail.service';
import { CompanyPublicDto } from './DTO/companyPublicDTO';
import { CompanyRegisterDTO } from './DTO/companyRegisterDTO';
import { CompanyUpdateDTO } from './DTO/companyUpdateDTO';
import { Company } from './compnay.schema';
import { Industries } from './industry.enum';

import { welcomeToCompanyTemplate } from '../mail/email-templates/welcome-to-company.template';
import { BusinessPointCard } from '../point-card/point-Crad.schema';

@Injectable()
export class CompanyService {
  constructor(
    @InjectModel('Company') private companyModel: Model<Company>,
    private readonly mailService: MailService,
    private readonly i18n: I18nService,
    private readonly httpService: HttpService,
    private configService: ConfigService,
  ) {}

  async create(
    createCompanyDto: CompanyRegisterDTO,
    ownerAppUserID: string,
  ): Promise<Company> {
    // Hierarchie basierend auf der Subbranche finden

    // Ergänzen Sie die fehlenden GICS-Daten
    const parentIndustry = this.getParentIndustry(createCompanyDto.subIndustry);

    // Erstellen einer neuen Company-Instanz
    const createdCompany = new this.companyModel({
      ...createCompanyDto,
      ownerAppUserID: new Types.ObjectId(ownerAppUserID),
      industryDetails: {
        parentIndustry: parentIndustry,
        childIndustry: createCompanyDto.subIndustry,
      },
    });

    return createdCompany.save();
  }

  getParentIndustry(childIndustry: string): string | undefined {
    for (const [parent, children] of Object.entries(Industries)) {
      if (Object.values(children).includes(childIndustry)) {
        return parent;
      }
    }
  }

  async addNewEmployee(companyId: string, userId: string): Promise<any> {
    const employeeId = new Types.ObjectId(userId);
    const companyID = new Types.ObjectId(companyId);

    // Fügen Sie die employeeId hinzu, da sie nicht existiert
    const updateResult = await this.companyModel.findOneAndUpdate(
      { _id: companyID },
      { $push: { employeesAppUsersIds: employeeId } },
      { new: true, returnDocument: 'after' }, // This will return the updated document
    );

    return updateResult;
  }

  async findCompanyById(companyId: string): Promise<Company> {
    const companyID = new Types.ObjectId(companyId);

    return this.companyModel.findOne({ _id: companyID });
  }

  async sendWelomeToCompanyEmail(
    userEmail: string,
    companyName: string,
  ): Promise<void> {
    const htmlContent = welcomeToCompanyTemplate
      .replace(
        '${process.env.FRONTEND_BASE_URL}',
        process.env.FRONTEND_BASE_URL,
      )
      .replace('${companyName}', companyName)
      .replace('${companyName}', companyName);

    return await this.mailService.sendMail(
      userEmail,
      'Bestätigung',
      '',
      htmlContent,
    );
  }

  async deleteById(companyID: Types.ObjectId): Promise<void> {
    await this.companyModel.findByIdAndDelete(companyID);
  }

  async isCompanyExistByCompanyUId(companyUId: string): Promise<boolean> {
    if (!companyUId) {
      return false; // Frühzeitig zurückkehren, wenn keine gültige UID vorhanden ist oder undefined ist
    }
    const result = await this.companyModel.exists({ uId: companyUId });
    return !!result; // Konvertiert das Ergebnis in einen boolean
  }

  async getCompanyAroundPointByRadius(
    longitude: number,
    latitude: number,
    radius: number,
  ): Promise<Company[]> {
    const radiusInMeters = radius * 1000;

    const companies = await this.companyModel.find({
      location: {
        $near: {
          $geometry: {
            type: 'Point',
            coordinates: [longitude, latitude],
          },
          $maxDistance: radiusInMeters,
        },
      },
    });

    return companies;
  }

  async uploadSVGLogo(companyId: string, svgLogo: string): Promise<any> {
    const window = new JSDOM('').window;
    const purify = DOMPurify(window); // Erstellen Sie eine Instanz von DOMPurify
    const cleanSVG = purify.sanitize(svgLogo, {
      USE_PROFILES: { svg: true },
    });

    // Entfernen Sie die height- und width-Eigenschaften aus dem bereinigten SVG
    const parser = new window.DOMParser();
    const svgDoc = parser.parseFromString(cleanSVG, 'image/svg+xml');
    const svgElement = svgDoc.documentElement;
    /*
    svgElement.removeAttribute('height');
    svgElement.removeAttribute('width');
*/
    svgElement.setAttribute('height', '30');
    svgElement.setAttribute('width', '30');

    const serializer = new window.XMLSerializer();
    const sanitizedSVG = serializer.serializeToString(svgElement);

    // Finden Sie das Unternehmen in der Datenbank
    const company = await this.companyModel.findById(companyId);
    if (!company) {
      throw new CompanyNotFoundException(companyId, this.i18n);
    }

    // Speichern Sie das bereinigte SVG-Logo im Unternehmen
    company.logoSvg = sanitizedSVG;
    await company.save();

    return sanitizedSVG;
  }

  async getCompanyById(companyId: string): Promise<Company> {
    const companyID = new Types.ObjectId(companyId);
    const company = await this.companyModel.findOne({
      _id: companyID,
    });

    if (!company) {
      throw new CompanyNotFoundException(companyId, this.i18n);
    }

    return company;
  }

  async getCompanyByIdPublic(
    companyId: string,
  ): Promise<CompanyPublicDto & { pointCards: BusinessPointCard[] }> {
    const companyID = companyId; // Das Company ID ist bereits ein String

    const result = await this.companyModel.aggregate([
      { $match: { _id: new Types.ObjectId(companyID) } },
      {
        $lookup: {
          from: 'businesspointcards',
          let: { companyId: { $toString: '$_id' } }, // Konvertiere _id zu String
          pipeline: [
            {
              $match: {
                $expr: {
                  $and: [
                    { $eq: ['$company', '$$companyId'] }, // Verknüpfe über das company-Feld, das als String gespeichert ist
                    { $eq: ['$isDeleted', false] }, // Nur Karten, die nicht gelöscht sind
                  ],
                },
              },
            },
            {
              $project: {
                name: 1,
                maxpoints: 1,
                discount: 1,
                description: 1,
                isDeleted: 1,
                company: 1,
              },
            },
          ],
          as: 'pointCards',
        },
      },
      {
        $project: {
          companyName: 1,
          legalForm: 1,
          dateOfEstablishment: 1,
          headquartersAddress: 1,
          managingDirectorCEO: 1,
          contactInformation: 1,
          logoSvg: 1,
          companyColor: 1,
          description: 1,
          industryDetails: 1,
          location: 1,
          pointCards: 1,
        },
      },
    ]);

    if (!result || result.length === 0) {
      throw new CompanyNotFoundException(companyId, this.i18n);
    }

    return result[0];
  }

  async updateOrCreateCustomerLevel(
    appUserId: string,
    newTotalPoints: number,
  ): Promise<Company> {
    // Versuche, das CustomerLevel zu aktualisieren, wenn es existiert
    const updateResult = await this.companyModel.findOneAndUpdate(
      { 'customerLevels.appUser': appUserId },
      {
        $set: {
          'customerLevels.$.totalPoints': newTotalPoints,
        },
      },
      { new: true },
    );

    if (updateResult) {
      return updateResult;
    } else {
      // Füge ein neues CustomerLevel hinzu, wenn es nicht existiert
      return this.companyModel.findOneAndUpdate(
        {},
        {
          $addToSet: {
            customerLevels: {
              appUser: appUserId,
              totalPoints: newTotalPoints,
            },
          },
        },
        { new: true },
      );
    }
  }

  async findNearestPaginated(
    longitude: number,
    latitude: number,
    page: number = 1,
    pageSize: number = 10,
  ): Promise<Company[]> {
    const skips = pageSize * (page - 1);

    return this.companyModel
      .find({
        location: {
          $near: {
            $geometry: {
              type: 'Point',
              coordinates: [longitude, latitude],
            },
          },
        },
      })
      .skip(skips)
      .limit(pageSize)
      .select(
        '-numberOfEmployees -revenue -employeesAppUsersIds -customerLevels',
      )
      .exec();
  }

  // company.service.ts
  async updateCompany(
    companyId: string,
    updateCompanyDto: CompanyUpdateDTO,
    appUser: AppUser,
  ): Promise<Company> {
    const company = await this.companyModel.findById(companyId);
    if (!company) {
      throw new CompanyNotFoundException(companyId, this.i18n);
    }

    const isOwner = appUser.company.equals(companyId);

    if (!isOwner) {
      throw new UserNotOwnerOfCompanyException(
        companyId,
        appUser.company.toString(),
        this.i18n,
      );
    }

    // Prüfen ob reqest User is owner of company

    // Prüfen, ob subIndustry aktualisiert werden soll, und entsprechend parentIndustry aktualisieren
    if (updateCompanyDto.subIndustry) {
      const parentIndustry = this.getParentIndustry(
        updateCompanyDto.subIndustry,
      );

      if (parentIndustry) {
        if (!company.industryDetails) {
          company.industryDetails = {
            parentIndustry,
            childIndustry: updateCompanyDto.subIndustry,
          };
        } else {
          company.industryDetails.parentIndustry = parentIndustry;
          company.industryDetails.childIndustry = updateCompanyDto.subIndustry;
        }

        // Teile Mongoose mit, dass sich industryDetails geändert hat
        company.markModified('industryDetails');
      }
    }

    // Aktualisiere andere Felder
    for (const [key, value] of Object.entries(updateCompanyDto)) {
      if (value !== undefined && key !== 'subIndustry') {
        // Ignoriere subIndustry hier, da es bereits behandelt wurde
        company[key] = value;
      }
    }

    await company.save();
    return company;
  }

  async removeEmployee(companyId: string, appUserId: string): Promise<Company> {
    const company = await this.companyModel.findById(companyId);
    if (!company) {
      throw new CompanyNotFoundException(companyId, this.i18n);
    }

    // Entfernen Sie den Mitarbeiter aus der Liste der Mitarbeiter
    company.employeesAppUsersIds = company.employeesAppUsersIds.filter(
      (id) => id.toString() !== appUserId,
    );

    await company.save();
    return company;
  }

  async searchAddress(query: string): Promise<AxiosResponse<any>> {
    try {
      const response = await firstValueFrom(
        this.httpService.get(
          'https://api.geoapify.com/v1/geocode/autocomplete',
          {
            params: {
              text: query,
              filter: 'countrycode:ch',
              format: 'json',
              limit: 5,
              apiKey: this.configService.get('GEO_APIFY_API_KEY'),
            },
          },
        ),
      );

      return response.data;
    } catch (error) {
      console.error('Error in searchAddress:', error);
      throw error;
    }
  }

  async getPngLogo(companyId: string): Promise<Buffer> {
    const company = await this.companyModel.findById(companyId);
    if (!company) {
      throw new CompanyNotFoundException(companyId, this.i18n);
    }

    if (!company.logoSvg) {
      throw new NotFoundException('This company does not have a logo');
    }

    const buffer = Buffer.from(company.logoSvg);
    const pngBuffer = await sharp(buffer)
      .resize({ width: 200 })
      .png()
      .toBuffer();

    return pngBuffer;
  }
}
