// =============================================
//   URUTAU JIGS — CATÁLOGO 2026
//   script.js — v3.0
// =============================================

document.addEventListener('DOMContentLoaded', () => {

  // ─── NAV ──────────────────────────────────
  const nav = document.getElementById('nav');
  const hamburger = document.getElementById('hamburger');
  const navLinks = document.getElementById('navLinks');
  const backTop = document.getElementById('backTop');
  const navCartBtn = document.getElementById('navCartBtn');

  let scrollTick = false;
  window.addEventListener('scroll', () => {
    if (scrollTick) return;
    scrollTick = true;
    requestAnimationFrame(() => {
      nav.classList.toggle('scrolled', window.scrollY > 40);
      backTop.classList.toggle('visible', window.scrollY > 400);
      scrollTick = false;
    });
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

  backTop.addEventListener('click', () => window.scrollTo({ top: 0, behavior: 'smooth' }));

  document.querySelectorAll('a[href^="#"]').forEach(a => {
    a.addEventListener('click', e => {
      const t = document.querySelector(a.getAttribute('href'));
      if (t) { e.preventDefault(); window.scrollTo({ top: t.getBoundingClientRect().top + window.scrollY - 72, behavior: 'smooth' }); }
    });
  });

  // ─── REVEAL ───────────────────────────────
  const obs = new IntersectionObserver(entries => {
    entries.forEach(e => { if (e.isIntersecting) { e.target.classList.add('visible'); obs.unobserve(e.target); } });
  }, { threshold: 0.1, rootMargin: '0px 0px -40px 0px' });
  document.querySelectorAll('.reveal').forEach(el => obs.observe(el));

  // ─── MODAL LIGHTBOX ───────────────────────
  const modal = document.getElementById('modal');
  const modalImg = document.getElementById('modalImg');
  const modalNome = document.getElementById('modalNome');
  const modalCnt = document.getElementById('modalCounter');
  const modalPH = document.getElementById('modalPlaceholder');
  let gallery = [], gIdx = 0;

  function openModal(items, idx) { gallery = items; gIdx = idx; showItem(gIdx); modal.classList.add('open'); document.body.style.overflow = 'hidden'; }
  function closeModal() { modal.classList.remove('open'); document.body.style.overflow = ''; modalImg.src = ''; }
  function showItem(i) {
    const it = gallery[i]; if (!it) return;
    modalNome.textContent = it.nome; modalCnt.textContent = `${i + 1} / ${gallery.length}`;
    if (it.img) { modalPH.style.display = 'none'; modalImg.style.display = 'block'; modalImg.src = it.img; modalImg.alt = it.nome; }
    else { modalImg.style.display = 'none'; modalPH.style.display = 'flex'; }
  }
  function prev() { gIdx = (gIdx - 1 + gallery.length) % gallery.length; showItem(gIdx); }
  function next() { gIdx = (gIdx + 1) % gallery.length; showItem(gIdx); }

  document.getElementById('modalOverlay').addEventListener('click', closeModal);
  document.getElementById('modalClose').addEventListener('click', closeModal);
  document.getElementById('modalPrev').addEventListener('click', prev);
  document.getElementById('modalNext').addEventListener('click', next);
  document.addEventListener('keydown', e => { if (!modal.classList.contains('open')) return; if (e.key === 'Escape') closeModal(); if (e.key === 'ArrowLeft') prev(); if (e.key === 'ArrowRight') next(); });
  let tStartX = 0;
  modal.addEventListener('touchstart', e => { tStartX = e.touches[0].clientX; }, { passive: true });
  modal.addEventListener('touchend', e => { const d = tStartX - e.changedTouches[0].clientX; if (Math.abs(d) > 50) d > 0 ? next() : prev(); });

  function colorSlug(n) { return n.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/\s+/g, '-'); }

  document.querySelectorAll('.produto-card').forEach(card => {
    const items = Array.from(card.querySelectorAll('.cor-item'));
    if (!items.length) return;
    const slug = card.dataset.slug || '';
    function imgPath(item) {
      const mob = window.innerWidth <= 600;
      if (mob && item.dataset.imgMobile) return item.dataset.imgMobile;
      if (!mob && item.dataset.imgDesktop) return item.dataset.imgDesktop;
      return `iscas/${mob ? 'mobile' : 'desktop'}/${slug}-${colorSlug(item.dataset.nome || '')}.jpg`;
    }
    const gal = items.map(el => ({ img: imgPath(el), nome: el.dataset.nome || el.querySelector('span')?.textContent || '' }));
    items.forEach((item, i) => {
      item.addEventListener('click', () => openModal(gal, i));
    });

    // Carrega backgrounds dos swatches só quando o card entra na viewport
    const swatchObs = new IntersectionObserver(([entry]) => {
      if (!entry.isIntersecting) return;
      swatchObs.disconnect();
      items.forEach(item => {
        const sw = item.querySelector('.cor-swatch');
        if (!sw) return;
        const tmp = new Image();
        tmp.onload = () => { sw.style.backgroundImage = `url('${imgPath(item)}')`; sw.style.backgroundSize = 'cover'; sw.style.backgroundPosition = 'center'; };
        tmp.src = imgPath(item);
      });
    }, { rootMargin: '200px' });
    swatchObs.observe(card);
  });


  // ═══════════════════════════════════════════
  //   SISTEMA DE PEDIDOS
  // ═══════════════════════════════════════════

  let pedido = JSON.parse(localStorage.getItem('urutau_pedido') || '[]');
  let sheetData = { nome: '', gramaturas: [], cores: [], coresCss: [], imgsDesktop: [], imgsMobile: [] };
  let selGram = null, selCor = null, selCorCss = null, qtd = 1;

  const pedidoOverlay = document.getElementById('pedidoOverlay');
  const pedidoSheet = document.getElementById('pedidoSheet');
  const sheetClose = document.getElementById('sheetClose');
  const sheetNome = document.getElementById('sheetProdutoNome');
  const sheetGramOpts = document.getElementById('sheetGramOpts');
  const sheetCoresGrid = document.getElementById('sheetCoresGrid');
  const qtdMinus = document.getElementById('qtdMinus');
  const qtdPlus = document.getElementById('qtdPlus');
  const qtdNumEl = document.getElementById('qtdNum');
  const pedidoConfirmar = document.getElementById('pedidoConfirmar');
  const resumoTexto = document.getElementById('resumoTexto');
  const carrinhoFab = document.getElementById('carrinhoFab');
  const carrinhoFabBtn = document.getElementById('carrinhoFabBtn');
  const carrinhoCount = document.getElementById('carrinhoCount');
  const carrinhoOverlay = document.getElementById('carrinhoOverlay');
  const carrinhoPainel = document.getElementById('carrinhoPainel');
  const carrinhoPainelClose = document.getElementById('carrinhoPainelClose');
  const carrinhoPainelBody = document.getElementById('carrinhoPainelBody');
  const carrinhoTotalItens = document.getElementById('carrinhoTotalItens');
  const carrinhoEnviar = document.getElementById('carrinhoEnviar');
  const carrinhoLimpar = document.getElementById('carrinhoLimpar');

  // Abrir sheet
  document.querySelectorAll('.btn-add-pedido').forEach(btn => {
    btn.addEventListener('click', e => {
      e.stopPropagation();
      const card = btn.closest('.produto-card');
      sheetData.nome = card.dataset.nome || '';
      sheetData.gramaturas = (card.dataset.gramaturas || '').split(',').filter(Boolean);
      sheetData.cores = (card.dataset.cores || '').split(',').filter(Boolean);
      sheetData.coresCss = (card.dataset.coresCss || '').split('|').filter(Boolean);
      const corItems = Array.from(card.querySelectorAll('.cor-item'));
      sheetData.imgsDesktop = corItems.map(el => el.dataset.imgDesktop || '');
      sheetData.imgsMobile = corItems.map(el => el.dataset.imgMobile || '');
      selGram = sheetData.gramaturas.length === 1 ? sheetData.gramaturas[0] : null;
      selCor = null; selCorCss = null; qtd = 1;
      sheetNome.textContent = sheetData.nome;
      buildGram(); buildCores(); qtdNumEl.textContent = 1; updateResumo();
      pedidoSheet.classList.add('open');
      pedidoOverlay.classList.add('open');
      document.body.style.overflow = 'hidden';
    });
  });

  function closeSheet() { pedidoSheet.classList.remove('open'); pedidoOverlay.classList.remove('open'); document.body.style.overflow = ''; }
  sheetClose.addEventListener('click', closeSheet);
  pedidoOverlay.addEventListener('click', closeSheet);

  function buildGram() {
    sheetGramOpts.innerHTML = '';
    sheetData.gramaturas.forEach(g => {
      const btn = document.createElement('button');
      btn.className = 'sheet-gram-btn' + (selGram === g ? ' active' : '');
      btn.textContent = g;
      btn.addEventListener('click', () => { selGram = g; sheetGramOpts.querySelectorAll('.sheet-gram-btn').forEach(b => b.classList.remove('active')); btn.classList.add('active'); updateResumo(); });
      sheetGramOpts.appendChild(btn);
    });
  }

  function buildCores() {
    sheetCoresGrid.innerHTML = '';
    const mob = window.innerWidth <= 600;
    sheetData.cores.forEach((cor, i) => {
      const css = sheetData.coresCss[i] || '#888';
      const imgSrc = mob ? (sheetData.imgsMobile[i] || '') : (sheetData.imgsDesktop[i] || '');
      const el = document.createElement('div');
      el.className = 'sheet-cor-item';
      const imgTag = imgSrc ? `<img src="${imgSrc}" alt="${cor}" loading="lazy" decoding="async">` : '';
      el.innerHTML = `<div class="sheet-cor-swatch" style="background:${css}">${imgTag}</div><span>${cor}</span>`;
      el.addEventListener('click', () => { selCor = cor; selCorCss = css; sheetCoresGrid.querySelectorAll('.sheet-cor-item').forEach(e => e.classList.remove('active')); el.classList.add('active'); updateResumo(); });
      sheetCoresGrid.appendChild(el);
    });
  }

  qtdMinus.addEventListener('click', () => { if (qtd > 1) { qtd--; qtdNumEl.textContent = qtd; updateResumo(); } });
  qtdPlus.addEventListener('click', () => { if (qtd < 99) { qtd++; qtdNumEl.textContent = qtd; updateResumo(); } });

  function updateResumo() {
    const ok = selGram && selCor;
    pedidoConfirmar.disabled = !ok;
    if (ok) {
      resumoTexto.innerHTML = `<span class="resumo-badge" style="background:${selCorCss}"></span><strong>${sheetData.nome}</strong> · ${selGram} · ${selCor} · <strong>${qtd}×</strong>`;
    } else {
      resumoTexto.textContent = `Selecione a ${!selGram ? 'gramatura' : 'cor'}`;
    }
  }

  function showAddedToast(nome, gram, cor, quantidade) {
    const prev = document.getElementById('addedToast');
    if (prev) prev.remove();
    const toast = document.createElement('div');
    toast.id = 'addedToast';
    toast.className = 'added-toast';
    toast.innerHTML = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" width="15" height="15"><polyline points="20 6 9 17 4 12"/></svg><span><strong>${nome}</strong> · ${gram} · ${cor} · ${quantidade}×</span>`;
    document.body.appendChild(toast);
    requestAnimationFrame(() => toast.classList.add('visible'));
    setTimeout(() => { toast.classList.remove('visible'); setTimeout(() => toast.remove(), 300); }, 2500);
  }

  pedidoConfirmar.addEventListener('click', () => {
    if (!selGram || !selCor) return;
    const corIdx = sheetData.cores.indexOf(selCor);
    pedido.push({ produto: sheetData.nome, gramatura: selGram, cor: selCor, corCss: selCorCss, quantidade: qtd, imgDesktop: sheetData.imgsDesktop[corIdx] || '', imgMobile: sheetData.imgsMobile[corIdx] || '' });
    updateCarrinho();
    showAddedToast(sheetData.nome, selGram, selCor, qtd);
    selCor = null; selCorCss = null; qtd = 1;
    sheetCoresGrid.querySelectorAll('.sheet-cor-item').forEach(e => e.classList.remove('active'));
    qtdNumEl.textContent = 1;
    updateResumo();
  });

  function updateCarrinho() {
    localStorage.setItem('urutau_pedido', JSON.stringify(pedido));
    const total = pedido.reduce((s, i) => s + i.quantidade, 0);
    carrinhoFab.style.display = total > 0 ? 'flex' : 'none';
    navCartBtn.style.display = total > 0 ? 'flex' : 'none';
    carrinhoCount.textContent = total;
    navCartBtn.querySelector('.nav__cart-count').textContent = total;
    carrinhoTotalItens.textContent = total + (total === 1 ? ' unidade' : ' unidades');

    if (!pedido.length) {
      carrinhoPainelBody.innerHTML = `<div class="carrinho-vazio"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" width="48" height="48" opacity=".3"><path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z"/><line x1="3" y1="6" x2="21" y2="6"/><path d="M16 10a4 4 0 01-8 0"/></svg><p>Nenhum item ainda.<br>Adicione produtos do catálogo.</p></div>`;
      return;
    }
    const mob = window.innerWidth <= 600;
    carrinhoPainelBody.innerHTML = pedido.map((it, idx) => {
      const imgSrc = mob ? (it.imgMobile || it.imgDesktop || '') : (it.imgDesktop || it.imgMobile || '');
      const thumb = imgSrc
        ? `<img src="${imgSrc}" alt="${it.cor}" class="carrinho-item__thumb" loading="lazy" decoding="async">`
        : `<div class="carrinho-item__swatch" style="background:${it.corCss}"></div>`;
      return `
      <div class="carrinho-item">
        ${thumb}
        <div class="carrinho-item__info"><strong>${it.produto}</strong><span>${it.gramatura} · ${it.cor}</span></div>
        <div class="carrinho-item__qtd">
          <button class="carrinho-qtd-btn" data-action="dec" data-idx="${idx}">−</button>
          <span>${it.quantidade}</span>
          <button class="carrinho-qtd-btn" data-action="inc" data-idx="${idx}">+</button>
        </div>
        <button class="carrinho-item__del" data-idx="${idx}" aria-label="Remover"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="14" height="14"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg></button>
      </div>`;
    }).join('');

  }

  carrinhoPainelBody.addEventListener('click', e => {
    const qtdBtn = e.target.closest('.carrinho-qtd-btn');
    const delBtn = e.target.closest('.carrinho-item__del');
    if (qtdBtn) {
      const i = parseInt(qtdBtn.dataset.idx);
      if (qtdBtn.dataset.action === 'inc') pedido[i].quantidade = Math.min(99, pedido[i].quantidade + 1);
      else { pedido[i].quantidade--; if (pedido[i].quantidade <= 0) pedido.splice(i, 1); }
      updateCarrinho();
    }
    if (delBtn) { pedido.splice(parseInt(delBtn.dataset.idx), 1); updateCarrinho(); }
  });

  function openCarrinho() { carrinhoPainel.classList.add('open'); carrinhoOverlay.classList.add('open'); document.body.style.overflow = 'hidden'; }
  function closeCarrinho() { carrinhoPainel.classList.remove('open'); carrinhoOverlay.classList.remove('open'); document.body.style.overflow = ''; }

  carrinhoFabBtn.addEventListener('click', openCarrinho);
  navCartBtn.addEventListener('click', openCarrinho);
  carrinhoPainelClose.addEventListener('click', closeCarrinho);
  carrinhoOverlay.addEventListener('click', closeCarrinho);

  let cTouchStart = 0;
  carrinhoPainel.addEventListener('touchstart', e => { cTouchStart = e.touches[0].clientY; }, { passive: true });
  carrinhoPainel.addEventListener('touchend', e => { if (e.changedTouches[0].clientY - cTouchStart > 80) closeCarrinho(); });

  carrinhoLimpar.addEventListener('click', () => {
    if (!pedido.length) return;
    if (confirm('Limpar todos os itens do pedido?')) { pedido = []; updateCarrinho(); closeCarrinho(); }
  });

  carrinhoEnviar.addEventListener('click', () => {
    if (!pedido.length) return;
    const linhas = pedido.map(it => `• ${it.produto} | ${it.gramatura} | ${it.cor} | Qtd: ${it.quantidade}`).join('\n');
    const total = pedido.reduce((s, i) => s + i.quantidade, 0);
    const msg = `🎣 *Pedido Urutau Jigs*\n─────────────────────\n${linhas}\n─────────────────────\n*Total: ${total} unidade${total > 1 ? 's' : ''}*`;
    window.open(`https://wa.me/553199762918?text=${encodeURIComponent(msg)}`, '_blank');
  });

  updateCarrinho();
});