interface HTMLElement {
  webkitRequestFullscreen?: (
    options?: FullscreenOptions
  ) => Promise<void> | void;
  msRequestFullscreen?: () => Promise<void> | void;
}

interface Document {
  webkitExitFullscreen?: () => Promise<void> | void;
  msExitFullscreen?: () => Promise<void> | void;
}
