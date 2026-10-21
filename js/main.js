'use strict';
const menuBtn = document.querySelector('#menuBtn');
const nav = document.querySelector('#nav');
if (menuBtn && nav) {
  menuBtn.setAttribute('aria-expanded', 'false');
  menuBtn.setAttribute('aria-controls', 'nav');
  const closeMenu = () => {
    nav.classList.remove('on'); menuBtn.classList.remove('on');
    menuBtn.setAttribute('aria-expanded', 'false');
  };
  menuBtn.addEventListener('click', () => {
    const open = nav.classList.toggle('on');
    menuBtn.classList.toggle('on', open);
    menuBtn.setAttribute('aria-expanded', String(open));
    menuBtn.setAttribute('aria-label', open ? '메뉴 닫기' : '메뉴 열기');
  });
  nav.querySelectorAll('a').forEach(link => link.addEventListener('click', closeMenu));
  document.addEventListener('keydown', event => { if (event.key === 'Escape') closeMenu(); });
}
const mainImage = document.querySelector('#mainImage');
const thumbs = document.querySelectorAll('.thumb');
thumbs.forEach((thumb, index) => {
  thumb.type = 'button';
  thumb.setAttribute('aria-label', `공간 연출 이미지 ${index + 1} 보기`);
  thumb.setAttribute('aria-pressed', String(thumb.classList.contains('active')));
  thumb.addEventListener('click', () => {
    if (!mainImage) return;
    mainImage.src = thumb.dataset.image;
    mainImage.alt = thumb.querySelector('img').alt;
    thumbs.forEach(item => {
      item.classList.toggle('active', item === thumb);
      item.setAttribute('aria-pressed', String(item === thumb));
    });
  });
});
// 상품별 장바구니 내역 저장 및 표시
const catalog = {
  'sub.html': { name: 'Layer Sofa', price: 1280000, option: 'Warm Beige / Fabric', photo: '1555041469-a586c61ea9bc' },
  'round-lounge.html': { name: 'Round Lounge', price: 620000, option: 'Natural Oak / Linen', photo: '1493663284031-b7e3aefcae8e' },
  'form-chair.html': { name: 'Form Chair', price: 320000, option: 'Oak / Ivory', photo: '1549497538-303791108f95' },
  'low-table.html': { name: 'Low Table', price: 490000, option: 'Walnut / Steel', photo: '1600210492486-724fe5c67fb0' }
};
const bagKey = 'moru-bag-items';
const money = value => `₩${value.toLocaleString('ko-KR')}`;
const parseBag = raw => {
  try {
    const value = JSON.parse(raw || '{}');
    if (!value || typeof value !== 'object' || Array.isArray(value)) return {};
    return Object.fromEntries(Object.entries(value).filter(([id, count]) => Object.hasOwn(catalog, id) && Number.isInteger(count) && count > 0 && count <= 99));
  } catch { return {}; }
};
let bag = {};
try { bag = parseBag(localStorage.getItem(bagKey)); } catch {}
const addCart = document.querySelector('#addCart');
const cartCount = document.querySelector('.cart b');
const bagDialog = document.querySelector('#bagDialog');
const bagItems = document.querySelector('#bagItems');
const bagTotal = document.querySelector('#bagTotal');
const toast = document.querySelector('#cartToast');
const openBagButton = document.querySelector('#openBag');
let toastTimer;
const updateCount = () => {
  const count = Object.values(bag).reduce((sum, quantity) => sum + quantity, 0);
  if (cartCount) cartCount.textContent = count;
  if (openBagButton) openBagButton.setAttribute('aria-label', `장바구니 보기, 상품 ${count}개`);
};
const persistBag = () => {
  try { localStorage.setItem(bagKey, JSON.stringify(bag)); } catch {}
  updateCount();
};
const renderBag = () => {
  if (!bagItems) return;
  const entries = Object.entries(bag);
  bagItems.innerHTML = entries.length ? entries.map(([id, quantity]) => {
    const item = catalog[id];
    return `<article class="bag-item"><a href="${id}" aria-label="${item.name} 상세 보기"><img src="https://images.unsplash.com/photo-${item.photo}?auto=format&fit=crop&w=240&q=80" alt="${item.name}"></a><div><h3><a href="${id}">${item.name}</a></h3><p>${item.option}</p><strong>${money(item.price)}</strong><div class="bag-item-controls"><div class="bag-quantity"><button type="button" data-action="decrease" data-id="${id}" aria-label="${item.name} 수량 줄이기">−</button><output aria-label="수량">${quantity}</output><button type="button" data-action="increase" data-id="${id}" aria-label="${item.name} 수량 늘리기" ${quantity >= 99 ? 'disabled' : ''}>+</button></div><button type="button" class="bag-remove" data-action="remove" data-id="${id}" aria-label="${item.name} 삭제">삭제</button></div></div></article>`;
  }).join('') : '<p class="bag-empty">장바구니가 비어 있습니다.<br>마음에 드는 가구를 담아보세요.</p>';
  bagTotal.textContent = money(entries.reduce((sum, [id, quantity]) => sum + catalog[id].price * quantity, 0));
};
const openBag = () => {
  renderBag();
  toast?.classList.remove('is-visible');
  if (bagDialog && !bagDialog.open) {
    bagDialog.showModal();
    document.documentElement.classList.add('bag-open');
  }
};
const closeBag = () => bagDialog?.close();
openBagButton?.addEventListener('click', openBag);
document.querySelector('#toastViewBag')?.addEventListener('click', openBag);
document.querySelector('#closeBag')?.addEventListener('click', closeBag);
document.querySelector('#continueShopping')?.addEventListener('click', closeBag);
bagDialog?.addEventListener('close', () => {
  document.documentElement.classList.remove('bag-open');
  openBagButton?.focus({ preventScroll: true });
});
bagDialog?.addEventListener('click', event => {
  if (event.target !== bagDialog) return;
  const box = bagDialog.getBoundingClientRect();
  if (event.clientX < box.left || event.clientX > box.right || event.clientY < box.top || event.clientY > box.bottom) closeBag();
});
bagItems?.addEventListener('click', event => {
  const button = event.target.closest('button[data-action]');
  if (!button) return;
  const { id, action } = button.dataset;
  if (!Object.hasOwn(bag, id)) return;
  if (action === 'increase') bag[id] = Math.min(99, bag[id] + 1);
  if (action === 'decrease') bag[id] -= 1;
  if (action === 'remove' || bag[id] <= 0) delete bag[id];
  persistBag();
  renderBag();
  const replacement = bagItems.querySelector(`button[data-id="${id}"][data-action="${action}"]:not(:disabled)`);
  (replacement || document.querySelector('#closeBag')).focus({ preventScroll: true });
});
if (addCart) {
  const original = addCart.innerHTML;
  const productId = location.pathname.split('/').pop();
  addCart.addEventListener('click', () => {
    if (addCart.disabled || !Object.hasOwn(catalog, productId)) return;
    const atLimit = (bag[productId] || 0) >= 99;
    if (!atLimit) {
      bag[productId] = (bag[productId] || 0) + 1;
      persistBag();
    }
    toast.querySelector('span').textContent = atLimit ? '한 상품은 최대 99개까지 담을 수 있습니다.' : '장바구니에 담겼습니다.';
    toast.classList.add('is-visible');
    window.clearTimeout(toastTimer);
    toastTimer = window.setTimeout(() => toast.classList.remove('is-visible'), 3600);
    addCart.disabled = true;
    addCart.classList.add('is-added');
    addCart.textContent = atLimit ? '최대 수량입니다' : '장바구니에 담겼습니다.';
    window.setTimeout(() => {
      addCart.innerHTML = original;
      addCart.disabled = false;
      addCart.classList.remove('is-added');
    }, 1600);
  });
}
window.addEventListener('storage', event => {
  if (event.key === bagKey || event.key === null) {
    try { bag = parseBag(localStorage.getItem(bagKey)); } catch { bag = {}; }
    updateCount();
    if (bagDialog?.open) renderBag();
  }
});
updateCount();

const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const revealTargets = document.querySelectorAll('.section-head, .product-card, .collection__image, .collection__content, .feature-card, .journal-grid article, .detail-gallery, .detail-info, .story__head, .story .wrap > img, .footer-compact > *');
if ('IntersectionObserver' in window && !reducedMotion) {
  const observer = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('is-visible');
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.08, rootMargin: '0px 0px -24px 0px' });
  revealTargets.forEach((target, i) => {
    target.classList.add('reveal');
    target.style.setProperty('--reveal-delay', `${i % 3 * 65}ms`);
    observer.observe(target);
  });
}
const topButton = document.querySelector('.top-button');
if (topButton) {
  const updateTop = () => topButton.classList.toggle('is-visible', window.scrollY > 360);
  window.addEventListener('scroll', updateTop, { passive: true });
  updateTop();
  topButton.addEventListener('click', () => window.scrollTo({ top: 0, behavior: reducedMotion ? 'instant' : 'smooth' }));
}

// 현재 페이지에서는 섹션의 시작선을 기준으로 이동합니다.
const anchorOffset = () => {
  const header = document.querySelector('.header');
  if (!header) return 0;
  const position = getComputedStyle(header).position;
  return position === 'fixed' || position === 'sticky' ? header.getBoundingClientRect().height : 0;
};
const moveToSection = (hash, smooth = true) => {
  if (!['#new', '#collection', '#journal'].includes(hash)) return;
  const target = document.getElementById(hash.slice(1));
  if (!target) return;
  const top = Math.max(0, target.getBoundingClientRect().top + window.scrollY - anchorOffset());
  window.scrollTo({ top, behavior: smooth && !reducedMotion ? 'smooth' : 'instant' });
};
document.querySelectorAll('a[href*="#"]').forEach(link => {
  const url = new URL(link.href, location.href);
  const normalizedPath = path => path.replace(/index\.html$/, '');
  if (url.origin !== location.origin || normalizedPath(url.pathname) !== normalizedPath(location.pathname)) return;
  if (!['#new', '#collection', '#journal'].includes(url.hash)) return;
  link.addEventListener('click', event => {
    if (event.defaultPrevented || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey || event.button > 0) return;
    event.preventDefault();
    if (location.hash !== url.hash) history.pushState(null, '', url.hash);
    moveToSection(url.hash);
  });
});
window.addEventListener('hashchange', () => moveToSection(location.hash));
if (location.hash) {
  const alignInitialSection = () => {
    const fontsReady = document.fonts ? document.fonts.ready : Promise.resolve();
    fontsReady.then(() => requestAnimationFrame(() => moveToSection(location.hash, false)));
  };
  if (document.readyState === 'complete') alignInitialSection();
  else window.addEventListener('load', alignInitialSection, { once: true });
}
