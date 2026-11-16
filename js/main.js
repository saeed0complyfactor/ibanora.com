import { initNav } from './nav.js';
import { initReveal } from './reveal.js';
import { initTabs } from './tabs.js';
import { initInquiryForm } from './form.js';
import * as home from './home.js';
import * as pages from './pages.js';

const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
document.documentElement.classList.add('js');

initNav(document.querySelector('[data-nav]'));
initReveal({ reduced });
// Tab groups that home.js/pages.js drive themselves carry data-tabs-custom.
for (const el of document.querySelectorAll('[data-tabs]:not([data-tabs-custom])')) initTabs(el);
for (const f of document.querySelectorAll('[data-inquiry]')) initInquiryForm(f);
home.init({ reduced });
pages.init({ reduced });
