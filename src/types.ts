export enum AppSection {
  ARCHIVIO = 'ARCHIVIO',
  INFO = 'INFO',
  EXPAND = 'EXPAND',
  UPLOAD = 'UPLOAD',
  NONE = 'NONE'
}

export type Category = 'AMB' | 'STL' | 'FIG' | 'GRA';

export interface ImageObject {
  id: number;
  url: string;
  category: Category;
  averageColor: string;
}
