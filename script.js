// =============================================
//   CATÁLOGO ISCAS DE PESCA ESPORTIVA — SCRIPT.JS
// =============================================

document.addEventListener('DOMContentLoaded', () => {

  // --- NAV: scroll e hamburger ---
  const nav = document.getElementById('nav');
  const hamburger = document.getElementById('hamburger');
  const navLinks = document.getElementById('navLinks');
  const backTop = document.getElementById('backTop')

  window.addEventListener('scroll', () => {
    nav.classList.toggle('scrolled', window.scrollY > 40);
    backTop.classList.toggle('visible', window.scrollY > 400);
  }, { passive: true });

  hamburger.addEventListener('click', () => {
    hamburger.classList.toggle('open');
    navLinks.classList.toggle('open');
    document.body.style.overflow = navLinks.classList.contains('open') ? 'hidden' : '';
  });

  navLinks.querySelectorAll('a').forEach(a => {
    a.addEventListener('click', () => {
      hamburger.classList.remove('open');
      navLinks.classList.remove('open');
      document.body.style.overflow = '';
    });
  });

  // --- FILTROS ---
  const filtroBtns = document.querySelectorAll('.filtro-btn');
  const produtoCards = document.querySelectorAll('.produto-card');

  filtroBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      filtroBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');

      const filter = btn.dataset.filter;

      produtoCards.forEach(card => {
        const show = filter === 'all' || card.dataset.categoria === filter;
        card.style.display = show ? '' : 'none';
        if (show) {
          // re-trigger reveal se estava oculto
          setTimeout(() => card.classList.add('visible'), 50);
        }
      });
    });
  });

  // --- REVEAL COM INTERSECTION OBSERVER ---
  const revealEls = document.querySelectorAll('.reveal');

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.1, rootMargin: '0px 0px -40px 0px' });

  revealEls.forEach(el => observer.observe(el));

  // --- MODAL LIGHTBOX ---
  const modal     = document.getElementById('modal');
  const modalImg  = document.getElementById('modalImg');
  const modalNome = document.getElementById('modalNome');
  const modalCounter = document.getElementById('modalCounter');
  const modalPlaceholder = document.getElementById('modalPlaceholder');
  const modalOverlay = document.getElementById('modalOverlay');
  const modalClose = document.getElementById('modalClose');
  const modalPrev = document.getElementById('modalPrev');
  const modalNext = document.getElementById('modalNext');

  let currentGallery = [];
  let currentIndex = 0;

  function openModal(items, index) {
    currentGallery = items;
    currentIndex = index;
    showModalItem(currentIndex);
    modal.classList.add('open');
    document.body.style.overflow = 'hidden';
  }

  function closeModal() {
    modal.classList.remove('open');
    document.body.style.overflow = '';
    modalImg.src = '';
  }

  function showModalItem(index) {
    const item = currentGallery[index];
    if (!item) return;

    const imgSrc = item.img || '';
    modalNome.textContent = item.nome || '';
    modalCounter.textContent = `${index + 1} / ${currentGallery.length}`;

    if (imgSrc && imgSrc !== 'placeholder-isca.jpg') {
      modalPlaceholder.style.display = 'none';
      modalImg.style.display = 'block';
      modalImg.src = imgSrc;
      modalImg.alt = item.nome || '';
    } else {
      modalImg.style.display = 'none';
      modalPlaceholder.style.display = 'flex';
    }
  }

  function prevItem() {
    currentIndex = (currentIndex - 1 + currentGallery.length) % currentGallery.length;
    showModalItem(currentIndex);
  }

  function nextItem() {
    currentIndex = (currentIndex + 1) % currentGallery.length;
    showModalItem(currentIndex);
  }

  // Foto da isca exibida no swatch; clique abre o modal
  function colorSlug(nome) {
    return nome.toLowerCase()
      .normalize('NFD').replace(/[̀-ͯ]/g, '')
      .replace(/\s+/g, '-');
  }

  document.querySelectorAll('.produto-card').forEach(card => {
    const corItems = Array.from(card.querySelectorAll('.cor-item'));
    if (!corItems.length) return;

    const baseSlug = card.dataset.slug || '';

    function buildImgPath(item) {
      const isMobile = window.innerWidth <= 600;
      if (isMobile && item.dataset.imgMobile) return item.dataset.imgMobile;
      if (!isMobile && item.dataset.imgDesktop) return item.dataset.imgDesktop;
      if (item.dataset.img) return item.dataset.img;
      const subfolder = isMobile ? 'mobile' : 'desktop';
      return `iscas/${subfolder}/${baseSlug}-${colorSlug(item.dataset.nome || '')}.jpg`;
    }

    const gallery = corItems.map(el => ({
      img: buildImgPath(el),
      nome: el.dataset.nome || el.querySelector('span')?.textContent || '',
    }));

    corItems.forEach((item, idx) => {
      const swatch = item.querySelector('.cor-swatch');
      if (swatch) {
        const imgPath = buildImgPath(item);
        const tmp = new Image();
        tmp.onload = () => {
          swatch.style.backgroundImage = `url('${imgPath}')`;
          swatch.style.backgroundSize = 'cover';
          swatch.style.backgroundPosition = 'center';
        };
        tmp.src = imgPath;
      }
      item.addEventListener('click', () => openModal(gallery, idx));
    });
  });

  modalOverlay.addEventListener('click', closeModal);
  modalClose.addEventListener('click', closeModal);
  modalPrev.addEventListener('click', prevItem);
  modalNext.addEventListener('click', nextItem);

  document.addEventListener('keydown', e => {
    if (!modal.classList.contains('open')) return;
    if (e.key === 'Escape')      closeModal();
    if (e.key === 'ArrowLeft')   prevItem();
    if (e.key === 'ArrowRight')  nextItem();
  });

  // Swipe no mobile
  let touchStartX = 0;
  modal.addEventListener('touchstart', e => { touchStartX = e.touches[0].clientX; }, { passive: true });
  modal.addEventListener('touchend', e => {
    const diff = touchStartX - e.changedTouches[0].clientX;
    if (Math.abs(diff) > 50) diff > 0 ? nextItem() : prevItem();
  });

  // --- VOLTAR AO TOPO ---
  backTop.addEventListener('click', () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  });

  // --- SCROLL SUAVE NOS LINKS INTERNOS ---
  document.querySelectorAll('a[href^="#"]').forEach(a => {
    a.addEventListener('click', e => {
      const target = document.querySelector(a.getAttribute('href'));
      if (target) {
        e.preventDefault();
        const offset = 72; // altura da nav
        const top = target.getBoundingClientRect().top + window.scrollY - offset;
        window.scrollTo({ top, behavior: 'smooth' });
      }
    });
  });

});