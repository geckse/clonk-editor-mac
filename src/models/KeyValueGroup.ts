export interface KeyValueGroup {
  name: string;
  rows: KeyValueRow[];
}

export interface KeyValueRow {
  key: string;
  value: string;
}