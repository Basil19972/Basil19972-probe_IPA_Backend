import { registerDecorator, ValidationOptions } from 'class-validator';

export function IsSpecificDiscount(validationOptions?: ValidationOptions) {
  return function (object: object, propertyName: string) {
    registerDecorator({
      name: 'isSpecificDiscount',
      target: object.constructor,
      propertyName: propertyName,
      options: validationOptions,
      validator: {
        validate(value: any) {
          const allowedValues = [25, 50, 75, 100];
          return typeof value === 'number' && allowedValues.includes(value);
        },
        defaultMessage() {
          return `${propertyName} must be one of the following values: 25, 50, 75, 100`;
        },
      },
    });
  };
}
