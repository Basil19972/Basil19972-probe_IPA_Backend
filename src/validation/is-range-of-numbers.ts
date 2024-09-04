import { registerDecorator, ValidationOptions } from 'class-validator';

export function IsNumberRange(validationOptions?: ValidationOptions) {
  return function (object: object, propertyName: string) {
    registerDecorator({
      name: 'isNumberRange',
      target: object.constructor,
      propertyName: propertyName,
      options: validationOptions,
      validator: {
        validate(value: any) {
          if (!Array.isArray(value) || value.length !== 2) {
            return false;
          }

          const [min, max] = value;
          return (
            typeof min === 'number' && typeof max === 'number' && min < max
          );
        },
        defaultMessage() {
          return `${propertyName} must be an array of two numbers where the first is less than the second`;
        },
      },
    });
  };
}
