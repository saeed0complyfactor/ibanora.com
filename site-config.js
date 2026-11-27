// Public site settings. Empty values leave a feature off.
// web3formsKey: an Ibanora-only Web3Forms access key (keys are designed to be public). Empty = the form says it isn't connected yet.
// gaId: GA4 measurement ID "G-XXXXXXXXXX". clarityId: Microsoft Clarity project ID.
//   Both load only after a visitor clicks Accept on the cookie banner (js/analytics.js); with neither set, no banner shows.
export const SITE = { web3formsKey: 'aefcb6a3-167a-4ed6-b23a-67e348988ab8', gaId: 'G-57JGJR7B4G', clarityId: 'zjx3ukv1qf' };
// js/analytics.js is a classic script and reads its settings from here.
window.SITE_CONFIG = SITE;
