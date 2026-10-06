// Serializable changes retain the existing array-based cloud schema.
export interface RecordChange {
  id: string;
  remove?: boolean;
  create?: boolean;
  fields?: Record<string, unknown>;
  completionsAdded?: string[];
  completionsRemoved?: string[];
}

export interface SyncChange {
  token: string;
  key: string;
  records?: RecordChange[];
  fields?: Record<string, unknown>;
}

export function safeArray(value: unknown): any[] {
  const values = Array.isArray(value) ? value : value && typeof value === 'object' ? Object.values(value) : [];
  return values.filter((item: any) => item && typeof item.id === 'string');
}

export function diffRecords(before: any[], after: any[]): RecordChange[] {
  const previous = new Map(safeArray(before).map(item => [item.id, item]));
  const next = new Map(safeArray(after).map(item => [item.id, item]));
  const changes: RecordChange[] = [];
  for (const id of previous.keys()) if (!next.has(id)) changes.push({ id, remove: true });
  for (const [id, item] of next) {
    const old = previous.get(id);
    const fields: Record<string, unknown> = {};
    for (const key of Object.keys(item)) {
      if (key !== 'id' && JSON.stringify(item[key]) !== JSON.stringify(old?.[key])) fields[key] = item[key] ?? null;
    }
    const change: RecordChange = { id, create: !old, fields };
    if (old && Array.isArray(item.completions)) {
      const beforeDays: string[] = old.completions || [];
      change.completionsAdded = item.completions.filter((d: string) => !beforeDays.includes(d));
      change.completionsRemoved = beforeDays.filter(d => !item.completions.includes(d));
      delete fields.completions;
    }
    if (Object.keys(fields).length || change.completionsAdded?.length || change.completionsRemoved?.length || !old) changes.push(change);
  }
  return changes;
}

export function applyChange(current: unknown, change: SyncChange): any {
  if (change.fields) return { ...(current && typeof current === 'object' ? current : {}), ...change.fields };
  const records = new Map(safeArray(current).map(item => [item.id, item]));
  for (const patch of change.records || []) {
    if (patch.remove) { records.delete(patch.id); continue; }
    const old = records.get(patch.id);
    // Stale edits must not resurrect a deleted record.
    if (!old && !patch.create) continue;
    const item = { ...old, ...patch.fields, id: patch.id };
    if (patch.completionsAdded || patch.completionsRemoved) {
      item.completions = [...new Set([...(old?.completions || []), ...(patch.completionsAdded || [])])]
        .filter(d => !patch.completionsRemoved?.includes(d));
    }
    records.set(patch.id, item);
  }
  return [...records.values()];
}
