import { registerDecorator, ValidationOptions } from 'class-validator';

export function IsObjectId(validationOptions?: ValidationOptions) {
  return function (object: object, propertyName: string) {
    registerDecorator({
      name: 'isObjectId',
      target: object.constructor,
      propertyName: propertyName,
      options: validationOptions,
      validator: {
        validate(value: any) {
          return typeof value === 'string' && /^[0-9a-fA-F]{24}$/.test(value);
        },
        defaultMessage() {
          return `${propertyName} is an invalid ObjectId`;
        },
      },
    });
  };
}
