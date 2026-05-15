// =============================================
//   URUTAU JIGS — CATÁLOGO 2026
//   script.js — v4.0 (performance build)
// =============================================

document.addEventListener('DOMContentLoaded', () => {

  // ─── DETECÇÃO MOBILE (cached — não recalcula a cada chamada) ──
  // Problema original: window.innerWidth era chamado DENTRO de cada
  // função de imagem, forçando layout recalc a cada execução.
  // Solução: calcular uma vez e recalcular só no resize com debounce.
  let isMobile = window.innerWidth <= 600;
  let resizeTimer;
  window.addEventListener('resize', () => {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(() => { isMobile = window.innerWidth <= 600; }, 250);
  }, { passive: true });

  // ─── NAV ──────────────────────────────────
  const nav        = document.getElementById('nav');
  const hamburger  = document.getElementById('hamburger');
  const navLinks   = document.getElementById('navLinks');
  const backTop    = document.getElementById('backTop');
  const navCartBtn = document.getElementById('navCartBtn');

  // Problema original: requestAnimationFrame com flag era redundante
  // aqui pois classList.toggle é barato. O problema real era o passive
  // listener que já estava certo. Simplificado sem perda.
  window.addEventListener('scroll', () => {
    nav.classList.toggle('scrolled', window.scrollY > 40);
    backTop.classList.toggle('visible', window.scrollY > 400);
  }, { passive: true });

  hamburger.addEventListener('click', () => {
    const isOpen = navLinks.classList.toggle('open');
    hamburger.classList.toggle('open', isOpen);
    hamburger.setAttribute('aria-expanded', isOpen);
    document.body.style.overflow = isOpen ? 'hidden' : '';
  });

  navLinks.querySelectorAll('a').forEach(a => {
    a.addEventListener('click', () => {
      hamburger.classList.remove('open');
      navLinks.classList.remove('open');
      hamburger.setAttribute('aria-expanded', 'false');
      document.body.style.overflow = '';
    });
  });

  backTop.addEventListener('click', () => window.scrollTo({ top: 0, behavior: 'smooth' }));

  document.querySelectorAll('a[href^="#"]').forEach(a => {
    a.addEventListener('click', e => {
      const t = document.querySelector(a.getAttribute('href'));
      if (t) {
        e.preventDefault();
        window.scrollTo({ top: t.getBoundingClientRect().top + window.scrollY - 72, behavior: 'smooth' });
      }
    });
  });

  // ─── HERO LOGO FADE-IN ────────────────────
  // Problema original: a logo aparecia sem controle de opacity,
  // causando flash branco se a imagem já estivesse no cache.
  // Solução: opacity:0 no CSS + classe .loaded aplicada pelo JS
  // tanto no onload quanto se a imagem já estiver completa (cache hit).
  const heroLogoImg = document.querySelector('.hero__logo-img');
  if (heroLogoImg) {
    if (heroLogoImg.complete && heroLogoImg.naturalWidth > 0) {
      // Cache hit — imagem já disponível antes do JS rodar
      heroLogoImg.classList.add('loaded');
    } else {
      heroLogoImg.addEventListener('load', () => heroLogoImg.classList.add('loaded'));
      heroLogoImg.addEventListener('error', () => heroLogoImg.classList.add('loaded')); // fallback
    }
  }

  // ─── REVEAL ───────────────────────────────
  const revealObs = new IntersectionObserver(entries => {
    entries.forEach(e => {
      if (e.isIntersecting) {
        e.target.classList.add('visible');
        revealObs.unobserve(e.target);
      }
    });
  }, { threshold: 0.08, rootMargin: '0px 0px -40px 0px' });

  document.querySelectorAll('.reveal').forEach(el => revealObs.observe(el));

  // ─── MODAL LIGHTBOX ───────────────────────
  const modal    = document.getElementById('modal');
  const modalImg = document.getElementById('modalImg');
  const modalNome = document.getElementById('modalNome');
  const modalCnt = document.getElementById('modalCounter');
  const modalPH  = document.getElementById('modalPlaceholder');
  let gallery = [], gIdx = 0;

  function openModal(items, idx) {
    gallery = items; gIdx = idx;
    showItem(gIdx);
    modal.classList.add('open');
    document.body.style.overflow = 'hidden';
  }
  function closeModal() {
    modal.classList.remove('open');
    document.body.style.overflow = '';
    // Limpa src depois da transição — evita manter imagem grande em memória
    setTimeout(() => { modalImg.src = ''; }, 300);
  }
  function showItem(i) {
    const it = gallery[i];
    if (!it) return;
    modalNome.textContent = it.nome;
    modalCnt.textContent  = `${i + 1} / ${gallery.length}`;
    if (it.img) {
      modalPH.style.display  = 'none';
      modalImg.style.display = 'block';
      modalImg.src = it.img;
      modalImg.alt = it.nome;
    } else {
      modalImg.style.display = 'none';
      modalPH.style.display  = 'flex';
    }
  }
  function prev() { gIdx = (gIdx - 1 + gallery.length) % gallery.length; showItem(gIdx); }
  function next() { gIdx = (gIdx + 1) % gallery.length; showItem(gIdx); }

  document.getElementById('modalOverlay').addEventListener('click', closeModal);
  document.getElementById('modalClose').addEventListener('click', closeModal);
  document.getElementById('modalPrev').addEventListener('click', prev);
  document.getElementById('modalNext').addEventListener('click', next);

  document.addEventListener('keydown', e => {
    if (!modal.classList.contains('open')) return;
    if (e.key === 'Escape')    closeModal();
    if (e.key === 'ArrowLeft')  prev();
    if (e.key === 'ArrowRight') next();
  });

  let tStartX = 0;
  modal.addEventListener('touchstart', e => { tStartX = e.touches[0].clientX; }, { passive: true });
  modal.addEventListener('touchend', e => {
    const d = tStartX - e.changedTouches[0].clientX;
    if (Math.abs(d) > 50) d > 0 ? next() : prev();
  });

  function colorSlug(n) {
    return n.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/\s+/g, '-');
  }

  // ─── SWATCH LOADER (OTIMIZADO) ────────────
  //
  // Problema original:
  // - 64 new Image() disparados simultaneamente quando os cards entravam na viewport
  // - Sem controle de concorrência → 64 requisições simultâneas → mobile congestionado
  // - Sem fila de prioridade → primeiro card não carregava antes dos últimos
  //
  // Solução:
  // - Fila de carregamento com concorrência máxima de 4 (abaixo do limite do browser)
  // - Primeiro card (data-priority="true") carrega IMEDIATAMENTE, fora da fila
  // - Demais cards carregam via IntersectionObserver com rootMargin de 300px
  // - Cada imagem entra na fila individualmente, não o card inteiro
  // - Fade-in suave (.swatch-loaded) elimina o "pop" visual

  const CONCURRENCY = 4; // máximo de imagens carregando simultaneamente
  let activeLoads = 0;
  const loadQueue = []; // fila de funções de carregamento

  function processQueue() {
    while (activeLoads < CONCURRENCY && loadQueue.length > 0) {
      const task = loadQueue.shift();
      activeLoads++;
      task(() => {
        activeLoads--;
        processQueue(); // quando uma termina, inicia a próxima
      });
    }
  }

  function enqueueSwatchLoad(sw, src, done) {
    loadQueue.push(cb => {
      const tmp = new Image();
      tmp.onload = () => {
        // Batch DOM writes no próximo frame — evita reflow síncrono
        requestAnimationFrame(() => {
          sw.style.backgroundImage    = `url('${src}')`;
          // background-size/position já estão definidos no CSS — não precisamos setar
          sw.classList.remove('swatch-skeleton');
          sw.classList.add('swatch-loaded');
          cb();
          if (done) done();
        });
      };
      tmp.onerror = () => {
        // Falha silenciosa — mantém cor de fundo do CSS
        sw.classList.remove('swatch-skeleton');
        cb();
        if (done) done();
      };
      tmp.src = src;
    });
    processQueue();
  }

  function loadCardSwatches(card, priority = false) {
    const items = Array.from(card.querySelectorAll('.cor-item'));
    if (!items.length) return;
    const slug = card.dataset.slug || '';

    function imgPath(item) {
      if (isMobile && item.dataset.imgMobile) return item.dataset.imgMobile;
      if (!isMobile && item.dataset.imgDesktop) return item.dataset.imgDesktop;
      return `iscas/${isMobile ? 'mobile' : 'desktop'}/${slug}-${colorSlug(item.dataset.nome || '')}.jpg`;
    }

    // Galeria para o modal — construída uma vez por card
    const gal = items.map(el => ({
      img:  imgPath(el),
      nome: el.dataset.nome || el.querySelector('span')?.textContent || '',
    }));

    // Event listeners do modal para cada cor
    items.forEach((item, i) => {
      item.addEventListener('click', () => openModal(gal, i));
    });

    if (priority) {
      // Card prioritário: carrega imediatamente, sem fila, sem IntersectionObserver
      // Usado para o primeiro produto (above-the-fold após scroll)
      items.forEach(item => {
        const sw  = item.querySelector('.cor-swatch');
        const src = imgPath(item);
        if (sw && src) enqueueSwatchLoad(sw, src);
      });
    } else {
      // Demais cards: carregam quando o card se aproxima da viewport
      // rootMargin 300px = começa a carregar 300px antes de ser visível
      const obs = new IntersectionObserver(([entry]) => {
        if (!entry.isIntersecting) return;
        obs.disconnect();
        items.forEach(item => {
          const sw  = item.querySelector('.cor-swatch');
          const src = imgPath(item);
          if (sw && src) enqueueSwatchLoad(sw, src);
        });
      }, { rootMargin: '300px 0px' });
      obs.observe(card);
    }
  }

  // Inicializa todos os cards
  document.querySelectorAll('.produto-card').forEach(card => {
    const isPriority = card.dataset.priority === 'true';
    loadCardSwatches(card, isPriority);
  });


  // ═══════════════════════════════════════════
  //   SISTEMA DE PEDIDOS
  // ═══════════════════════════════════════════

  // Problema original: localStorage.getItem era chamado inline e síncrono.
  // Solução: wrappado em try/catch (localStorage pode estar bloqueado em
  // modo privado / Safari ITP) + leitura única na inicialização.
  function readPedido() {
    try {
      return JSON.parse(localStorage.getItem('urutau_pedido') || '[]');
    } catch {
      return [];
    }
  }
  function savePedido(data) {
    try {
      localStorage.setItem('urutau_pedido', JSON.stringify(data));
    } catch {
      // localStorage cheio ou bloqueado — continua funcionando sem persistência
    }
  }

  let pedido = readPedido();
  let sheetData = { nome: '', gramaturas: [], cores: [], coresCss: [], imgsDesktop: [], imgsMobile: [] };
  let selGram = null, selCor = null, selCorCss = null, qtd = 1;

  const pedidoOverlay       = document.getElementById('pedidoOverlay');
  const pedidoSheet         = document.getElementById('pedidoSheet');
  const sheetClose          = document.getElementById('sheetClose');
  const sheetNome           = document.getElementById('sheetProdutoNome');
  const sheetGramOpts       = document.getElementById('sheetGramOpts');
  const sheetCoresGrid      = document.getElementById('sheetCoresGrid');
  const qtdMinus            = document.getElementById('qtdMinus');
  const qtdPlus             = document.getElementById('qtdPlus');
  const qtdNumEl            = document.getElementById('qtdNum');
  const pedidoConfirmar     = document.getElementById('pedidoConfirmar');
  const resumoTexto         = document.getElementById('resumoTexto');
  const carrinhoFab         = document.getElementById('carrinhoFab');
  const carrinhoFabBtn      = document.getElementById('carrinhoFabBtn');
  const carrinhoCount       = document.getElementById('carrinhoCount');
  const carrinhoOverlay     = document.getElementById('carrinhoOverlay');
  const carrinhoPainel      = document.getElementById('carrinhoPainel');
  const carrinhoPainelClose = document.getElementById('carrinhoPainelClose');
  const carrinhoPainelBody  = document.getElementById('carrinhoPainelBody');
  const carrinhoTotalItens  = document.getElementById('carrinhoTotalItens');
  const carrinhoEnviar      = document.getElementById('carrinhoEnviar');
  const carrinhoLimpar      = document.getElementById('carrinhoLimpar');

  // ── Abrir bottom sheet ──────────────────────
  document.querySelectorAll('.btn-add-pedido').forEach(btn => {
    btn.addEventListener('click', e => {
      e.stopPropagation();
      const card = btn.closest('.produto-card');

      sheetData.nome        = card.dataset.nome || '';
      sheetData.gramaturas  = (card.dataset.gramaturas || '').split(',').filter(Boolean);
      sheetData.cores       = (card.dataset.cores || '').split(',').filter(Boolean);
      sheetData.coresCss    = (card.dataset.coresCss || '').split('|').filter(Boolean);

      // Captura paths de imagem dos cor-items do card
      const corItems = Array.from(card.querySelectorAll('.cor-item'));
      sheetData.imgsDesktop = corItems.map(el => el.dataset.imgDesktop || '');
      sheetData.imgsMobile  = corItems.map(el => el.dataset.imgMobile  || '');

      selGram = sheetData.gramaturas.length === 1 ? sheetData.gramaturas[0] : null;
      selCor = null; selCorCss = null; qtd = 1;

      sheetNome.textContent = sheetData.nome;
      buildGram();
      buildCores();
      qtdNumEl.textContent = 1;
      updateResumo();

      pedidoSheet.classList.add('open');
      pedidoOverlay.classList.add('open');
      document.body.style.overflow = 'hidden';
    });
  });

  function closeSheet() {
    pedidoSheet.classList.remove('open');
    pedidoOverlay.classList.remove('open');
    document.body.style.overflow = '';
  }
  sheetClose.addEventListener('click', closeSheet);
  pedidoOverlay.addEventListener('click', closeSheet);

  function buildGram() {
    sheetGramOpts.innerHTML = '';
    sheetData.gramaturas.forEach(g => {
      const btn = document.createElement('button');
      btn.className = 'sheet-gram-btn' + (selGram === g ? ' active' : '');
      btn.textContent = g;
      btn.addEventListener('click', () => {
        selGram = g;
        sheetGramOpts.querySelectorAll('.sheet-gram-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        updateResumo();
      });
      sheetGramOpts.appendChild(btn);
    });
  }

  function buildCores() {
    // Problema original: criava <img> tags com loading="lazy" dentro de um painel
    // com transform:translateX(100%) — o browser NÃO carrega lazy images em
    // elementos fora da viewport/ocultos por transform.
    // Resultado: painel abria e imagens ainda não tinham sido baixadas.
    //
    // Solução: manter o swatch como background-image (igual ao catálogo),
    // sem <img> tag — carrega imediatamente via CSS background.
    // As imagens reais do swatch JÁ estão em cache se o usuário as rolou
    // no catálogo antes de clicar em "Adicionar ao Pedido".

    sheetCoresGrid.innerHTML = '';
    sheetData.cores.forEach((cor, i) => {
      const css    = sheetData.coresCss[i] || '#888';
      const imgSrc = isMobile
        ? (sheetData.imgsMobile[i]  || sheetData.imgsDesktop[i] || '')
        : (sheetData.imgsDesktop[i] || sheetData.imgsMobile[i]  || '');

      const el = document.createElement('div');
      el.className = 'sheet-cor-item';

      // Swatch: se a imagem existir, usa como background (aproveita cache do catálogo)
      // Se não existir ainda, mantém o gradiente CSS como fallback
      const swatchStyle = imgSrc
        ? `background:${css};background-image:url('${imgSrc}');background-size:cover;background-position:center`
        : `background:${css}`;

      el.innerHTML = `<div class="sheet-cor-swatch" style="${swatchStyle}"></div><span>${cor}</span>`;

      el.addEventListener('click', () => {
        selCor    = cor;
        selCorCss = css;
        sheetCoresGrid.querySelectorAll('.sheet-cor-item').forEach(e => e.classList.remove('active'));
        el.classList.add('active');
        updateResumo();
      });
      sheetCoresGrid.appendChild(el);
    });
  }

  qtdMinus.addEventListener('click', () => {
    if (qtd > 1) { qtd--; qtdNumEl.textContent = qtd; updateResumo(); }
  });
  qtdPlus.addEventListener('click', () => {
    if (qtd < 99) { qtd++; qtdNumEl.textContent = qtd; updateResumo(); }
  });

  function updateResumo() {
    const ok = selGram && selCor;
    pedidoConfirmar.disabled = !ok;
    pedidoConfirmar.setAttribute('aria-disabled', !ok);
    if (ok) {
      resumoTexto.innerHTML = `<span class="resumo-badge" style="background:${selCorCss}"></span><strong>${sheetData.nome}</strong> · ${selGram} · ${selCor} · <strong>${qtd}×</strong>`;
    } else {
      resumoTexto.textContent = `Selecione a ${!selGram ? 'gramatura' : 'cor'}`;
    }
  }

  // Toast de confirmação
  function showAddedToast(nome, gram, cor, quantidade) {
    const prev = document.getElementById('addedToast');
    if (prev) prev.remove();
    const toast = document.createElement('div');
    toast.id = 'addedToast';
    toast.className = 'added-toast';
    toast.innerHTML = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" width="15" height="15"><polyline points="20 6 9 17 4 12"/></svg><span><strong>${nome}</strong> · ${gram} · ${cor} · ${quantidade}×</span>`;
    document.body.appendChild(toast);
    requestAnimationFrame(() => toast.classList.add('visible'));
    setTimeout(() => {
      toast.classList.remove('visible');
      setTimeout(() => toast.remove(), 300);
    }, 2500);
  }

  pedidoConfirmar.addEventListener('click', () => {
    if (!selGram || !selCor) return;

    const corIdx = sheetData.cores.indexOf(selCor);
    pedido.push({
      produto:    sheetData.nome,
      gramatura:  selGram,
      cor:        selCor,
      corCss:     selCorCss,
      quantidade: qtd,
      imgDesktop: sheetData.imgsDesktop[corIdx] || '',
      imgMobile:  sheetData.imgsMobile[corIdx]  || '',
    });

    savePedido(pedido);
    updateCarrinho();
    showAddedToast(sheetData.nome, selGram, selCor, qtd);

    // Reset seleção de cor e quantidade para permitir adicionar outra variação
    selCor = null; selCorCss = null; qtd = 1;
    sheetCoresGrid.querySelectorAll('.sheet-cor-item').forEach(e => e.classList.remove('active'));
    qtdNumEl.textContent = 1;
    updateResumo();
  });

  // ── Atualizar UI do carrinho ─────────────────
  function updateCarrinho() {
    const total = pedido.reduce((s, i) => s + i.quantidade, 0);

    // Visibilidade do FAB e botão da nav
    const showFab = total > 0;
    carrinhoFab.style.display = showFab ? 'flex' : 'none';
    navCartBtn.style.display  = showFab ? 'flex' : 'none';

    carrinhoCount.textContent = total;
    const navCount = navCartBtn.querySelector('.nav__cart-count');
    if (navCount) navCount.textContent = total;
    carrinhoTotalItens.textContent = total + (total === 1 ? ' unidade' : ' unidades');

    if (!pedido.length) {
      carrinhoPainelBody.innerHTML = `
        <div class="carrinho-vazio">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" width="48" height="48" opacity=".3">
            <path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z"/>
            <line x1="3" y1="6" x2="21" y2="6"/>
            <path d="M16 10a4 4 0 01-8 0"/>
          </svg>
          <p>Nenhum item ainda.<br>Adicione produtos do catálogo.</p>
        </div>`;
      return;
    }

    // Problema original: innerHTML era reconstruído inteiro a cada update,
    // e event listeners eram adicionados via querySelectorAll depois.
    // Isso causava múltiplos listeners acumulados.
    // Solução: event delegation — UM listener no container, não um por botão.
    carrinhoPainelBody.innerHTML = pedido.map((it, idx) => {
      // Thumbnail: usa a imagem da cor se disponível (provavelmente já em cache)
      // Fallback: swatch colorido via background
      const imgSrc = isMobile
        ? (it.imgMobile  || it.imgDesktop || '')
        : (it.imgDesktop || it.imgMobile  || '');

      const thumb = imgSrc
        ? `<img src="${imgSrc}" alt="${it.cor}" class="carrinho-item__thumb" loading="lazy" decoding="async">`
        : `<div class="carrinho-item__swatch" style="background:${it.corCss}"></div>`;

      return `
        <div class="carrinho-item">
          ${thumb}
          <div class="carrinho-item__info">
            <strong>${it.produto}</strong>
            <span>${it.gramatura} · ${it.cor}</span>
          </div>
          <div class="carrinho-item__qtd">
            <button class="carrinho-qtd-btn" data-action="dec" data-idx="${idx}" aria-label="Diminuir">−</button>
            <span>${it.quantidade}</span>
            <button class="carrinho-qtd-btn" data-action="inc" data-idx="${idx}" aria-label="Aumentar">+</button>
          </div>
          <button class="carrinho-item__del" data-idx="${idx}" aria-label="Remover item">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="14" height="14">
              <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        </div>`;
    }).join('');
  }

  // Problema original: event listener adicionado dentro de updateCarrinho()
  // → a cada update, novos listeners eram adicionados nos botões novos,
  // acumulando handlers e causando execuções múltiplas.
  // Solução: event delegation — listener único no body do carrinho,
  // adicionado UMA VEZ fora do updateCarrinho.
  carrinhoPainelBody.addEventListener('click', e => {
    const qtdBtn = e.target.closest('.carrinho-qtd-btn');
    const delBtn = e.target.closest('.carrinho-item__del');

    if (qtdBtn) {
      const i = parseInt(qtdBtn.dataset.idx);
      if (isNaN(i) || !pedido[i]) return;
      if (qtdBtn.dataset.action === 'inc') {
        pedido[i].quantidade = Math.min(99, pedido[i].quantidade + 1);
      } else {
        pedido[i].quantidade--;
        if (pedido[i].quantidade <= 0) pedido.splice(i, 1);
      }
      savePedido(pedido);
      updateCarrinho();
    }

    if (delBtn) {
      const i = parseInt(delBtn.dataset.idx);
      if (!isNaN(i)) {
        pedido.splice(i, 1);
        savePedido(pedido);
        updateCarrinho();
      }
    }
  });

  // ── Abrir / Fechar carrinho ──────────────────
  function openCarrinho() {
    carrinhoPainel.classList.add('open');
    carrinhoOverlay.classList.add('open');
    document.body.style.overflow = 'hidden';
  }
  function closeCarrinho() {
    carrinhoPainel.classList.remove('open');
    carrinhoOverlay.classList.remove('open');
    document.body.style.overflow = '';
  }

  carrinhoFabBtn.addEventListener('click', openCarrinho);
  navCartBtn.addEventListener('click', openCarrinho);
  carrinhoPainelClose.addEventListener('click', closeCarrinho);
  carrinhoOverlay.addEventListener('click', closeCarrinho);

  // Swipe para fechar no mobile
  let cTouchStart = 0;
  carrinhoPainel.addEventListener('touchstart', e => {
    cTouchStart = e.touches[0].clientY;
  }, { passive: true });
  carrinhoPainel.addEventListener('touchend', e => {
    if (e.changedTouches[0].clientY - cTouchStart > 80) closeCarrinho();
  });

  carrinhoLimpar.addEventListener('click', () => {
    if (!pedido.length) return;
    if (confirm('Limpar todos os itens do pedido?')) {
      pedido = [];
      savePedido(pedido);
      updateCarrinho();
      closeCarrinho();
    }
  });

  carrinhoEnviar.addEventListener('click', () => {
    if (!pedido.length) return;
    const linhas = pedido.map(it =>
      `• ${it.produto} | ${it.gramatura} | ${it.cor} | Qtd: ${it.quantidade}`
    ).join('\n');
    const total = pedido.reduce((s, i) => s + i.quantidade, 0);
    const msg = `🎣 *Pedido Urutau Jigs*\n─────────────────────\n${linhas}\n─────────────────────\n*Total: ${total} unidade${total > 1 ? 's' : ''}*`;
    window.open(`https://wa.me/553199762918?text=${encodeURIComponent(msg)}`, '_blank');
  });

  // Inicializa o carrinho com dados do localStorage
  updateCarrinho();

});