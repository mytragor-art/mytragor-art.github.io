import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { runInNewContext } from 'node:vm';

const root = new URL('../calculadora/', import.meta.url);
const html = await readFile(new URL('index.html', root), 'utf8');
const worker = await readFile(new URL('sw.js', root), 'utf8');

function installHarness(installed = false) {
  const listeners = new Map();
  const elements = new Map();
  const getElement = id => {
    if (!elements.has(id)) elements.set(id, {
      textContent: '', hidden: id === 'installNow', open: false,
      addEventListener(type, handler) { listeners.set(`${id}:${type}`, handler); },
      showModal() { this.open = true; },
      close() { this.open = false; }
    });
    return elements.get(id);
  };
  const script = html.match(/<script>([\s\S]*?)<\/script>/)[1];
  runInNewContext(script, {
    document: { getElementById: getElement },
    window: {
      matchMedia: () => ({ matches: installed, addEventListener() {} }),
      addEventListener: (type, handler) => listeners.set(type, handler)
    },
    navigator: {}, console
  });
  return { listeners, getElement };
}

test('instalação: instruções disponíveis mesmo sem prompt nativo', () => {
  const { listeners, getElement } = installHarness();
  listeners.get('install:click')();
  assert.equal(getElement('installDialog').open, true);
  assert.equal(getElement('installNow').hidden, true);
  listeners.get('closeInstall:click')();
  assert.equal(getElement('installDialog').open, false);
});

for (const outcome of ['accepted', 'dismissed']) {
  test(`instalação: prompt nativo com resultado ${outcome}`, async () => {
    const { listeners, getElement } = installHarness();
    let prompted = 0;
    let prevented = false;
    listeners.get('beforeinstallprompt')({
      preventDefault() { prevented = true; },
      async prompt() { prompted++; },
      userChoice: Promise.resolve({ outcome })
    });
    assert.equal(prevented, true);
    assert.equal(getElement('installNow').hidden, false);
    await listeners.get('installNow:click')();
    assert.equal(prompted, 1);
    assert.equal(getElement('installNow').hidden, true);
    assert.match(getElement('installStatus').textContent, outcome === 'accepted' ? /solicitada/ : /cancelada/);
  });
}

test('instalação: modo app e evento de instalação atualizam os controles', () => {
  const { getElement } = installHarness(true);
  assert.equal(getElement('install').textContent, 'App instalado');
  const browser = installHarness();
  browser.listeners.get('appinstalled')();
  assert.equal(browser.getElement('install').textContent, 'App instalado');
  assert.match(browser.getElement('installStatus').textContent, /instalada/);
});

function workerHarness() {
  const listeners = new Map();
  const stores = new Map([['outro-app-v1', new Map()], ['mytragor-calculadora-v1', new Map()]]);
  const scope = 'https://mytragor.com.br/calculadora/';
  let online = true;
  let revision = 'nova versão';
  const key = request => typeof request === 'string' ? new URL(request, scope).href : request.url;
  const caches = {
    keys: async () => [...stores.keys()],
    delete: async name => stores.delete(name),
    async open(name) {
      if (!stores.has(name)) stores.set(name, new Map());
      const store = stores.get(name);
      return {
        async addAll(assets) { for (const asset of assets) store.set(key(asset), new Response('versão inicial')); },
        async put(request, response) { store.set(key(request), response); },
        async match(request) { return store.get(key(request))?.clone(); }
      };
    }
  };
  runInNewContext(worker, {
    URL, console, caches,
    fetch: async () => {
      if (!online) throw new Error('Sem conexão');
      return new Response(revision);
    },
    self: {
      registration: { scope },
      skipWaiting: async () => {},
      clients: { claim: async () => {} },
      addEventListener: (type, handler) => listeners.set(type, handler)
    }
  });
  return {
    stores,
    setOnline(value) { online = value; },
    setRevision(value) { revision = value; },
    async lifecycle(type) {
      let work;
      listeners.get(type)({ waitUntil(promise) { work = promise; } });
      await work;
    },
    request(url = scope, method = 'GET') {
      let result;
      listeners.get('fetch')({ request: new Request(url, { method }), respondWith(promise) { result = promise; } });
      return result;
    }
  };
}

test('offline: instalação prepara recursos e só remove caches da calculadora', async () => {
  const harness = workerHarness();
  await harness.lifecycle('install');
  await harness.lifecycle('activate');
  assert.equal(harness.stores.has('outro-app-v1'), true);
  assert.equal(harness.stores.has('mytragor-calculadora-v1'), false);
  const cache = harness.stores.get('mytragor-calculadora-5981fbd-install-v1');
  assert.equal(cache.size, 7);
  harness.setOnline(false);
  assert.equal(await (await harness.request()).text(), 'versão inicial');
});

test('offline: busca versão atual online e preserva última cópia sem conexão', async () => {
  const harness = workerHarness();
  await harness.lifecycle('install');
  assert.equal(await (await harness.request()).text(), 'nova versão');
  harness.setRevision('versão atualizada');
  assert.equal(await (await harness.request()).text(), 'versão atualizada');
  harness.setOnline(false);
  assert.equal(await (await harness.request()).text(), 'versão atualizada');
  assert.equal(harness.request('https://mytragor.com.br/cartas/'), undefined);
  assert.equal(harness.request('https://mytragor.com.br/calculadora/', 'POST'), undefined);
});
