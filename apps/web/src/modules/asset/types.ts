export interface Asset {
  id: string;
  assetTag: string;
  name: string;
  categoryId: string;
  serialNumber?: string | null;
  manufacturer?: string | null;
  model?: string | null;
  acquisitionDate?: string | null;
  acquisitionCost?: number | null;
  currentValue?: number | null;
  location?: string | null;
  condition: 'NEW' | 'GOOD' | 'FAIR' | 'POOR' | 'BROKEN';
  status: 'AVAILABLE' | 'ALLOCATED' | 'RESERVED' | 'UNDER_MAINTENANCE' | 'DISPOSED';
  isBookable: boolean;
  createdBy?: string | null;
  createdAt: string;
  updatedAt: string;
  category?: { id: string; name: string };
  images?: AssetImage[];
  documents?: AssetDocument[];
}

export interface AssetImage {
  id?: string;
  assetId?: string;
  imageUrl: string;
  displayOrder: number;
}

export interface AssetDocument {
  id?: string;
  assetId?: string;
  documentName: string;
  documentUrl: string;
  documentType: string;
}

export interface AssetHistory {
  id: string;
  assetId: string;
  action: string;
  previousValue?: string | null;
  newValue?: string | null;
  performedBy?: string | null;
  performedAt: string;
  remarks?: string | null;
  performer?: { id: string; firstName: string; lastName: string; email: string };
}
