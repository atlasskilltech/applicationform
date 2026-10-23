// public/js/form.js — dark mode, scroll-spy sidebar, live progress, word counter.
// The page is a single scrollable form; the sidebar tracks where you are and how
// much is done. Server-side validation in the controller remains the real gate.
(function () {
  /* ---------- dark mode ---------- */
  const root = document.documentElement;
  const toggle = document.getElementById('themeToggle');
  try {
    const saved = localStorage.getItem('atlas-theme');
    if (saved) root.setAttribute('data-theme', saved);
  } catch (e) {}
  if (toggle) {
    toggle.addEventListener('click', () => {
      const next = root.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
      root.setAttribute('data-theme', next);
      try { localStorage.setItem('atlas-theme', next); } catch (e) {}
    });
  }

  const form = document.getElementById('applicationForm');
  if (!form) return;

  const sections = Array.from(document.querySelectorAll('.form-section'));
  const navItems = Array.from(document.querySelectorAll('#stepNav li'));
  const progressFill = document.getElementById('progressFill');
  const progressText = document.getElementById('progressText');
  const total = sections.length;

  /* ---------- scroll-spy: highlight the section in view ---------- */
  function setActive(step) {
    navItems.forEach(li => li.classList.toggle('active', Number(li.dataset.step) === step));
  }
  if ('IntersectionObserver' in window) {
    const seen = new Map();
    const io = new IntersectionObserver(entries => {
      entries.forEach(en => seen.set(en.target, en.intersectionRatio));
      // pick the most-visible section
      let best = null, bestRatio = 0;
      seen.forEach((ratio, el) => { if (ratio > bestRatio) { bestRatio = ratio; best = el; } });
      if (best && bestRatio > 0) setActive(Number(best.dataset.step));
    }, { rootMargin: '-45% 0px -45% 0px', threshold: [0, 0.25, 0.5, 1] });
    sections.forEach(s => io.observe(s));
  }

  /* ---------- live progress ---------- */
  // A section counts as "done" when every required control in it is filled.
  function controlFilled(ctrl) {
    if (!ctrl) return false;
    if (ctrl.type === 'file') return ctrl.files && ctrl.files.length > 0;
    if (ctrl.type === 'radio') return !!form.querySelector(`input[name="${ctrl.name}"]:checked`);
    if (ctrl.type === 'checkbox') return ctrl.checked;
    return String(ctrl.value || '').trim() !== '';
  }
  function requiredControls(section) {
    const list = [];
    section.querySelectorAll('.field').forEach(f => {
      if (f.querySelector('label .req')) {
        const ctrl = f.querySelector('input,select,textarea');
        if (ctrl) list.push(ctrl);
      }
    });
    section.querySelectorAll('.check-row').forEach(r => {
      if (r.querySelector('.req')) {
        const ctrl = r.querySelector('input');
        if (ctrl) list.push(ctrl);
      }
    });
    return list;
  }
  const sectionReqs = sections.map(requiredControls);

  function updateProgress() {
    let done = 0;
    sections.forEach((section, i) => {
      const reqs = sectionReqs[i];
      const complete = reqs.length > 0 && reqs.every(controlFilled);
      if (complete) done++;
      const li = navItems.find(l => Number(l.dataset.step) === Number(section.dataset.step));
      if (li) li.classList.toggle('done', complete);
    });
    if (progressText) progressText.textContent = `${done} of ${total} done`;
    if (progressFill) progressFill.style.width = `${(done / total) * 100}%`;
  }
  form.addEventListener('input', updateProgress);
  form.addEventListener('change', updateProgress);

  /* ---------- word counter for Statement of Purpose ---------- */
  const sop = document.getElementById('sop');
  const sopCount = document.getElementById('sopCount');
  if (sop && sopCount) {
    const count = () => {
      const words = sop.value.trim() ? sop.value.trim().split(/\s+/).length : 0;
      sopCount.textContent = words;
      sopCount.style.color = words > 250 ? '#e23744' : '';
    };
    sop.addEventListener('input', count);
    count();
  }

  /* ---------- keep digit-only fields clean ---------- */
  form.querySelectorAll('input[name="mobile"],input[name="pin_code"],input[name="father_mobile"],input[name="mother_mobile"]')
    .forEach(inp => inp.addEventListener('input', () => { inp.value = inp.value.replace(/\D/g, ''); }));

  /* ---------- after a server re-render with errors, jump to the first one ---------- */
  const firstInvalid = document.querySelector('.is-invalid, .field-error');
  if (firstInvalid) {
    const sec = firstInvalid.closest('.form-section') || firstInvalid;
    sec.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  updateProgress();
})();
