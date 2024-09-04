import { registerDecorator, ValidationOptions } from 'class-validator';

export function IsStrongPassword(validationOptions?: ValidationOptions) {
  return function (object: object, propertyName: string) {
    registerDecorator({
      name: 'isStrongPassword',
      target: object.constructor,
      propertyName: propertyName,
      options: validationOptions,
      validator: {
        validate(value: any) {
          if (typeof value !== 'string') {
            return false;
          }

          // Password criteria
          const hasUpperCase = /[A-Z]/.test(value);
          const hasLowerCase = /[a-z]/.test(value);
          const hasNumber = /\d/.test(value);
          const hasSpecialCharacter = /[!@#$%^&*(),.?":{}|<>]/.test(value);

          return (
            value.length >= 8 &&
            hasUpperCase &&
            hasLowerCase &&
            hasNumber &&
            hasSpecialCharacter
          );
        },
        defaultMessage() {
          return `Password is too weak. It should be at least 8 characters long and contain at least one uppercase letter, one lowercase letter, one number, and one special character.`;
        },
      },
    });
  };
}
