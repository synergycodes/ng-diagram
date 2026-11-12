/**
 * Copy of the contact page that both the markup and the form script need, and the list of free
 * email providers the form refuses ("Only company domains are supported.", as on production).
 */

/** GDPR text above the send button. Sending the form is the consent to process, as on production. */
export const GDPR_TEXT =
  'By sending a message you allow Synergia Pro Sp. z o.o., with its registered office in Poland, Wroclaw (51-607) Czackiego Street 71, to process your personal data provided by you in the contact form for the purpose of contacting you and providing you with the information you requested. You can withdraw your consent at any time. For more information on data processing and the data controller please refer to our Privacy policy.';

/** The part of `GDPR_TEXT` that links to the privacy policy. */
export const GDPR_LINK_TEXT = 'Privacy policy';

/**
 * Label of the optional marketing consent; HubSpot gets only its value (`privacy_policy`). Its
 * last sentence (with the link) is in the markup.
 */
export const MARKETING_TEXT =
  'I want to receive product or service information from Synergy Codes. The consent can be withdrawn at any time.';

export const FIELD_MESSAGES = {
  name: { missing: 'Enter your full name.' },
  company: { missing: 'Enter your company name.' },
  email: {
    missing: 'Enter your work email address.',
    format: 'Enter an email address in the format name@company.com.',
    freeDomain: 'Only company domains are supported. Use your work email address.',
  },
  message: { missing: 'Tell us a little about your project.' },
} as const;

/** The message counter shows from this many characters (of the field's 5000). */
export const MESSAGE_COUNTER_FROM = 4000;

/** Free email providers, compared with the whole domain after `@`. */
const FREE_DOMAINS = new Set([
  'gmail.com',
  'googlemail.com',
  'ymail.com',
  'rocketmail.com',
  'msn.com',
  'icloud.com',
  'me.com',
  'mac.com',
  'aol.com',
  'proton.me',
  'protonmail.com',
  'pm.me',
  'web.de',
  'mail.com',
  'ya.ru',
  'mail.ru',
  'zoho.com',
  'tutanota.com',
  'tuta.io',
  'fastmail.com',
  'hey.com',
  'qq.com',
  '163.com',
  '126.com',
  'sina.com',
  'naver.com',
  'daum.net',
  'rediffmail.com',
  't-online.de',
  'freenet.de',
  'libero.it',
  'orange.fr',
  'laposte.net',
  'free.fr',
  'btinternet.com',
  'comcast.net',
  'att.net',
  'verizon.net',
  'sbcglobal.net',
  'seznam.cz',
  'wp.pl',
  'o2.pl',
  'onet.pl',
  'op.pl',
  'poczta.onet.pl',
  'onet.eu',
  'interia.pl',
  'interia.eu',
  'tlen.pl',
  'gazeta.pl',
  'go2.pl',
  'vp.pl',
  'autograf.pl',
  'buziaczek.pl',
]);

/**
 * Providers with regional domains (yahoo.co.uk, hotmail.de, gmx.net): the label before a public
 * suffix of at most two short labels.
 */
const FREE_LABELS = new Set(['yahoo', 'hotmail', 'outlook', 'live', 'gmx', 'yandex']);

/** Whether the domain of an email address belongs to a free email provider. */
export function isFreeEmailDomain(email: string): boolean {
  const domain = email
    .slice(email.lastIndexOf('@') + 1)
    .toLowerCase()
    .replace(/\.$/, '');
  if (FREE_DOMAINS.has(domain)) {
    return true;
  }
  const [label = '', ...suffix] = domain.split('.');
  return (
    FREE_LABELS.has(label) &&
    suffix.length >= 1 &&
    suffix.length <= 2 &&
    suffix.every((part) => part.length >= 2 && part.length <= 3)
  );
}
