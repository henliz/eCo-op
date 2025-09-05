// frontend/stores/index.ts
export { useUserPreferencesStore } from './useUserPreferencesStore';
//export { useStoreLocationStore } from './useStoreLocationStore';
//export type { Store } from "./useStoreLocationStore"; // <-- add this line

export { useStoreLocationStore } from "./useStoreLocationStore";
export type { Store, UserLocation, StoreLocation } from "./useStoreLocationStore";