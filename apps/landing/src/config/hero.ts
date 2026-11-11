/**
 * When the live hero diagram loads. Shared by the server render (as a data attribute) and the
 * browser loader, so both always agree.
 *
 * Wider than the phone layout (721px at the default 16px font), at least 560px tall and with a
 * fine pointer. Touch devices, phones in landscape and very short windows get the phone state
 * of the hero instead, without the diagram.
 */
export const HERO_DIAGRAM_MEDIA = '(min-width: 45.0625em) and (min-height: 35em) and (pointer: fine)';

/** Where the live diagram does not run, and the still image stands in for it (O7). */
export const HERO_STILL_MEDIA = `not all and ${HERO_DIAGRAM_MEDIA}`;

/** Values of `data-state` on the diagram host. `off`: the visitor turned on Save-Data. */
export type HeroDiagramState = 'idle' | 'loading' | 'live' | 'failed' | 'off';
