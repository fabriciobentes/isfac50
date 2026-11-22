const navigation = performance.getEntriesByType('navigation')[0];
if (navigation?.type === 'reload') {
  history.scrollRestoration = 'manual';
  if (location.hash) {
    const start = new URL(location.href);
    start.hash = '';
    history.replaceState(history.state, '', start.href);
  }
  window.addEventListener('pageshow', () => {
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
  }, { once: true });
}

const menu = document.querySelector('#menu-principal');
const menuButton = document.querySelector('.menu-botao');
const mobile = window.matchMedia('(max-width: 44rem)');
const motion = window.matchMedia('(prefers-reduced-motion: no-preference)');
const links = [...menu.querySelectorAll('a[href^="#"]')];
const sections = links.map(link => document.querySelector(link.hash));
const progress = document.querySelector('.progresso-leitura');
const header = document.querySelector('.topo');

function setMenu(open) {
  menu.hidden = mobile.matches && !open;
  menuButton.setAttribute('aria-expanded', String(open));
}

function syncMenu() {
  menuButton.hidden = !mobile.matches;
  setMenu(false);
}

menuButton.addEventListener('click', () => setMenu(menu.hidden));
header.addEventListener('keydown', event => {
  if (event.key === 'Escape' && mobile.matches && !menu.hidden) {
    setMenu(false);
    menuButton.focus();
  }
});
links.forEach(link => link.addEventListener('click', () => {
  setMenu(false);
  if (mobile.matches) {
    const destination = document.querySelector(link.hash);
    destination.tabIndex = -1;
    destination.focus({ preventScroll: true });
  }
}));
mobile.addEventListener('change', syncMenu);
syncMenu();

function updateReadingPosition() {
  header.classList.toggle('topo-rolado', window.scrollY > 32);
  const maxScroll = document.documentElement.scrollHeight - window.innerHeight;
  const fraction = maxScroll > 0 ? Math.min(1, Math.max(0, window.scrollY / maxScroll)) : 0;
  progress.style.transform = `scaleX(${fraction})`;
  const marker = header.offsetHeight + 48;
  const current = sections.findLast(section => section.getBoundingClientRect().top <= marker);
  links.forEach(link => {
    if (current && link.hash === `#${current.id}`) {
      link.setAttribute('aria-current', 'location');
    } else {
      link.removeAttribute('aria-current');
    }
  });
}

let frame = 0;
function scheduleReadingUpdate() {
  if (frame) return;
  frame = requestAnimationFrame(() => {
    updateReadingPosition();
    frame = 0;
  });
}
window.addEventListener('scroll', scheduleReadingUpdate, { passive: true });
window.addEventListener('resize', scheduleReadingUpdate);
document.querySelectorAll('.duvidas details').forEach(detail => {
  detail.addEventListener('toggle', scheduleReadingUpdate);
});
updateReadingPosition();

if ('IntersectionObserver' in window) {
  const visible = new Set();
  const selectors = [
    '.hero-texto > *', '.secao h2', '.pesquisa p:not(.rotulo)',
    '.identidade-intro', '.significados > div', '.instituicoes > div',
    '.duvidas-lista details', '.cartoes article', '.logo-cena',
    '.marco', '.rio-cena img'
  ];

  function syncAnimation(element) {
    element.classList.toggle('animacao-visivel', visible.has(element) && !document.hidden && motion.matches);
  }

  const observer = new IntersectionObserver(entries => {
    for (const { target, isIntersecting } of entries) {
      if (isIntersecting) visible.add(target);
      else visible.delete(target);
      syncAnimation(target);
    }
  });

  function syncVisibleAnimations() {
    visible.forEach(syncAnimation);
  }

  document.addEventListener('visibilitychange', syncVisibleAnimations);
  motion.addEventListener('change', syncVisibleAnimations);
  document.querySelectorAll(selectors.join(', ')).forEach(element => observer.observe(element));
}


const coverVideo = document.querySelector('.capa-ilustracao video');
if (coverVideo) {
  let coverVisible = true;

  function syncCoverVideo() {
    if (!motion.matches || !coverVisible || document.hidden) {
      coverVideo.pause();
      if (!motion.matches) coverVideo.hidden = true;
      return;
    }
    if (!coverVideo.hasAttribute('src')) coverVideo.src = coverVideo.dataset.src;
    coverVideo.play().catch(() => {});
  }

  coverVideo.addEventListener('playing', () => {
    coverVideo.hidden = !motion.matches;
  });
  coverVideo.addEventListener('error', () => {
    coverVideo.hidden = true;
  });
  motion.addEventListener('change', syncCoverVideo);
  document.addEventListener('visibilitychange', syncCoverVideo);
  if ('IntersectionObserver' in window) {
    coverVisible = false;
    const coverObserver = new IntersectionObserver(([entry]) => {
      coverVisible = entry.isIntersecting;
      syncCoverVideo();
    });
    coverObserver.observe(coverVideo.parentElement);
  } else {
    syncCoverVideo();
  }
}
