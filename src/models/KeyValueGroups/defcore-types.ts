export interface FieldDocumentation {
  type: string;
  description: string;
}

export interface SectionDocumentation {
  title: string;
  description: string;
  fields: Record<string, FieldDocumentation>;
}

export interface KeyValueDocumentation {
  sections: Record<string, SectionDocumentation>;
}

export enum FieldDataType {
  INTEGER = 'Integer',
  STRING = 'Zeichenfolge',
  BOOLEAN = 'Boolean',
  DEFINITIONS_ID = 'Definitions-ID',
  C4ID = 'C4ID',
  ID_LIST = 'ID-Liste',
  BITMASKE = 'Bitmaske',
  TWO_INTEGER = '2 Integer',
  THREE_INTEGER = '3 Integer',
  FOUR_INTEGER = '4 Integer',
  SIX_INTEGER = '6 Integer',
  UP_TO_30_INTEGER = 'bis zu 30 Integer'
}

export interface KeyValueField {
  key: string;
  value: string;
  section?: string;
  fieldInfo?: FieldDocumentation;
}

export interface KeyValueGroup {
  name: string;
  fields: KeyValueField[];
}

export type SectionType = 'DefCore' | 'Physical' | 'Custom';

export const DEFCORE_SECTIONS: SectionType[] = ['DefCore', 'Physical'];