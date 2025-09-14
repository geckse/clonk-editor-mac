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
  section?: string;
  fieldInfo?: FieldDocumentation | null;
}

export interface KeyValueGroup {
  name: string;
  fields: KeyValueField[];
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
  detectionFields?: Record<string, string[]>; // section -> field names for auto-detection
}