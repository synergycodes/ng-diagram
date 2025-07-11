import { DefaultRouting, ROUTING } from '../../../../types';

export function isDefaultRouting(value: string | undefined): value is DefaultRouting {
  return ROUTING.includes(value as DefaultRouting);
}
