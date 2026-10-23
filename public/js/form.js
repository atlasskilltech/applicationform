// public/js/form.js — step navigation, word counter, client-side nudges.
// Server-side validation in the controller is the real gate; this is UX only.
(function () {
  const form = document.getElementById('applicationForm');
  if (!form) return;

  const sections = Array.from(document.querySelectorAll('.form-section'));
  const navItems = Array.from(document.querySelectorAll('#stepNav li'));
  const prevBtn = document.getElementById('prevBtn');
  const nextBtn = document.getElementById('nextBtn');
  const submitBtn = document.getElementById('submitBtn');
  const totalSteps = sections.length;

  // If the server re-rendered with errors, jump to the first section that has one.
  let current = 1;
  const firstInvalid = document.querySelector('.is-invalid, .field-error');
  if (firstInvalid) {
    const sec = firstInvalid.closest('.form-section');
    if (sec) current = Number(sec.dataset.step);
  }

  function show(step) {
    current = Math.min(Math.max(step, 1), totalSteps);
    sections.forEach(s => s.classList.toggle('active', Number(s.dataset.step) === current));
    navItems.forEach(li => {
      const n = Number(li.dataset.step);
      li.classList.toggle('active', n === current);
      li.classList.toggle('done', n < current);
    });
    prevBtn.style.display = current === 1 ? 'none' : 'inline-block';
    nextBtn.style.display = current === totalSteps ? 'none' : 'inline-block';
    submitBtn.style.display = current === totalSteps ? 'inline-block' : 'none';
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  nextBtn.addEventListener('click', () => show(current + 1));
  prevBtn.addEventListener('click', () => show(current - 1));
  navItems.forEach(li => li.addEventListener('click', () => show(Number(li.dataset.step))));

  // Word counter for Statement of Purpose
  const sop = document.getElementById('sop');
  const sopCount = document.getElementById('sopCount');
  if (sop && sopCount) {
    const count = () => {
      const words = sop.value.trim() ? sop.value.trim().split(/\s+/).length : 0;
      sopCount.textContent = words;
      sopCount.style.color = words > 250 ? '#dc2626' : '';
    };
    sop.addEventListener('input', count);
    count();
  }

  // Keep digit-only fields clean
  form.querySelectorAll('input[name="mobile"],input[name="pin_code"],input[name="father_mobile"],input[name="mother_mobile"]')
    .forEach(inp => inp.addEventListener('input', () => { inp.value = inp.value.replace(/\D/g, ''); }));

  show(current);
})();
