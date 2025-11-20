// src/types/terms.ts

export interface TermsSection {
  id: string;
  title: string;
  number?: string;
  content: SectionContent[];
}

export interface SectionContent {
  type: 'paragraph' | 'heading' | 'list';
  title?: string;
  text?: string;
  items?: string[];
}

export interface ExpandedSectionsState {
  [key: string]: boolean;
}