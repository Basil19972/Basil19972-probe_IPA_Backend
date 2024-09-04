import { registerDecorator, ValidationOptions } from 'class-validator';
import { Industries } from '../company/industry.enum';

export function IsSubIndustry(validationOptions?: ValidationOptions) {
  return function (object: object, propertyName: string) {
    registerDecorator({
      name: 'isSubIndustry',
      target: object.constructor,
      propertyName: propertyName,
      options: validationOptions,
      validator: {
        validate(value: any) {
          const allSubIndustries = Object.values(Industries).flatMap(
            (enumObj) => Object.values(enumObj),
          );
          return typeof value === 'string' && allSubIndustries.includes(value);
        },
        defaultMessage() {
          return `${propertyName} must be a valid sub-industry`;
        },
      },
    });
  };
}
