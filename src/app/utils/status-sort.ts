const STATUS_SORT_ORDER = [
  'active',
  'inactive',
  'side',
  'retired',
  'inactive side',
  'retired side',
  'future'
];

export function getStatusSortRank(status: string): number {
  const rank = STATUS_SORT_ORDER.indexOf(status.toLowerCase());
  return rank === -1 ? STATUS_SORT_ORDER.length : rank;
}
