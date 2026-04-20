const SITE_FILE = "site-data.json";
let adminSite = null;

async function loadSite(){
  try{
    const res = await fetch(SITE_FILE + '?v=' + Date.now(), {cache:'no-store'});
    return await res.json();
  }catch(e){
    alert('تعذر قراءة site-data.json');
    throw e;
  }
}

function saveLocal(){
  localStorage.setItem('neostore_admin_working_copy', JSON.stringify(adminSite));
}

function getWorkingSite(){
  const saved = localStorage.getItem('neostore_admin_working_copy');
  if(saved){ try{return JSON.parse(saved)}catch(e){} }
  return structuredClone(adminSite);
}

function exportJson(){
  const blob = new Blob([JSON.stringify(adminSite,null,2)], {type:'application/json;charset=utf-8'});
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download='site-data.json'; a.click();
  setTimeout(()=>URL.revokeObjectURL(url), 1000);
}

function fillSettings(){
  document.getElementById('storeNameInput').value = adminSite.settings.storeName || '';
  document.getElementById('heroTitleInput').value = adminSite.settings.heroTitle || '';
  document.getElementById('heroDescInput').value = adminSite.settings.heroDesc || '';
  document.getElementById('logoInput').value = adminSite.settings.logo || 'assets/logo.png';
  document.getElementById('instagramInput').value = adminSite.settings.instagramUrl || '';
  document.getElementById('whatsappInput').value = adminSite.settings.whatsappPhone || '';
  document.getElementById('adminCodeInput').value = adminSite.settings.adminCode || '123456';
}

function renderCategorySelect(){
  const sel = document.getElementById('productCategoryInput');
  sel.innerHTML='';
  adminSite.categories.forEach(cat=>{
    const op=document.createElement('option');
    op.value=cat.key;
    op.textContent=`${cat.name_ar} — ${cat.key}`;
    sel.appendChild(op);
  });
}

function renderCategories(){
  const list=document.getElementById('categoriesList');
  list.innerHTML='';
  adminSite.categories.forEach(cat=>{
    const item=document.createElement('div');
    item.className='admin-item';
    item.innerHTML=`<div><strong>${cat.name_ar}</strong><div class="admin-sub">${cat.key} — ${cat.banner_image}</div></div><div style="display:flex;gap:8px"><button class="btn-secondary edit">تعديل</button><button class="btn-primary del">حذف</button></div>`;
    item.querySelector('.edit').onclick=()=>{
      document.getElementById('catKeyInput').value = cat.key;
      document.getElementById('catNameArInput').value = cat.name_ar;
      document.getElementById('catNameEnInput').value = cat.name_en;
      document.getElementById('catBannerInput').value = cat.banner_image;
      document.getElementById('catActiveInput').value = cat.active ? '1' : '0';
    };
    item.querySelector('.del').onclick=()=>{
      if(!confirm('حذف القسم؟')) return;
      adminSite.categories = adminSite.categories.filter(c=>c.key!==cat.key);
      delete adminSite.products[cat.key];
      saveLocal(); renderAll();
    };
    list.appendChild(item);
  });
}

function renderProducts(){
  const list=document.getElementById('productsList');
  list.innerHTML='';
  Object.entries(adminSite.products).forEach(([catKey, arr])=>{
    (arr||[]).forEach(prod=>{
      const item=document.createElement('div');
      item.className='admin-item';
      item.innerHTML=`<div><strong>${prod.name_ar}</strong><div class="admin-sub">${catKey} — ${prod.id} — ${prod.images}</div></div><div style="display:flex;gap:8px"><button class="btn-secondary edit">تعديل</button><button class="btn-primary del">حذف</button></div>`;
      item.querySelector('.edit').onclick=()=>{
        document.getElementById('productCategoryInput').value = catKey;
        document.getElementById('productIdInput').value = prod.id || '';
        document.getElementById('productNameArInput').value = prod.name_ar || '';
        document.getElementById('productNameEnInput').value = prod.name_en || '';
        document.getElementById('productPriceInput').value = prod.price_omr || '';
        document.getElementById('productDiscountInput').value = prod.discount_price_omr || '';
        document.getElementById('productStatusInput').value = prod.status || '';
        document.getElementById('productImageInput').value = prod.images || '';
        document.getElementById('productShortArInput').value = prod.short_desc_ar || '';
        document.getElementById('productShortEnInput').value = prod.short_desc_en || '';
        document.getElementById('productLongArInput').value = prod.long_desc_ar || '';
        document.getElementById('productLongEnInput').value = prod.long_desc_en || '';
        document.getElementById('productPlatformInput').value = prod.platform || '';
        document.getElementById('productOptionsInput').value = prod.options || '';
        document.getElementById('productActiveInput').value = String(prod.active ?? '1');
      };
      item.querySelector('.del').onclick=()=>{
        if(!confirm('حذف المنتج؟')) return;
        adminSite.products[catKey]=adminSite.products[catKey].filter(p=>p.id!==prod.id);
        saveLocal(); renderAll();
      };
      list.appendChild(item);
    });
  });
}

function renderAll(){ fillSettings(); renderCategorySelect(); renderCategories(); renderProducts(); }

document.addEventListener('DOMContentLoaded', async()=>{
  adminSite = await loadSite();
  adminSite = getWorkingSite();
  document.getElementById('loginBtn').onclick=()=>{
    const pass=document.getElementById('adminPass').value.trim();
    if(pass!==String(adminSite.settings.adminCode||'123456')){
      document.getElementById('loginMsg').textContent='رمز الدخول غير صحيح';
      return;
    }
    document.getElementById('loginScreen').classList.add('hidden');
    document.getElementById('panel').classList.remove('hidden');
    renderAll();
  };

  document.getElementById('saveSettingsBtn').onclick=()=>{
    adminSite.settings.storeName=document.getElementById('storeNameInput').value.trim()||'Neostore';
    adminSite.settings.heroTitle=document.getElementById('heroTitleInput').value.trim();
    adminSite.settings.heroDesc=document.getElementById('heroDescInput').value.trim();
    adminSite.settings.logo=document.getElementById('logoInput').value.trim()||'assets/logo.png';
    adminSite.settings.instagramUrl=document.getElementById('instagramInput').value.trim();
    adminSite.settings.whatsappPhone=document.getElementById('whatsappInput').value.trim();
    adminSite.settings.adminCode=document.getElementById('adminCodeInput').value.trim()||'123456';
    saveLocal(); alert('تم حفظ الإعدادات داخل النسخة المحلية. صدّر JSON ثم ارفعه إلى GitHub.');
  };

  document.getElementById('saveCategoryBtn').onclick=()=>{
    const key=document.getElementById('catKeyInput').value.trim();
    if(!key) return alert('أدخل key القسم');
    const cat={
      key,
      name_ar:document.getElementById('catNameArInput').value.trim()||key,
      name_en:document.getElementById('catNameEnInput').value.trim()||key,
      banner_image:document.getElementById('catBannerInput').value.trim(),
      active:document.getElementById('catActiveInput').value==='1'
    };
    adminSite.categories = adminSite.categories.filter(c=>c.key!==key);
    adminSite.categories.push(cat);
    adminSite.products[key]=adminSite.products[key]||[];
    saveLocal(); renderAll(); alert('تم حفظ القسم.');
  };

  document.getElementById('saveProductBtn').onclick=()=>{
    const catKey=document.getElementById('productCategoryInput').value.trim();
    const id=document.getElementById('productIdInput').value.trim();
    if(!catKey || !id) return alert('اختر القسم وأدخل ID المنتج');
    const prod={
      id,
      name_ar:document.getElementById('productNameArInput').value.trim(),
      name_en:document.getElementById('productNameEnInput').value.trim(),
      price_omr:document.getElementById('productPriceInput').value.trim(),
      discount_price_omr:document.getElementById('productDiscountInput').value.trim(),
      status:document.getElementById('productStatusInput').value,
      images:document.getElementById('productImageInput').value.trim(),
      short_desc_ar:document.getElementById('productShortArInput').value.trim(),
      short_desc_en:document.getElementById('productShortEnInput').value.trim(),
      long_desc_ar:document.getElementById('productLongArInput').value.trim(),
      long_desc_en:document.getElementById('productLongEnInput').value.trim(),
      platform:document.getElementById('productPlatformInput').value.trim(),
      active:document.getElementById('productActiveInput').value,
      options:document.getElementById('productOptionsInput').value.trim()
    };
    adminSite.products[catKey]=adminSite.products[catKey]||[];
    adminSite.products[catKey]=adminSite.products[catKey].filter(p=>p.id!==id);
    adminSite.products[catKey].push(prod);
    saveLocal(); renderAll(); alert(`تم حفظ المنتج داخل قسم: ${catKey}
لا تنسَ تصدير JSON ورفعه إلى GitHub.`);
  };

  document.getElementById('exportBtn').onclick=exportJson;
  document.getElementById('importBtn').onclick=()=>document.getElementById('importFile').click();
  document.getElementById('importFile').addEventListener('change', function(){
    const file=this.files && this.files[0]; if(!file) return;
    const reader=new FileReader();
    reader.onload=()=>{
      try{ adminSite=JSON.parse(reader.result); saveLocal(); renderAll(); alert('تم استيراد JSON بنجاح'); }
      catch(e){ alert('ملف JSON غير صالح'); }
    };
    reader.readAsText(file,'utf-8');
  });
});
