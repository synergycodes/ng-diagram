/**
 * The contact form (ContactForm.astro): validation, the progress rail, sending to HubSpot and
 * the states of the rail (`data-state` = idle | sending | sent | failed).
 *
 * - A field is checked on blur once the visitor changed it, and on every input once it shows an
 *   error. Sending checks every field and focuses the first invalid one.
 * - A step of the rail is marked done (decoration only) while its fields are valid; this never
 *   shows an error.
 * - The endpoint is read from `data-endpoint` at the moment of sending. Without it the form
 *   shows the general error and logs why. HubSpot's own messages and redirects are ignored.
 * - A filled honeypot field ends in the success state without a request.
 * - A message HubSpot accepted, and only that, pushes `CONTACT_SENT_EVENT` to `dataLayer` for the
 *   tag manager (config/analytics.ts).
 * - Once sent, the confirmation (ContactSent) replaces the intro, the form and the community
 *   block, the page goes back to the top and focus moves to the confirmation's heading.
 */
import { CONTACT_SENT_EVENT } from '../config/analytics';
import { CONTACT_TIMEOUT_MS, HUBSPOT_FIELDS } from '../config/contact';
import { FIELD_MESSAGES, MESSAGE_COUNTER_FROM } from '../data/contact';
import { FIELD_NAMES, fieldError, type FieldName } from './contact-validation';

type State = 'idle' | 'sending' | 'sent' | 'failed';
type Alert = 'general' | 'rate';
type Control = HTMLInputElement | HTMLTextAreaElement;

interface HubSpotError {
  message?: string;
  errorType?: string;
}

/** HubSpot error types that belong to the email field, with the message they show. */
const EMAIL_ERRORS: Record<string, string> = {
  INVALID_EMAIL: FIELD_MESSAGES.email.format,
  BLOCKED_EMAIL: FIELD_MESSAGES.email.freeDomain,
  INVALID_DOMAIN: FIELD_MESSAGES.email.freeDomain,
};

/** Form fields by the HubSpot property names they are sent as. */
const FIELD_BY_PROPERTY: Record<string, FieldName> = {
  [HUBSPOT_FIELDS.fullName]: 'name',
  [HUBSPOT_FIELDS.company]: 'company',
  [HUBSPOT_FIELDS.email]: 'email',
  [HUBSPOT_FIELDS.message]: 'message',
};

export function initContactForm(): void {
  const root = document.querySelector<HTMLElement>('[data-contact]');
  const form = root?.querySelector<HTMLFormElement>('[data-contact-form]');
  const submit = root?.querySelector<HTMLButtonElement>('[data-contact-submit]');
  if (!root || !form || !submit) {
    return;
  }
  form.noValidate = true;
  submit.disabled = false;

  const controls = Object.fromEntries(
    FIELD_NAMES.map((name) => [name, form.querySelector<Control>(`[data-field="${name}"]`)!])
  ) as Record<FieldName, Control>;
  const honeypot = form.querySelector<HTMLInputElement>('[data-honeypot]');
  const marketing = form.querySelector<HTMLInputElement>('[data-marketing]');
  const counter = form.querySelector<HTMLElement>('[data-counter]');
  const alertBox = root.querySelector<HTMLElement>('[data-contact-alert]')!;
  const submitLabel = submit.querySelector<HTMLElement>('[data-submit-label]')!;
  const idleLabel = submitLabel.textContent ?? '';
  const steps = [...form.querySelectorAll<HTMLElement>('[data-step]')];

  /** Fields the visitor changed, and fields that show an error and re-check on input. */
  const dirty = new Set<FieldName>();
  const live = new Set<FieldName>();

  const state = (): State => root.dataset['state'] as State;

  const describe = (control: Control): void => {
    const ids = [
      control.dataset['hint'],
      control.getAttribute('aria-invalid') === 'true' ? `${control.id}-error` : '',
      control === controls.message && counter && !counter.hidden ? counter.id : '',
    ].filter(Boolean);
    if (ids.length) {
      control.setAttribute('aria-describedby', ids.join(' '));
    } else {
      control.removeAttribute('aria-describedby');
    }
  };

  const showError = (name: FieldName, message: string | null): void => {
    const control = controls[name];
    const error = document.getElementById(`${control.id}-error`);
    if (message) {
      control.setAttribute('aria-invalid', 'true');
      live.add(name);
    } else {
      control.removeAttribute('aria-invalid');
      live.delete(name);
    }
    if (error) {
      error.querySelector('[data-error-text]')!.textContent = message ?? '';
      error.hidden = !message;
    }
    describe(control);
  };

  const check = (name: FieldName): boolean => {
    const message = fieldError(name, controls[name].value);
    showError(name, message);
    return !message;
  };

  /** Marks each step done while its fields are valid. The last step is done only once sending starts. */
  const updateRail = (): void => {
    for (const step of steps) {
      const fields = (step.dataset['fields'] ?? '').split(' ').filter(Boolean) as FieldName[];
      const done = fields.length
        ? fields.every((name) => !fieldError(name, controls[name].value))
        : state() === 'sending' || state() === 'sent';
      step.toggleAttribute('data-done', done);
    }
  };

  const updateCounter = (): void => {
    if (!counter) {
      return;
    }
    const control = controls.message;
    const left = control.maxLength - control.value.length;
    const show = control.value.length >= MESSAGE_COUNTER_FROM;
    counter.textContent = `${left} characters left`;
    if (counter.hidden === show) {
      counter.hidden = !show;
      describe(control);
    }
  };

  const setAlert = (kind: Alert | null): void => {
    alertBox.replaceChildren();
    const template = kind && root.querySelector<HTMLTemplateElement>(`template[data-alert="${kind}"]`);
    if (template) {
      alertBox.append(template.content.cloneNode(true));
    }
  };

  const setState = (next: State): void => {
    root.dataset['state'] = next;
    const sending = next === 'sending';
    form.setAttribute('aria-busy', String(sending));
    if (sending) {
      submit.setAttribute('aria-disabled', 'true');
    } else {
      submit.removeAttribute('aria-disabled');
    }
    submitLabel.textContent = sending ? 'Sending…' : idleLabel;
    for (const control of Object.values(controls)) {
      control.readOnly = sending;
    }
    updateRail();
  };

  // A press on the send button blurs the field first. Checking it then would insert its error
  // and move the button away from under the pointer, so the click would be lost; sending checks
  // every field anyway.
  let pressingSubmit = false;
  submit.addEventListener('pointerdown', () => (pressingSubmit = true));
  document.addEventListener('pointerup', () => setTimeout(() => (pressingSubmit = false)));

  for (const name of FIELD_NAMES) {
    const control = controls[name];
    control.addEventListener('input', () => {
      dirty.add(name);
      if (live.has(name)) {
        check(name);
      }
      if (name === 'message') {
        updateCounter();
      }
      updateRail();
    });
    control.addEventListener('blur', (event) => {
      if (dirty.has(name) && !pressingSubmit && (event as FocusEvent).relatedTarget !== submit) {
        check(name);
      }
    });
  }

  // The checkbox cannot be read-only; while sending a click does not change it.
  marketing?.addEventListener('click', (event) => {
    if (state() === 'sending') {
      event.preventDefault();
    }
  });

  const succeed = (email: string): void => {
    setAlert(null);
    setState('sent');
    // The fields leave the page's content for assistive technology too.
    form.setAttribute('aria-hidden', 'true');
    form.inert = true;
    // The confirmation replaces the intro, the form and the community block (ContactSent).
    const sent = document.querySelector<HTMLElement>('[data-contact-sent]');
    if (!sent) {
      return;
    }
    for (const element of document.querySelectorAll<HTMLElement>('[data-contact-hide]')) {
      element.hidden = true;
    }
    const address = sent.querySelector<HTMLElement>('[data-sent-email]');
    if (address) {
      address.textContent = email;
    }
    sent.hidden = false;
    window.scrollTo({ top: 0, behavior: 'instant' });
    sent.querySelector<HTMLElement>('[data-done-title]')?.focus({ preventScroll: true });
  };

  const fail = (kind: Alert): void => {
    setState('failed');
    setAlert(kind);
  };

  /** Tells the tag manager, where the page loads one, that HubSpot accepted the message. */
  const reportSent = (): void => {
    const page = window as Window & { dataLayer?: object[] };
    page.dataLayer = page.dataLayer ?? [];
    page.dataLayer.push({ event: CONTACT_SENT_EVENT });
  };

  /** Shows HubSpot's field errors on their fields. Returns whether every error found a field. */
  const showServerErrors = (errors: HubSpotError[]): boolean => {
    let allPlaced = errors.length > 0;
    for (const error of errors) {
      const type = error.errorType ?? '';
      if (EMAIL_ERRORS[type]) {
        showError('email', EMAIL_ERRORS[type]);
        continue;
      }
      if (type === 'REQUIRED_FIELD') {
        const words = (error.message ?? '').toLowerCase().split(/[^a-z0-9_]+/);
        const property = Object.keys(FIELD_BY_PROPERTY).find((key) => words.includes(key));
        const name = property ? FIELD_BY_PROPERTY[property] : undefined;
        if (name) {
          showError(name, FIELD_MESSAGES[name].missing);
          continue;
        }
      }
      console.error(`Contact form: HubSpot refused the submission (${type || 'unknown error'}).`, error.message);
      allPlaced = false;
    }
    return allPlaced;
  };

  const focusFirstInvalid = (): void => {
    const first = FIELD_NAMES.find((name) => controls[name].getAttribute('aria-invalid') === 'true');
    if (first) {
      controls[first].focus();
    }
  };

  const send = async (): Promise<void> => {
    const endpoint = form.dataset['endpoint'] ?? '';
    const values = Object.fromEntries(FIELD_NAMES.map((name) => [name, controls[name].value.trim()])) as Record<
      FieldName,
      string
    >;

    if (honeypot?.value) {
      succeed(values.email);
      return;
    }
    if (!endpoint) {
      console.error(
        'Contact form: no HubSpot endpoint. Set HUBSPOT_PORTAL_ID and HUBSPOT_FORM_GUID in src/config/contact.ts.'
      );
      fail('general');
      return;
    }

    setAlert(null);
    setState('sending');
    const field = (name: string, value: string) => ({ objectTypeId: '0-1', name, value });
    // The HubSpot form has no consent options: the GDPR text is on the page, and the marketing
    // checkbox is a contact property, sent checked or not, as HubSpot's own form does.
    const body = {
      fields: [
        field(HUBSPOT_FIELDS.fullName, values.name),
        field(HUBSPOT_FIELDS.company, values.company),
        field(HUBSPOT_FIELDS.email, values.email),
        field(HUBSPOT_FIELDS.message, values.message),
        field(HUBSPOT_FIELDS.marketing, String(!!marketing?.checked)),
      ],
      context: { pageUri: `${location.origin}${location.pathname}`, pageName: document.title },
    };

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), CONTACT_TIMEOUT_MS);
    let response: Response;
    try {
      response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
        signal: controller.signal,
      });
    } catch {
      fail('general');
      return;
    } finally {
      clearTimeout(timer);
    }

    if (response.ok) {
      reportSent();
      succeed(values.email);
      return;
    }
    if (response.status === 429) {
      fail('rate');
      return;
    }
    let errors: HubSpotError[] = [];
    if (response.status === 400) {
      try {
        const data = (await response.json()) as { errors?: HubSpotError[] };
        errors = Array.isArray(data.errors) ? data.errors : [];
      } catch {
        errors = [];
      }
    }
    if (showServerErrors(errors)) {
      setState('idle');
      focusFirstInvalid();
      return;
    }
    if (!errors.length) {
      console.error(`Contact form: HubSpot answered ${response.status}.`);
    }
    fail('general');
  };

  form.addEventListener('submit', (event) => {
    event.preventDefault();
    if (state() === 'sending' || state() === 'sent') {
      return;
    }
    const valid = FIELD_NAMES.map(check).every(Boolean);
    updateRail();
    if (!valid) {
      focusFirstInvalid();
      return;
    }
    void send();
  });

  updateCounter();
  updateRail();
}
