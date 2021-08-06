export {};

declare global {
  interface Window {
    loadingOpen: () => void;
    loadingClose: () => void;
  }
}
