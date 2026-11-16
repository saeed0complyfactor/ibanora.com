import { SITE } from '/site-config.js';

const ENDPOINT = 'https://api.web3forms.com/submit';
// English texts. Translated pages carry their own in data-msg-* attributes on the form (tools/partials.mjs).
const EN = {
  missing: 'Please add your {list}.',
  and: 'and',
  email: "That email address doesn't look complete. Please check it.",
  sending: 'Sending…',
  ok: "Thank you. Your inquiry is on its way and we'll reply by email.",
  error: "That didn't go through. Please check your connection and try again.",
  offline: "Online inquiries aren't connected yet, so this message wasn't sent. Please keep a copy and try again later.",
};

// "first name, last name and work email"
export const joinList = (names, and = EN.and) => (names.length > 1 ? `${names.slice(0, -1).join(', ')} ${and} ${names.at(-1)}` : names[0] ?? '');

// Message for the fields that failed validation: [{ label, type, value }]. Labels are lower-cased only in English.
export const missingMessage = (bad, msg = EN, lower = true) =>
  bad.length === 1 && bad[0].type === 'email' && bad[0].value
    ? msg.email
    : msg.missing.replace('{list}', joinList(bad.map((f) => (lower ? f.label.toLowerCase() : f.label)), msg.and));

const labelOf = (f, form) => form.querySelector(`label[for="${f.id}"]`).textContent.replace('*', '').trim();

export function initInquiryForm(form, { config = SITE, fetchFn = fetch } = {}) {
  if (!form) return;
  const msg = form.querySelector('[data-msg]');
  const btn = form.querySelector('button[type="submit"]');
  const msgs = Object.fromEntries(Object.entries(EN).map(([k, v]) => [k, form.dataset[`msg${k[0].toUpperCase()}${k.slice(1)}`] || v]));
  const lower = document.documentElement.lang.startsWith('en');
  // Errors interrupt (alert); success is polite (status). Set the role before the text so the right one announces.
  const show = (text, cls) => {
    msg.setAttribute('role', cls === 'err' ? 'alert' : 'status');
    msg.setAttribute('aria-live', cls === 'err' ? 'assertive' : 'polite');
    msg.textContent = text;
    msg.className = `iform__msg ${cls || ''}`.trim();
  };

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    show('');
    const req = [...form.querySelectorAll('[required]')];
    req.forEach((f) => {
      const ok = f.checkValidity();
      f.setAttribute('aria-invalid', String(!ok));
      if (ok) f.removeAttribute('aria-describedby'); else f.setAttribute('aria-describedby', msg.id);
    });
    const bad = req.filter((f) => !f.checkValidity());
    if (bad.length) {
      show(missingMessage(bad.map((f) => ({ label: labelOf(f, form), type: f.type, value: f.value })), msgs, lower), 'err');
      bad[0].focus();
      return;
    }
    const label = btn.textContent;
    btn.disabled = true;
    btn.textContent = msgs.sending;
    try {
      if (!config.web3formsKey) throw new Error('no-endpoint');
      const data = Object.fromEntries(new FormData(form));
      if (data.botcheck) throw new Error('http');
      const payload = { ...data, access_key: config.web3formsKey, replyto: data.email, name: `${data.first_name} ${data.last_name}` };
      const res = await fetchFn(ENDPOINT, { method: 'POST', headers: { 'Content-Type': 'application/json', Accept: 'application/json' }, body: JSON.stringify(payload) });
      const out = await res.json().catch(() => ({}));
      if (!res.ok || out.success === false) throw new Error('http');
      show(msgs.ok, 'ok');
      form.reset();
    } catch (err) {
      show(err.message === 'no-endpoint' ? msgs.offline : msgs.error, 'err');
    } finally {
      btn.disabled = false;
      btn.textContent = label;
    }
  });
  form.querySelectorAll('input, select, textarea').forEach((f) => f.addEventListener('input', () => { f.removeAttribute('aria-invalid'); f.removeAttribute('aria-describedby'); }));
}
