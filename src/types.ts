export enum AppSection {
  NONE = 'NONE',
  ARCHIVIO = 'ARCHIVIO',
  INFO = 'INFO',
  EXPAND = 'EXPAND',
  UPLOAD = 'UPLOAD' // Corrisponde alla voce "Verify"
}

export type Category = 'AMB' | 'STL' | 'FIG' | 'GRA' | 'EXP';

export interface ImageObject {
  id: number;
  url: string;
  category: Category;
  averageColor: string;
}