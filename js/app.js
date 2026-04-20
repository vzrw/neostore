/* إعدادات عامة */
const SITE_FILE = "site-data.json";
const ASSETS_DIR = "assets";

function safePrice(val) {
  const n = parseFloat(val);
  return Number.isFinite(n) ? n : 0;
}

async function loadSite() {
  const res = await fetch(`${SITE_FILE}?v=${Date.now()}`, { cache: 'no-store' });
  return await res.json();
}

function resolveImagePath(path) {
  if (!path) return "";
  const trimmed = path.trim();
  if (!trimmed) return "";
  const lower = trimmed.toLowerCase();
  if (lower.startsWith("http://") || lower.startsWith("https://") || lower.startsWith("//")) return trimmed;
  return trimmed.startsWith('assets/') ? trimmed : `${ASSETS_DIR}/${trimmed}`;
}

function getProductImages(product) {
  const raw = product.images || "";
  return raw.split("|").map(s => resolveImagePath(s)).filter(Boolean);
}

function parseOptions(product) {
  const raw = product.options || "";
  if (!raw.trim()) return [];
  return raw
    .split("|")
    .map(part => {
      const [labelPart, pricePart] = part.split(":");
      const label = (labelPart || "").trim();
      const price = safePrice((pricePart || "").trim());
      if (!label || !Number.isFinite(price)) return null;
      return { label, price };
    })
    .filter(Boolean);
}

function loadCart() {
  try { return JSON.parse(localStorage.getItem("cart") || "[]"); }
  catch { return []; }
}

function saveCart(cart) {
  localStorage.setItem("cart", JSON.stringify(cart));
  updateCartCount();
}

function updateCartCount() {
  const el = document.getElementById("cart-count");
  if (!el) return;
  const cart = loadCart();
  const totalQty = cart.reduce((sum, item) => sum + item.qty, 0);
  el.textContent = totalQty;
}

function showToast(text = "تمت إضافة المنتج للسلة 🛒") {
  let toast = document.getElementById("toast");
  if (!toast) {
    toast = document.createElement("div");
    toast.id = "toast";
    toast.className = "toast";
    document.body.appendChild(toast);
  }
  toast.textContent = text;
  toast.classList.add("show");
  clearTimeout(toast._timer);
  toast._timer = setTimeout(() => { toast.classList.remove("show"); }, 2000);
}

function applyLanguage(lang) {
  const html = document.documentElement;
  html.lang = lang;
  html.dir = lang === "ar" ? "rtl" : "ltr";

  document.querySelectorAll(".lang-toggle").forEach(btn => {
    const bLang = btn.getAttribute("data-lang");
    btn.classList.toggle("active", bLang === lang);
  });

  document.querySelectorAll("[data-i18n-ar]").forEach(el => {
    const ar = el.getAttribute("data-i18n-ar") || "";
    const en = el.getAttribute("data-i18n-en") || ar;
    el.textContent = lang === "ar" ? ar : en;
  });

  localStorage.setItem("devstore_lang", lang);
}

function applySettings(site) {
  const titleParts = document.title.split(' - ');
  if (titleParts.length > 1) document.title = `${titleParts[0]} - ${site.settings.storeName}`;
  else document.title = document.title.replace('dev', site.settings.storeName);

  document.querySelectorAll('.logo-img').forEach(img => {
    img.src = resolveImagePath(site.settings.logo || 'assets/logo.png');
    img.alt = `شعار ${site.settings.storeName}`;
  });
  document.querySelectorAll('.logo-text').forEach(el => {
    const txt = el.textContent;
    el.textContent = txt.replace('dev', site.settings.storeName).replace('متجر Neostore','متجر ' + site.settings.storeName);
    if (el.textContent.trim() === 'إدارة Neostore') el.textContent = 'إدارة ' + site.settings.storeName;
  });
  document.querySelectorAll('.whatsapp-btn').forEach(a => a.href = `https://wa.me/${site.settings.whatsappPhone}`);
  document.querySelectorAll('.instagram-btn').forEach(a => a.href = site.settings.instagramUrl || '#');
  const heroH1 = document.querySelector('.hero h1');
  const heroP = document.querySelector('.hero p');
  if (heroH1) heroH1.textContent = site.settings.heroTitle || heroH1.textContent;
  if (heroP) heroP.textContent = site.settings.heroDesc || heroP.textContent;
  document.querySelectorAll('.main-footer p').forEach(p => p.innerHTML = `© <span id="year"></span> ${site.settings.storeName}`);
}

function renderCategoriesGrid(categories) {
  const grid = document.getElementById("categories-grid");
  if (!grid) return;
  grid.innerHTML = "";

  categories.filter(c => c.active !== false && c.active !== '0').forEach(cat => {
    const card = document.createElement("div");
    card.className = "category-card";
    card.onclick = () => { location.href = `category.html?key=${encodeURIComponent(cat.key)}`; };

    const bannerWrapper = document.createElement("div");
    bannerWrapper.className = "category-banner-wrapper";
    const banner = document.createElement("img");
    banner.className = "category-banner";
    banner.src = resolveImagePath(cat.banner_image);
    banner.alt = cat.name_ar;
    bannerWrapper.appendChild(banner);

    const body = document.createElement("div");
    body.className = "category-card-body";
    const title = document.createElement("div");
    title.className = "category-card-title";
    title.textContent = cat.name_ar;
    const subtitle = document.createElement("div");
    subtitle.className = "category-card-subtitle";
    subtitle.textContent = cat.name_en || "";
    body.appendChild(title); body.appendChild(subtitle);
    card.appendChild(bannerWrapper); card.appendChild(body); grid.appendChild(card);
  });
}

function getParam(name) {
  const url = new URL(location.href);
  return url.searchParams.get(name);
}

function renderProductsGrid(products, categoryKey, currency='ر.ع') {
  const grid = document.getElementById("products-grid");
  const empty = document.getElementById("no-products");
  if (!grid) return;
  grid.innerHTML = "";
  const activeProducts = products.filter(p => p.active !== false && p.active !== '0');
  if (!activeProducts.length) {
    if (empty) empty.style.display = "block";
    return;
  } else if (empty) empty.style.display = "none";

  activeProducts.forEach(p => {
    p.category = categoryKey;
    const options = parseOptions(p);
    const card = document.createElement("div");
    card.className = "product-card";
    card.addEventListener("click", e => {
      if ((e.target.tagName || "").toLowerCase() === "button") return;
      location.href = `product.html?cat=${encodeURIComponent(categoryKey)}&id=${encodeURIComponent(p.id)}`;
    });

    const imgWrap = document.createElement("div");
    imgWrap.className = "product-image-wrapper";
    const img = document.createElement("img");
    const imgs = getProductImages(p);
    img.src = imgs[0] || "";
    img.alt = p.name_ar;
    imgWrap.appendChild(img);
    if (p.status) {
      const badge = document.createElement("div");
      badge.className = "product-status-badge";
      if (p.status === "sale") badge.classList.add("product-status-sale");
      if (p.status === "soldout") badge.classList.add("product-status-soldout");
      badge.textContent = p.status === "new" ? "جديد" : p.status === "sale" ? "عرض" : p.status === "soldout" ? "منتهي" : "";
      imgWrap.appendChild(badge);
    }

    const body = document.createElement("div");
    body.className = "product-card-body";
    const nameEl = document.createElement("div");
    nameEl.className = "product-name";
    nameEl.textContent = p.name_ar;
    const priceRow = document.createElement("div");
    priceRow.className = "product-price-row";

    let mainPrice;
    let showOldPrice = false;
    let oldPriceValue = null;
    if (options.length) mainPrice = options[0].price;
    else {
      const useDiscount = p.discount_price_omr && p.discount_price_omr.trim() !== "";
      mainPrice = useDiscount ? safePrice(p.discount_price_omr) : safePrice(p.price_omr);
      if (useDiscount) { showOldPrice = true; oldPriceValue = safePrice(p.price_omr); }
    }

    const price = document.createElement("span");
    price.className = "product-price";
    price.textContent = `${mainPrice.toFixed(3)} ${currency}`;
    priceRow.appendChild(price);
    if (showOldPrice && oldPriceValue != null) {
      const old = document.createElement("span");
      old.className = "product-old-price";
      old.textContent = `${oldPriceValue.toFixed(3)} ${currency}`;
      priceRow.appendChild(old);
    }

    const shortDesc = document.createElement("div");
    shortDesc.className = "product-short-desc";
    shortDesc.textContent = p.short_desc_ar || "";

    const actions = document.createElement("div");
    actions.className = "product-card-actions";
    const buyBtn = document.createElement("button");
    buyBtn.className = "btn-primary";
    buyBtn.textContent = "شراء الآن";
    buyBtn.addEventListener("click", e => {
      e.stopPropagation();
      if (options.length) openOptionModal(p, categoryKey, 'buy');
      else buyNow(p, 1, categoryKey, null);
    });
    const cartBtn = document.createElement("button");
    cartBtn.className = "btn-secondary";
    cartBtn.textContent = "إضافة للسلة";
    cartBtn.addEventListener("click", e => {
      e.stopPropagation();
      if (options.length) openOptionModal(p, categoryKey, 'cart');
      else { addToCart(p, 1, categoryKey, null); showToast(); }
    });
    if (p.status === 'soldout') { buyBtn.disabled = true; cartBtn.disabled = true; }
    actions.appendChild(buyBtn); actions.appendChild(cartBtn);

    body.appendChild(nameEl); body.appendChild(priceRow); body.appendChild(shortDesc); body.appendChild(actions);
    card.appendChild(imgWrap); card.appendChild(body); grid.appendChild(card);
  });
}

async function initCategoryPage(site) {
  const key = getParam("key");
  if (!key) return;
  const category = site.categories.find(c => c.key === key);
  if (!category) return;
  const titleEl = document.getElementById("category-title");
  const bannerEl = document.getElementById("category-banner");
  if (titleEl) titleEl.textContent = category.name_ar;
  if (bannerEl) { bannerEl.src = resolveImagePath(category.banner_image); bannerEl.alt = category.name_ar; }
  const products = site.products[key] || [];
  renderProductsGrid(products, key, site.settings.currency || 'ر.ع');
  const searchInput = document.getElementById("search-input");
  if (searchInput) {
    searchInput.addEventListener("input", e => {
      const term = e.target.value.trim().toLowerCase();
      if (!term) return renderProductsGrid(products, key, site.settings.currency || 'ر.ع');
      const filtered = products.filter(p => ((p.name_ar || '').toLowerCase().includes(term) || (p.name_en || '').toLowerCase().includes(term)));
      renderProductsGrid(filtered, key, site.settings.currency || 'ر.ع');
    });
  }
}

function renderSingleProduct(product, categoryKey, currency='ر.ع') {
  const section = document.getElementById("product-section");
  if (!section) return;
  section.innerHTML = "";
  const options = parseOptions(product);

  const gallery = document.createElement("div");
  gallery.className = "product-gallery-main";
  const mainWrap = document.createElement("div");
  mainWrap.className = "product-image-wrapper";
  const mainImg = document.createElement("img");
  const imgs = getProductImages(product);
  mainImg.src = imgs[0] || "";
  mainImg.alt = product.name_ar;
  mainWrap.appendChild(mainImg);
  const thumbs = document.createElement("div");
  thumbs.className = "product-thumbs";
  imgs.forEach((src, idx) => {
    const t = document.createElement("img"); t.src = src; if (idx===0) t.classList.add('active-thumb');
    t.addEventListener('click',()=>{ mainImg.src=src; document.querySelectorAll('.product-thumbs img').forEach(i=>i.classList.remove('active-thumb')); t.classList.add('active-thumb'); });
    thumbs.appendChild(t);
  });
  gallery.appendChild(mainWrap); gallery.appendChild(thumbs);

  const details = document.createElement("div");
  details.className = "product-details";
  const title = document.createElement("h1"); title.className='product-details-title'; title.textContent = product.name_ar;
  const priceRow = document.createElement("div"); priceRow.className='product-details-price-row';
  let mainPrice, useDiscount=false, currentOption=null;
  if (options.length) { currentOption=options[0]; mainPrice=currentOption.price; }
  else { useDiscount = product.discount_price_omr && product.discount_price_omr.trim()!==''; mainPrice = useDiscount ? safePrice(product.discount_price_omr) : safePrice(product.price_omr); }
  const price = document.createElement('span'); price.className='product-price'; price.textContent=`${mainPrice.toFixed(3)} ${currency}`; priceRow.appendChild(price);
  if (!options.length && useDiscount) { const old=document.createElement('span'); old.className='product-old-price'; old.textContent=`${safePrice(product.price_omr).toFixed(3)} ${currency}`; priceRow.appendChild(old); }
  const shortDesc=document.createElement('p'); shortDesc.className='product-details-short'; shortDesc.textContent=product.short_desc_ar||'';
  const longDesc=document.createElement('p'); longDesc.className='product-details-long collapsed'; longDesc.innerHTML = (product.long_desc_ar || '').replace(/\r?\n/g, '<br>');
  const readMore=document.createElement('button'); readMore.className='read-more-btn'; readMore.textContent='إظهار المزيد';
  readMore.addEventListener('click',()=>{ const collapsed=longDesc.classList.toggle('collapsed'); readMore.textContent=collapsed?'إظهار المزيد':'إظهار أقل'; });

  details.appendChild(title);
  if (options.length) {
    const optsBlock=document.createElement('div'); optsBlock.className='product-options-block';
    const optsTitle=document.createElement('div'); optsTitle.className='product-options-title'; optsTitle.textContent='اختر النسخة أو الخطة:'; optsBlock.appendChild(optsTitle);
    if (options.length <= 5) {
      options.forEach((opt, idx)=>{
        const wrapper=document.createElement('label'); wrapper.className='product-option-radio';
        wrapper.innerHTML=`<input type="radio" name="product-option" value="${opt.label}" ${idx===0?'checked':''}><span class="product-option-text"><span class="product-option-label">${opt.label}</span><span class="product-option-price">${opt.price.toFixed(3)} ${currency}</span></span>`;
        wrapper.querySelector('input').addEventListener('change',()=>{ currentOption=opt; mainPrice=opt.price; price.textContent=`${mainPrice.toFixed(3)} ${currency}`; });
        optsBlock.appendChild(wrapper);
      });
    } else {
      const select=document.createElement('select'); select.className='product-options-select';
      options.forEach((opt, idx)=>{ const optionEl=document.createElement('option'); optionEl.value=opt.label; optionEl.textContent=`${opt.label} - ${opt.price.toFixed(3)} ${currency}`; if(idx===0) optionEl.selected=true; select.appendChild(optionEl); });
      select.addEventListener('change',e=>{ const opt=options.find(o=>o.label===e.target.value); if(!opt) return; currentOption=opt; mainPrice=opt.price; price.textContent=`${mainPrice.toFixed(3)} ${currency}`; });
      optsBlock.appendChild(select);
    }
    details.appendChild(optsBlock);
  }

  details.appendChild(priceRow); details.appendChild(shortDesc); details.appendChild(longDesc); details.appendChild(readMore);
  const actions=document.createElement('div'); actions.className='product-details-actions';
  const qtyInput=document.createElement('input'); qtyInput.type='number'; qtyInput.min='1'; qtyInput.value='1'; qtyInput.className='qty-input';
  const addBtn=document.createElement('button'); addBtn.className='btn-secondary'; addBtn.textContent='إضافة للسلة'; addBtn.addEventListener('click',()=>{ const qty=parseInt(qtyInput.value)||1; addToCart(product, qty, categoryKey, currentOption); showToast(); });
  const buyBtn=document.createElement('button'); buyBtn.className='btn-primary'; buyBtn.textContent='شراء الآن عبر واتساب'; buyBtn.addEventListener('click',()=>{ const qty=parseInt(qtyInput.value)||1; buyNow(product, qty, categoryKey, currentOption); });
  if (product.status==='soldout') { addBtn.disabled=true; buyBtn.disabled=true; qtyInput.disabled=true; }
  actions.appendChild(qtyInput); actions.appendChild(addBtn); actions.appendChild(buyBtn); details.appendChild(actions);
  section.appendChild(gallery); section.appendChild(details);
}

async function initProductPage(site) {
  const catKey = getParam("cat");
  const id = getParam("id");
  if (!catKey || !id) return;
  const products = site.products[catKey] || [];
  const product = products.find(p => p.id === id);
  if (!product) return;
  renderSingleProduct(product, catKey, site.settings.currency || 'ر.ع');
}

function addToCart(product, qty, categoryKey, chosenOption) {
  const cart = loadCart();
  const images = getProductImages(product);
  const img = images[0] || "";
  const options = parseOptions(product);
  let optionLabel = null; let unitPrice;
  if (options.length) { if (!chosenOption) return; optionLabel = chosenOption.label; unitPrice = chosenOption.price; }
  else { const useDiscount = product.discount_price_omr && product.discount_price_omr.trim() !== ""; unitPrice = useDiscount ? safePrice(product.discount_price_omr) : safePrice(product.price_omr); }
  const existing = cart.find(i => i.id === product.id && i.cat === categoryKey && i.option === optionLabel);
  if (existing) existing.qty += qty;
  else cart.push({ id: product.id, cat: categoryKey, name: product.name_ar, price: unitPrice, qty, image: img, option: optionLabel });
  saveCart(cart);
}

function buyNow(product, qty, categoryKey, chosenOption) { addToCart(product, qty, categoryKey, chosenOption); window.location.href = 'cart.html'; }

function renderCartPage(site) {
  const itemsContainer = document.getElementById('cart-items');
  const emptyEl = document.getElementById('cart-empty');
  const summaryEl = document.getElementById('cart-summary');
  const totalEl = document.getElementById('cart-total');
  if (!itemsContainer) return;
  const cart = loadCart(); itemsContainer.innerHTML='';
  if (!cart.length) { if(emptyEl) emptyEl.style.display='block'; if(summaryEl) summaryEl.style.display='none'; if(totalEl) totalEl.textContent=`0.000 ${site.settings.currency||'ر.ع'}`; return; } else { if(emptyEl) emptyEl.style.display='none'; if(summaryEl) summaryEl.style.display='block'; }
  let total=0;
  cart.forEach((item, idx)=>{
    const row=document.createElement('div'); row.className='cart-item'; row.addEventListener('click',()=>{ window.location.href=`product.html?cat=${encodeURIComponent(item.cat)}&id=${encodeURIComponent(item.id)}`; });
    const pricePer = Number.isFinite(item.price) ? item.price : 0; const lineTotal = pricePer * item.qty; total += lineTotal;
    row.innerHTML=`<div class="cart-item-img-wrapper"><img src="${item.image || ''}"></div><div class="cart-item-info"><div class="cart-item-title">${item.name}${item.option?` (${item.option})`:''}</div><div class="cart-item-meta">سعر الوحدة: ${pricePer.toFixed(3)} ${site.settings.currency||'ر.ع'} × ${item.qty} = ${lineTotal.toFixed(3)} ${site.settings.currency||'ر.ع'}</div></div><div class="cart-item-controls"><div class="cart-qty-row"><input type="number" min="1" value="${item.qty}"></div><button class="cart-remove-btn">حذف</button></div>`;
    const qtyInput=row.querySelector('input'); qtyInput.addEventListener('click',e=>e.stopPropagation()); qtyInput.addEventListener('change',e=>{ e.stopPropagation(); item.qty=parseInt(e.target.value)||1; saveCart(cart); renderCartPage(site); });
    row.querySelector('.cart-remove-btn').addEventListener('click',e=>{ e.stopPropagation(); cart.splice(idx,1); saveCart(cart); renderCartPage(site); });
    itemsContainer.appendChild(row);
  });
  if(totalEl) totalEl.textContent=`${total.toFixed(3)} ${site.settings.currency||'ر.ع'}`;
  const checkoutBtn=document.getElementById('checkout-btn'); if(checkoutBtn) checkoutBtn.onclick=()=>checkoutWhatsApp(site,cart,total);
}

function normalizeInternationalPhone(input) { let s = String(input ?? '').trim(); if (s.startsWith('+')) s = s.slice(1); if (s.startsWith('00')) s = s.slice(2); s = s.replace(/\D/g, ''); return s; }
function buildWhatsAppSendUrl(phone, message) { const cleanPhone = normalizeInternationalPhone(phone); return `https://api.whatsapp.com/send?phone=${cleanPhone}&text=${encodeURIComponent(String(message ?? ''))}`; }
function checkoutWhatsApp(site, cart, total) {
  const agree=document.getElementById('agreeTerms'); const err=document.getElementById('agreementError'); if(agree && !agree.checked){ if(err) err.style.display='block'; return; } if(err) err.style.display='none'; if(!cart.length) return;
  let msg = `${site.settings.storeName}
-------------------
تفاصيل الطلب:

`;
  cart.forEach(item=>{ const pricePer=Number.isFinite(item.price)?item.price:0; const lineTotal=pricePer*item.qty; let name=item.name; if(item.option) name += ` ${item.option}`; msg += `• ${name} ×${item.qty} = ${lineTotal.toFixed(3)} ${site.settings.currency||'ر.ع'}
`; });
  msg += `
المجموع النهائي: ${total.toFixed(3)} ${site.settings.currency||'ر.ع'}

شكراً لاختيارك متجرنا 🌹`;
  window.open(buildWhatsAppSendUrl(site.settings.whatsappPhone, msg), '_blank');
}

let modalProduct = null; let modalCategoryKey = null; let modalAction = null;
function openOptionModal(product, categoryKey, action) {
  modalProduct = product; modalCategoryKey = categoryKey; modalAction = action;
  const modal = document.getElementById('optionModal'); const title = document.getElementById('optionModalTitle'); const optionsBox = document.getElementById('optionModalOptions');
  if(!modal || !title || !optionsBox) return;
  title.textContent = product.name_ar || product.name_en || ''; optionsBox.innerHTML='';
  const options = parseOptions(product);
  options.forEach((opt,idx)=>{ const label=document.createElement('label'); label.innerHTML=`<input type="radio" name="modalOption" value="${opt.label}" ${idx===0?'checked':''}> ${opt.label} - ${opt.price.toFixed(3)} ر.ع`; optionsBox.appendChild(label); });
  modal.style.display='flex'; modal.onclick=e=>{ if(e.target===modal) closeOptionModal(); }; document.getElementById('optionModalCancel').onclick=closeOptionModal; document.getElementById('optionModalConfirm').onclick=confirmOptionModal;
}
function closeOptionModal(){ const modal=document.getElementById('optionModal'); if(modal) modal.style.display='none'; }
function confirmOptionModal(){ const selected=document.querySelector('input[name="modalOption"]:checked'); if(!selected) return; const chosenOption=parseOptions(modalProduct).find(o=>o.label===selected.value); if(!chosenOption) return; if(modalAction==='buy') buyNow(modalProduct,1,modalCategoryKey,chosenOption); else { addToCart(modalProduct,1,modalCategoryKey,chosenOption); showToast(); } closeOptionModal(); }

document.addEventListener('DOMContentLoaded', async()=>{
  updateCartCount();
  const site = await loadSite();
  applySettings(site);
  const savedLang = localStorage.getItem('devstore_lang') || 'ar'; applyLanguage(savedLang);
  document.querySelectorAll('.lang-toggle').forEach(btn=>btn.addEventListener('click',()=>applyLanguage(btn.getAttribute('data-lang')||'ar')));
  const agree=document.getElementById('agreeTerms'); const err=document.getElementById('agreementError'); if(agree && err){ agree.addEventListener('change',()=>{ if(agree.checked) err.style.display='none'; }); }
  const path = location.pathname;
  if (path.endsWith('index.html') || path === '/' || path === '') renderCategoriesGrid(site.categories);
  else if (path.endsWith('category.html')) await initCategoryPage(site);
  else if (path.endsWith('product.html')) await initProductPage(site);
  else if (path.endsWith('cart.html')) renderCartPage(site);
  const yearEl=document.getElementById('year'); if(yearEl) yearEl.textContent=new Date().getFullYear();
});
