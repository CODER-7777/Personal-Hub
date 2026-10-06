import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import { createRequire } from 'node:module';
import { webcrypto } from 'node:crypto';
import ts from 'typescript';
import { applyChange, diffRecords, safeArray } from '../src/store/syncChanges.ts';

const require = createRequire(import.meta.url);
const { create } = require('zustand');
const { persist, createJSONStorage } = require('zustand/middleware');
const source = fs.readFileSync(new URL('../src/store/index.ts', import.meta.url), 'utf8');
const code = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText;
const tick = () => new Promise(resolve => setImmediate(resolve));
const settle = async () => { for (let i = 0; i < 12; i++) await tick(); };
const plain = value => JSON.parse(JSON.stringify(value));

function memoryStorage() {
  const entries = new Map();
  return {
    entries,
    getItem: key => entries.get(key) ?? null,
    setItem: (key, value) => entries.set(key, value),
    removeItem: key => entries.delete(key),
  };
}

function server(initial = {}) {
  const users = structuredClone(initial);
  const devices = [];
  let afterCommit;
  const valueAt = path => {
    const [, uid, key] = path.split('/');
    return users[uid]?.[key] ?? null;
  };
  const snapshot = value => ({ val: () => structuredClone(value) });
  function emit(path) {
    for (const device of devices) {
      if (!device.alive || !device.connected) continue;
      for (const listener of device.listeners) if (listener.path === path) listener.callback(snapshot(valueAt(path)));
    }
  }
  function device(storage = memoryStorage()) {
    const state = { alive: true, connected: true, failWrites: false, listeners: [], storage, auth: { currentUser: null }, authCallback: null };
    devices.push(state);
    const database = {
      ref: (_, path) => path,
      onValue: (path, callback) => {
        const listener = { path, callback };
        state.listeners.push(listener);
        queueMicrotask(() => {
          if (!state.alive || !state.listeners.includes(listener)) return;
          if (path === '.info/connected') callback(snapshot(state.connected));
          else if (state.connected) callback(snapshot(valueAt(path)));
        });
        return () => { state.listeners = state.listeners.filter(l => l !== listener); };
      },
      runTransaction: async (path, update) => {
        await tick();
        if (state.failWrites) throw new Error('permission-denied');
        const [, uid, key] = path.split('/');
        const next = update(structuredClone(valueAt(path)));
        if (next === undefined) return { committed: false, snapshot: snapshot(valueAt(path)) };
        users[uid] ||= {};
        users[uid][key] = structuredClone(next);
        emit(path);
        afterCommit?.(path);
        return { committed: true, snapshot: snapshot(next) };
      },
    };
    state.auth.onAuthStateChanged = callback => {
      state.authCallback = callback;
      queueMicrotask(() => callback(state.auth.currentUser));
      return () => { state.authCallback = null; };
    };
    const module = { exports: {} };
    const context = vm.createContext({
      module, exports: module.exports, crypto: webcrypto, localStorage: storage,
      setTimeout, clearTimeout,
      console: { ...console, error: () => {} },
      require: name => {
        if (name === 'zustand') return { create };
        if (name === 'zustand/middleware') return { persist: (creator, options) => persist(creator, { ...options, storage: createJSONStorage(() => storage) }) };
        if (name === 'firebase/database') return database;
        if (name === '../lib/firebase') return { db: {}, auth: state.auth, isFirebaseConfigured: true };
        if (name === '../lib/notifications') return { scheduleTaskNotification: () => {}, scheduleReminderNotification: () => {} };
        if (name === './syncChanges') return { applyChange, diffRecords, safeArray };
        if (name === './types') return {};
        throw new Error(`Unexpected import: ${name}`);
      },
    });
    vm.runInContext(code, context);
    state.store = module.exports.useAppStore;
    state.login = uid => { state.auth.currentUser = uid ? { uid, displayName: `Name ${uid}` } : null; state.authCallback?.(state.auth.currentUser); };
    state.setConnected = connected => {
      state.connected = connected;
      for (const listener of state.listeners) if (listener.path === '.info/connected') listener.callback(snapshot(connected));
      if (connected) for (const listener of state.listeners) if (listener.path !== '.info/connected') listener.callback(snapshot(valueAt(listener.path)));
    };
    state.close = () => { state.login(null); state.alive = false; state.listeners = []; };
    state.initialize = uid => { state.auth.currentUser = uid ? { uid, displayName: `Name ${uid}` } : null; module.exports.initFirebaseSync(); };
    return state;
  }
  return { users, device, emit, setAfterCommit: callback => { afterCommit = callback; } };
}

test('profiles and classes sync between devices, with no redundant hydration writes', async () => {
  const cloud = server({ u: { profile: { profileName: 'Original', cfHandle: 'tourist' }, classes: [] } });
  const phone = cloud.device(); const laptop = cloud.device();
  phone.initialize('u'); laptop.initialize('u'); await settle();
  assert.equal(phone.store.getState().syncReady, true);
  phone.store.getState().setProfileName('Updated');
  phone.store.getState().addClasses([{ id: 'c', className: 'Physics', dayOfWeek: 6, startTime: '09:00', endTime: '10:00' }]);
  await settle();
  assert.equal(laptop.store.getState().profileName, 'Updated');
  assert.equal(laptop.store.getState().cfHandle, 'tourist');
  assert.equal(laptop.store.getState().classes[0].dayOfWeek, 6);
  assert.equal(phone.store.getState().pendingSyncCount, 0);
  assert.equal(phone.store.getState().syncStatus, 'connected');
  phone.close(); laptop.close();
});

test('offline edits survive a restart and merge alongside another device addition', async () => {
  const cloud = server({ u: { tasks: [{ id: 'a', title: 'Original', completed: false }] } });
  const disk = memoryStorage();
  const phone = cloud.device(disk); const laptop = cloud.device();
  phone.initialize('u'); laptop.initialize('u'); await settle();
  phone.setConnected(false);
  phone.store.getState().toggleTask('a');
  laptop.store.getState().addTask({ id: 'b', title: 'Laptop', completed: false });
  await settle();
  assert.equal(phone.store.getState().pendingSyncCount, 1);
  // Simulate a process ending without signing out or completing its queued write.
  phone.alive = false; phone.listeners = [];
  const restarted = cloud.device(disk);
  restarted.connected = false; restarted.initialize('u'); await settle();
  assert.equal(restarted.store.getState().tasks[0].completed, true);
  assert.equal(restarted.store.getState().syncReady, true);
  restarted.setConnected(true); await settle();
  assert.equal(cloud.users.u.tasks.find(t => t.id === 'a').completed, true);
  assert.equal(cloud.users.u.tasks.find(t => t.id === 'b').title, 'Laptop');
  assert.equal(restarted.store.getState().pendingSyncCount, 0);
  restarted.close(); laptop.close();
});

test('switching accounts clears private fields and ignores callbacks from the previous account', async () => {
  const cloud = server({ first: { tasks: [{ id: 'secret', title: 'Private' }] }, second: { profile: { profileName: 'Second' } } });
  const device = cloud.device(); device.initialize('first'); await settle();
  device.store.getState().setGeminiApiKey('private-session-key');
  device.store.getState().setLastResetMonth('2026-09');
  const staleListener = device.listeners.find(l => l.path === 'user_data/first/tasks');
  device.login('second');
  staleListener.callback({ val: () => [{ id: 'secret', title: 'Private' }] });
  await settle();
  assert.deepEqual(plain(device.store.getState().tasks), []);
  assert.equal(device.store.getState().profileName, 'Second');
  assert.equal(device.store.getState().geminiApiKey, '');
  assert.equal(device.store.getState().lastResetMonth, '');
  assert.equal(device.store.getState().syncOwnerUid, 'second');
  assert.equal(JSON.stringify([...device.storage.entries.values()]).includes('private-session-key'), false);
  device.close();
});

test('failed writes stay queued and display error until a retry succeeds', async () => {
  const cloud = server({ u: { tasks: [] } });
  const device = cloud.device(); device.initialize('u'); await settle();
  device.failWrites = true;
  device.store.getState().addTask({ id: 'a', title: 'Queued', completed: false }); await settle();
  assert.equal(device.store.getState().syncStatus, 'error');
  assert.equal(device.store.getState().pendingSyncCount, 1);
  assert.equal(cloud.users.u.tasks.length, 0);
  device.failWrites = false;
  device.store.getState().forceSync(); await settle();
  assert.equal(device.store.getState().syncStatus, 'connected');
  assert.equal(device.store.getState().pendingSyncCount, 0);
  assert.equal(cloud.users.u.tasks.length, 1);
  device.close();
});

test('retry never uploads an unchanged cached collection over newer cloud data', async () => {
  const cloud = server({ u: { tasks: [{ id: 'a', title: 'Cloud' }] } });
  const device = cloud.device(); device.initialize('u'); await settle();
  device.store.getState().forceSync(); await settle();
  assert.deepEqual(cloud.users.u.tasks, [{ id: 'a', title: 'Cloud' }]);
  device.close();
});

test('a late acknowledgement does not roll back a newer live cloud snapshot', async () => {
  const cloud = server({ u: { tasks: [{ id: 'a', title: 'Original', completed: false }] } });
  const device = cloud.device(); device.initialize('u'); await settle();
  cloud.setAfterCommit(path => {
    cloud.users.u.tasks.push({ id: 'b', title: 'New remote record' });
    cloud.emit(path);
  });
  device.store.getState().toggleTask('a'); await settle();
  assert.equal(device.store.getState().tasks.find(t => t.id === 'b').title, 'New remote record');
  device.close();
});

test('older caches are preserved for recovery without uploading them into the new account', async () => {
  const cloud = server({ u: { tasks: [] } });
  const disk = memoryStorage();
  disk.setItem('personal-hub-storage', JSON.stringify({ state: {
    tasks: [{ id: 'legacy', title: 'Unsynced old task' }],
    financeReports: [{ id: 'report', month: '2026-09' }], geminiApiKey: 'old-secret',
  }, version: 0 }));
  const device = cloud.device(disk); device.initialize('u'); await settle();
  assert.equal(JSON.parse(disk.getItem('personal-hub-legacy-recovery')).tasks[0].id, 'legacy');
  assert.equal(disk.getItem('personal-hub-legacy-recovery').includes('old-secret'), false);
  assert.deepEqual(cloud.users.u.tasks, []);
  assert.equal(device.store.getState().geminiApiKey, '');
  device.close();
});

test('switching accounts before a queued transaction commits does not cross account boundaries', async () => {
  const cloud = server({ first: { tasks: [] }, second: { tasks: [] } });
  const device = cloud.device(); device.initialize('first'); await settle();
  device.store.getState().addTask({ id: 'queued', title: 'First account', completed: false });
  device.login('second'); await settle();
  assert.deepEqual(cloud.users.second.tasks, []);
  assert.deepEqual(plain(device.store.getState().tasks), []);
  assert.notEqual(device.storage.getItem('personal-hub-outbox:first'), null);
  device.close();
});
