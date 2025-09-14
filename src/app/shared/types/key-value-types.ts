export interface FieldDocumentation {
  type: string;
  description: string;
}

export interface SectionDocumentation {
  title: string;
  description: string;
  fields: Record<string, FieldDocumentation>;
}

export interface DocumentationSet {
  sections: Record<string, SectionDocumentation>;
}

export interface KeyValueField {
  key: string;
  value: string;
  fieldInfo?: FieldDocumentation | null;
}

export interface KeyValueGroup {
  name: string;
  fields: KeyValueField[];
  section?: string;
  documentationType?: DocumentationType;
}

export type KeyValueSeparator = '=' | ':' | ' ' | '|';

export interface KeyValueEditorConfig {
  separator: KeyValueSeparator;
  allowReordering: boolean;
  showAddRemoveButtons: boolean;
  documentationType?: DocumentationType;
  section?: string;
}

export enum DocumentationType {
  DEFCORE = 'defcore',
  ACTMAP = 'actmap',
  SCRIPT = 'script',
  MATERIAL = 'material',
  CUSTOM = 'custom'
}

export interface DocumentationConfig {
  type: DocumentationType;
  name: string;
  path: string;
  sections: string[];
  detectionFields?: Record<string, string[]>;
}