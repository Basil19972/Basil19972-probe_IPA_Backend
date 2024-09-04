import { plainToClass } from "class-transformer";

export function plainToDTO<T>(dto: { new (): T }, partial: Partial<T>): T {
  return plainToClass(dto, partial, {
    excludeExtraneousValues: true,
  });
}

export function plainToDTOs<T>(
  dto: { new (): T },
  partials: Partial<T[]>
): T[] {
  return partials.map((partial) => plainToDTO(dto, partial));
}
