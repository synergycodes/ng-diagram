/**
 * Where the contact form sends to: the HubSpot Forms API v3 (unauthenticated submit, CORS).
 * https://developers.hubspot.com/docs/api-reference/legacy/marketing/forms/v3-legacy/submit-data-unauthenticated
 *
 * The form has no GDPR consent options, so no consent is sent; the GDPR text is on the page.
 */

export const HUBSPOT_PORTAL_ID: string = '9333518';
export const HUBSPOT_FORM_GUID: string = 'bbef86cf-b493-428a-bf43-cf1538d729ba';

/** Internal names of the fields of that HubSpot form. */
export const HUBSPOT_FIELDS = {
  /** The full name, as typed. */
  fullName: 'full_name',
  company: 'company',
  email: 'email',
  message: 'message',
  /** The optional marketing checkbox, a boolean contact property. */
  marketing: 'privacy_policy',
} as const;

/** The submit URL, or an empty string while the IDs are missing. */
export const CONTACT_ENDPOINT =
  HUBSPOT_PORTAL_ID && HUBSPOT_FORM_GUID
    ? `https://api.hsforms.com/submissions/v3/integration/submit/${HUBSPOT_PORTAL_ID}/${HUBSPOT_FORM_GUID}`
    : '';

/** A send that takes longer is aborted and shows the general error. */
export const CONTACT_TIMEOUT_MS = 15_000;
