class IndustryDetailsDto {
  parentIndustry: string;

  childIndustry: string;
}

export class CompanyPublicDto {
  companyName: string;

  legalForm: string;

  industryDetails: IndustryDetailsDto;

  dateOfEstablishment: Date;

  headquartersAddress: string;

  managingDirectorCEO: string;

  contactInformation: string;

  logoSvg: string;

  description: string;
}
