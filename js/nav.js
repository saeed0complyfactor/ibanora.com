// Header: scrolled state, dropdowns (hover + click + keyboard on desktop, accordion on mobile), mobile menu.
export function initNav(nav) {
  const desktop = matchMedia('(min-width: 1024px)');
  const toggle = nav.querySelector('.nav__toggle');
  const items = [...nav.querySelectorAll('[data-dd]')];
  let timer;

  const setOpen = (item, open) => {
    item.classList.toggle('is-open', open);
    item.querySelector('.nav__trigger').setAttribute('aria-expanded', String(open));
  };
  const closeAll = (except) => items.forEach((i) => i !== except && setOpen(i, false));

  for (const item of items) {
    const trigger = item.querySelector('.nav__trigger');
    trigger.addEventListener('click', () => {
      const open = !item.classList.contains('is-open');
      if (desktop.matches) closeAll(item);
      setOpen(item, open);
    });
    item.addEventListener('mouseenter', () => {
      if (!desktop.matches) return;
      clearTimeout(timer);
      closeAll(item);
      setOpen(item, true);
    });
    item.addEventListener('mouseleave', () => {
      if (!desktop.matches) return;
      timer = setTimeout(() => setOpen(item, false), 140); // grace period for the gap between trigger and panel
    });
    item.addEventListener('focusout', (e) => {
      if (desktop.matches && !item.contains(e.relatedTarget)) setOpen(item, false);
    });
  }

  const setMenu = (open) => {
    nav.classList.toggle('is-open', open);
    document.body.classList.toggle('nav-open', open);
    toggle.setAttribute('aria-expanded', String(open));
    toggle.setAttribute('aria-label', open ? toggle.dataset.msgClose || 'Close menu' : toggle.dataset.msgOpen || 'Open menu');
    if (!open) closeAll();
  };
  toggle.addEventListener('click', () => setMenu(!nav.classList.contains('is-open')));
  nav.querySelectorAll('.nav__menu a').forEach((a) => a.addEventListener('click', () => setMenu(false)));
  desktop.addEventListener('change', () => setMenu(false));

  document.addEventListener('keydown', (e) => {
    if (e.key !== 'Escape') return;
    const open = items.find((i) => i.classList.contains('is-open'));
    if (open && desktop.matches) { setOpen(open, false); open.querySelector('.nav__trigger').focus(); return; }
    if (nav.classList.contains('is-open')) { setMenu(false); toggle.focus(); }
  });
  document.addEventListener('click', (e) => { if (desktop.matches && !nav.contains(e.target)) closeAll(); });

  const onScroll = () => nav.classList.toggle('is-scrolled', scrollY > 8);
  addEventListener('scroll', onScroll, { passive: true });
  onScroll();
}
