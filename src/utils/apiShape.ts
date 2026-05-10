export function withLegacyId<T extends { id: string }>(row: T) {
  return { ...row, _id: row.id };
}

export function withLegacyIds<T extends { id: string }>(rows: T[]) {
  return rows.map(withLegacyId);
}
