async function loadComponent(targetSelector, path) {
  const res = await fetch(path);
  const html = await res.text();
  document.querySelector(targetSelector).innerHTML = html;
}

function makeNoButtonJuggle() {
  // new behavior: temporarily behave like "Yes" while pointer is near / hovered / focused;
  // revert back to "No" when pointer moves away or blur.
  const noBtn = document.getElementById('no-btn');
  const yesBtn = document.getElementById('yes-btn');
  const choices = document.getElementById('choices') || (noBtn && noBtn.parentElement);
  if (!noBtn || !yesBtn || !choices) return;

  let tempActive = false;

  function keyHandler(ev) {
    if (ev.key === 'Enter' || ev.key === ' ') {
      ev.preventDefault();
      yesBtn.click();
    }
  }

  function activateTemp() {
    if (tempActive) return;
    tempActive = true;
    // preserve original text
    if (!noBtn.dataset.origText) noBtn.dataset.origText = noBtn.textContent;
    noBtn.classList.remove('no', 'initial');
    noBtn.classList.add('yes');
    noBtn.textContent = 'Yes';
    // forward clicks and keyboard to real yes
    noBtn._origOnclick = noBtn.onclick;
    noBtn.onclick = (e) => { e.preventDefault(); yesBtn.click(); };
    noBtn.addEventListener('keydown', keyHandler);
    // make focusable (if it was set to tabindex -1 earlier)
    if (noBtn.getAttribute('tabindex') === '-1') noBtn.removeAttribute('tabindex');
  }

  function deactivateTemp() {
    if (!tempActive) return;
    tempActive = false;
    noBtn.classList.remove('yes');
    noBtn.classList.add('no');
    noBtn.textContent = noBtn.dataset.origText || 'No';
    noBtn.onclick = noBtn._origOnclick || null;
    noBtn.removeEventListener('keydown', keyHandler);
    // restore tabindex to keep it non-focusable if you previously set it
    if (!noBtn.hasAttribute('tabindex')) noBtn.setAttribute('tabindex', '-1');
  }

  // proximity detection inside choices area
  choices.addEventListener('mousemove', (e) => {
    const bRect = noBtn.getBoundingClientRect();
    const dx = e.clientX - (bRect.left + bRect.width / 2);
    const dy = e.clientY - (bRect.top + bRect.height / 2);
    const dist = Math.hypot(dx, dy);
    // threshold (pixels) to temporarily convert to Yes
    if (dist < 120) activateTemp();
    else if (!noBtn.matches(':focus')) deactivateTemp();
  });

  // hover/focus handlers
  noBtn.addEventListener('mouseenter', activateTemp);
  noBtn.addEventListener('mouseleave', () => { if (!noBtn.matches(':focus')) deactivateTemp(); });

  noBtn.addEventListener('focus', activateTemp);
  noBtn.addEventListener('blur', deactivateTemp);

  // pointer (touch) support: activate on pointerdown, revert on pointerup outside
  noBtn.addEventListener('pointerdown', activateTemp);
  document.addEventListener('pointerup', () => { if (!noBtn.matches(':focus')) deactivateTemp(); });

  // ensure initial state is "No"
  deactivateTemp();
}

function initYesButton() {
  const yes = document.getElementById('yes-btn');
  const container = document.querySelector('.romantic-card');
  if (!yes || !container) return;

  let confirmEl = container.querySelector('.yes-confirm');
  if (!confirmEl) {
    confirmEl = document.createElement('div');
    confirmEl.className = 'yes-confirm';
    confirmEl.textContent = 'You made me the happiest. Thank you ❤️';
    container.appendChild(confirmEl);
  } else {
    confirmEl.classList.remove('show');
    confirmEl.style.opacity = '0';
  }

  yes.addEventListener('click', () => {
    confirmEl.classList.add('show');
    yes.animate([{ transform: 'scale(1)' }, { transform: 'scale(1.06)' }, { transform: 'scale(1)' }], { duration: 420 });

    // auto-hide confirmation after 8000ms
    clearTimeout(confirmEl._hideTimeout);
    confirmEl._hideTimeout = setTimeout(() => {
      confirmEl.classList.remove('show');
    }, 8000);
  });
}

async function init() {
  await loadComponent('#header', 'components/header.html');
  // If you also fetch apology-card, it can be loaded here:
  // await loadComponent('#apology-card', 'components/apology-card.html');

  // initialize playful behavior for NO button and yes interactions
  makeNoButtonJuggle();
  initYesButton();

  const data = await loadData('data/messages.json');

  document.getElementById('apology-title').textContent = data.title;
  document.getElementById('apology-text').textContent = data.message;
  document.getElementById('promises').innerHTML =
    data.promises.map(p => `<li>${p}</li>`).join('');

  document.getElementById('copy-message').addEventListener('click', async () => {
    const text = `${data.title}\n\n${data.message}\n\nPromises:\n- ${data.promises.join('\n- ')}`;
    try {
      await navigator.clipboard.writeText(text);
      document.getElementById('status').textContent = 'Message copied to clipboard.';
    } catch {
      document.getElementById('status').textContent = 'Could not copy — try selecting and copying manually.';
    }
  });

  document.getElementById('show-more').addEventListener('click', () => {
    alert('Talk to her, be honest, and show consistent change — actions matter more than words.');
  });
}

init();