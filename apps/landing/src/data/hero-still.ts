import { getImage } from 'astro:assets';
import { slots } from '../config/landing';

export interface HeroStill {
  avif: string;
  webp: string;
  /** Natural size of the still, for the phone stage's proportions. */
  width: number;
  height: number;
}

/**
 * The still image of the hero diagram (slot `heroStill`) in AVIF and WebP. On phones it is the
 * largest element of the first screen, so its weight decides the mobile LCP budget
 * (scripts/perf.mjs): 900px wide stays sharp on a 342px stage at 3x and keeps the AVIF near 23 KB.
 */
export async function getHeroStill(): Promise<HeroStill | null> {
  const shot = slots.heroStill;
  if (!shot) {
    return null;
  }
  const width = Math.min(shot.width, 900);
  const [avif, webp] = await Promise.all([
    getImage({ src: shot, format: 'avif', width, quality: 40 }),
    getImage({ src: shot, format: 'webp', width, quality: 70 }),
  ]);
  return { avif: avif.src, webp: webp.src, width: shot.width, height: shot.height };
}
