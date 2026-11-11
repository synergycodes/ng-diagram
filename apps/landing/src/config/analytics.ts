/**
 * Analytics of the production site, loaded by `components/Analytics.astro` only in builds with
 * `LANDING_ANALYTICS=true`: the consent manager (Piwik PRO) first, then Google Tag Manager,
 * whose container holds the measurement tags, and the Leadfeeder tracker. Other builds (local,
 * preview, tests) load none of them.
 */

/** The Piwik PRO container: its account host and its ID. */
export const PIWIK_PRO = {
  host: 'https://synergycodes.containers.piwik.pro',
  containerId: '7af1d714-c139-4beb-9a30-f6882724a01f',
} as const;

export const GTM_ID = 'GTM-KPFT7GG3';

/** The Leadfeeder tracker's ID. */
export const LEADFEEDER_ID = 'JMvZ8g0xXwP72pOd';

/**
 * The `dataLayer` event of a message that HubSpot accepted (scripts/contact-form.ts). The form
 * sends by `fetch`, so the tag manager cannot see the submission by itself.
 */
export const CONTACT_SENT_EVENT = 'contact_form_submit';
