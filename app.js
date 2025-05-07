// 1 sola declaración de DATA_URL, con tu ID real:
const DATA_URL = 'https://script.google.com/macros/s/AKfycbx9km3m89gORFXQjIVeeyVtuY3C7EmTgTVgO-DKdT2oQiMywqsf2p1_Of_TcMg7-3xk/exec?file=data';

function openDB() {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open('pwa-padron', 1);
    req.onupgradeneeded = () =>
      req.result.createObjectStore('registros', { keyPath: 'DNI' });
    req.onsuccess = () => resolve(req.result);
    req.onerror   = () => reject(req.error);
  });
}

async function cacheData(arr) {
  const db = await openDB();
  const tx = db.transaction('registros', 'readwrite');
  arr.forEach(o => tx.objectStore('registros').put(o));
  return tx.complete;
}

async function loadData() {
  try {
    console.log('→ fetch data…');
    const r = await fetch(DATA_URL);
    console.log('← status', r.status);
    const j = await r.json();
    console.log('→ got', j.length, 'records');
    await cacheData(j);
    console.log('✅ cached');
  } catch (e) {
    console.warn('⚠️ usando cache:', e);
  }
}

async function buscarPorDNI(dni) {
  const db = await openDB();
  return db.transaction('registros','readonly').objectStore('registros').get(dni);
}

// init
loadData();

document.getElementById('btnDNI').onclick = async () => {
  const dni = document.getElementById('dniInput').value.trim();
  console.log('🔍 DNI', dni);
  const res = await buscarPorDNI(dni);
  console.log('📋', res);
  document.getElementById('results').innerHTML = res
    ? `<table><thead><tr>${Object.keys(res).map(h=>`<th>${h}</th>`).join('')}</tr></thead>
       <tbody><tr>${Object.values(res).map(v=>`<td>${v}</td>`).join('')}</tr></tbody></table>`
    : '<p>No encontrado.</p>';
};

document.getElementById('btnName').onclick = async () => {
  const term = document.getElementById('nameInput').value.trim().toLowerCase();
  console.log('🔍 Name', term);
  const db  = await openDB();
  const all = await db.transaction('registros','readonly').objectStore('registros').getAll();
  const f   = all.filter(o => Object.values(o).some(v =>
    v.toString().toLowerCase().includes(term)
  ));
  console.log('📋', f.length, 'matches');
  document.getElementById('results').innerHTML = f.length
    ? `<table><thead><tr>${Object.keys(f[0]).map(h=>`<th>${h}</th>`).join('')}</tr></thead>
       <tbody>${f.map(r=>`<tr>${Object.values(r).map(v=>`<td>${v}</td>`).join('')}</tr>`).join('')}</tbody></table>`
    : '<p>No encontrado.</p>';
};
