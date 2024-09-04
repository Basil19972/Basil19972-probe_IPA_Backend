import { registerDecorator, ValidationOptions } from 'class-validator';

export function IsSwissUID(validationOptions?: ValidationOptions) {
  return function (object: object, propertyName: string) {
    registerDecorator({
      name: 'isSwissUID',
      target: object.constructor,
      propertyName: propertyName,
      options: {
        ...validationOptions,
        message: validationOptions?.message || 'The UID is not valid',
      },
      validator: {
        validate(value: any) {
          // Prüfen, ob der Wert ein String ist und dem UID-Format entspricht
          if (
            typeof value !== 'string' ||
            !/^CHE-[0-9]{3}\.[0-9]{3}\.[0-9]{3}$/.test(value)
          ) {
            return false;
          }

          // Entfernen von 'CHE-' und Punkten, um nur die Zahlen zu erhalten
          const numbers = value.replace(/CHE-|\./g, '');

          // Berechnung der Prüfziffer
          return isValidSwissUID(numbers);
        },
      },
    });
  };
}

function isValidSwissUID(uid: string): boolean {
  const weights = [5, 4, 3, 2, 7, 6, 5, 4];
  let sum = 0;

  for (let i = 0; i < weights.length; i++) {
    sum += parseInt(uid[i], 10) * weights[i];
  }

  const checkDigit = 11 - (sum % 11);

  // Wenn das Ergebnis 10 ist, ist die UID ungültig
  if (checkDigit === 10) {
    return false;
  }

  // Die Prüfziffer muss mit der letzten Ziffer der UID übereinstimmen
  return checkDigit === parseInt(uid[uid.length - 1], 10);
}
