import test from 'node:test';
import assert from 'node:assert/strict';
import { applyChange, diffRecords, safeArray } from '../src/store/syncChanges.ts';

const patch = (before, after) => ({ key: 'tasks', token: 'test', records: diffRecords(before, after) });

test('concurrent additions preserve records unseen by either device', () => {
  const first = patch([], [{ id: 'a', title: 'Phone' }]);
  const second = patch([], [{ id: 'b', title: 'Laptop' }]);
  assert.deepEqual(applyChange(applyChange(null, first), second), [{ title: 'Phone', id: 'a' }, { title: 'Laptop', id: 'b' }]);
});

test('different field edits merge without reverting remote changes', () => {
  const before = [{ id: 'a', title: 'Old', completed: false }];
  const title = patch(before, [{ ...before[0], title: 'New' }]);
  const done = patch(before, [{ ...before[0], completed: true }]);
  assert.deepEqual(applyChange(applyChange(before, title), done), [{ id: 'a', title: 'New', completed: true }]);
});

test('stale edits do not resurrect a deletion; replay is idempotent', () => {
  const before = [{ id: 'a', title: 'Old' }];
  const remove = patch(before, []);
  const edit = patch(before, [{ id: 'a', title: 'Edited' }]);
  assert.deepEqual(applyChange(applyChange(before, remove), edit), []);
  const create = patch([], before);
  assert.deepEqual(applyChange(applyChange([], create), create), before);
  assert.deepEqual(applyChange(applyChange(before, remove), remove), []);
});

test('habit check-ins on different days merge, and an undone day stays undone', () => {
  const before = [{ id: 'h', completions: ['2026-10-01'] }];
  const phone = patch(before, [{ id: 'h', completions: ['2026-10-01', '2026-10-02'] }]);
  const laptop = patch(before, [{ id: 'h', completions: ['2026-10-03'] }]);
  const merged = applyChange(applyChange(before, phone), laptop);
  assert.deepEqual(merged[0].completions, ['2026-10-02', '2026-10-03']);
  assert.deepEqual(applyChange(merged, laptop), merged);
});

test('profile field updates preserve other profile details', () => {
  assert.deepEqual(applyChange({ profileName: 'Old', cfHandle: 'tourist' }, { fields: { profileName: 'New' } }), { profileName: 'New', cfHandle: 'tourist' });
});

test('sparse Firebase arrays and numeric objects are normalized', () => {
  assert.deepEqual(safeArray({ 0: { id: 'a' }, 3: { id: 'b' } }), [{ id: 'a' }, { id: 'b' }]);
  assert.deepEqual(safeArray([null, { id: 'a' }, null]), [{ id: 'a' }]);
});
