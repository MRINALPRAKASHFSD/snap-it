# Performance Engineering & Budgets

Snap-it is designed for instant camera capture, smooth 60fps filter previews, and fast ephemeral content loading on both mobile and desktop devices.

This guide outlines our performance budgets, rendering strategies, and image optimization pipelines.

## 1. Performance Budgets

| Metric | Target | Warning Threshold | Description |
| ------ | ------ | ----------------- | ----------- |
| **LCP (Largest Contentful Paint)** | < 1.2s | > 2.0s | Time until viewfinder or primary feed is visible |
| **FID / INP (Input Delay)** | < 50ms | > 100ms | Responsiveness when clicking capture or switching tabs |
| **CLS (Cumulative Layout Shift)** | < 0.05 | > 0.10 | Visual stability during image/feed rendering |
| **Filter Viewfinder FPS** | 60 fps | < 45 fps | Sustained frame rate during live camera preview |
| **Client Bundle Size (gzipped)** | < 180 KB | > 250 KB | Initial JS download for the core application shell |

## 2. 60fps Camera Filter Engine

Applying complex image filters on high-resolution camera feeds can quickly throttle mobile CPUs. Snap-it achieves 60fps by relying on hardware-accelerated CSS filters:

- **GPU Composite Layer:** We apply CSS `filter` properties directly to the `<video>` element (e.g. `contrast(1.2) sepia(0.3) saturate(1.4)`). This delegates rendering directly to the device's hardware compositing pipeline.
- **Zero CPU Frame Looping:** We avoid `requestAnimationFrame` loops that read pixels via `canvas.getImageData()` during preview. CPU pixel manipulation only happens once at the moment of capture.
- **Immediate Capture Bake:** When the capture button is triggered:
  1. An off-screen canvas is sized to match the video feed's intrinsic resolution.
  2. The CSS filter string is set on `canvasContext.filter`.
  3. `drawImage(video, 0, 0)` executes a single hardware-accelerated paint.
  4. The result is converted to a WebP blob via `canvas.toBlob()`.

## 3. Image Compression & Payload Optimization

- **WebP Output:** Captured photos are encoded as WebP with 85% quality by default. This reduces payload size by ~40% compared to standard JPEG while preserving visual fidelity.
- **Downsampling:** Ultra-high-resolution mobile camera streams (e.g. 4032x3024) are capped at a maximum 1920px longest edge before uploading. This speeds up upload times on cellular connections without visible degradation on phone screens.

## 4. Network & Query Optimization

- **React Query Cache Times:** Ephemeral data (such as active stories) is cached with a 60-second `staleTime`. Repeated tab navigations do not trigger redundant network roundtrips.
- **Signed URL Batching:** Profile avatars and story thumbnails request signed URLs in batched RPC requests rather than individual HTTP calls.
- **Preloading Viewfinders:** The camera stream initializes as soon as the user navigates toward the camera route, eliminating delay before the viewfinder appears.
