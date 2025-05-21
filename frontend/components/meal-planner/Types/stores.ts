import { ISODateString } from './common';

// Base store interface with common properties
export interface BaseStore {
  id: string;
  name: string;
  location: string;
  filename: string;
  logo?: string;
}

// Store with availability information
export interface Store extends BaseStore {
  validUntil: ISODateString;
  isAvailable: boolean;
}

// Store from index file
export interface StoreIndexItem extends BaseStore {
  validUntil: ISODateString; // ISO string from JSON
}

