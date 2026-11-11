import { useCallback, useEffect, useRef, useState } from "react";

export type CameraError = "denied" | "unavailable" | "unsupported" | null;

// Browser camera adapter. Native apps can replace this hook with the same API.
export function useCamera() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [facing, setFacing] = useState<"user" | "environment">("user");
  const [error, setError] = useState<CameraError>(null);
  const [ready, setReady] = useState(false);
  const [torchSupported, setTorchSupported] = useState(false);
  const [torch, setTorch] = useState(false);

  const stop = () => {
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
  };

  const start = useCallback(async () => {
    stop();
    setReady(false);
    if (!navigator.mediaDevices?.getUserMedia) return setError("unsupported");
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: facing, width: { ideal: 1080 }, height: { ideal: 1920 } },
        audio: false,
      });
      streamRef.current = stream;
      const track = stream.getVideoTracks()[0]!;
      const caps = (track.getCapabilities?.() ?? {}) as MediaTrackCapabilities & { torch?: boolean };
      setTorchSupported(!!caps.torch);
      setTorch(false);
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play().catch(() => {});
      }
      setError(null);
      setReady(true);
    } catch (e) {
      const name = (e as DOMException).name;
      setError(name === "NotAllowedError" || name === "SecurityError" ? "denied" : "unavailable");
    }
  }, [facing]);

  useEffect(() => {
    start();
    return stop;
  }, [start]);

  const flip = () => setFacing((f) => (f === "user" ? "environment" : "user"));

  const toggleTorch = async () => {
    const track = streamRef.current?.getVideoTracks()[0];
    if (!track) return;
    const next = !torch;
    await track.applyConstraints({ advanced: [{ torch: next } as MediaTrackConstraintSet] }).catch(() => {});
    setTorch(next);
  };

  const capture = (filter: string): string | null => {
    const v = videoRef.current;
    if (!v || !v.videoWidth) return null;
    const canvas = document.createElement("canvas");
    canvas.width = v.videoWidth;
    canvas.height = v.videoHeight;
    const ctx = canvas.getContext("2d");
    if (!ctx) return null;
    if (facing === "user") {
      ctx.translate(canvas.width, 0);
      ctx.scale(-1, 1);
    }
    ctx.filter = filter || "none";
    ctx.drawImage(v, 0, 0);
    return canvas.toDataURL("image/jpeg", 0.88);
  };

  return { videoRef, facing, error, ready, flip, retry: start, capture, torchSupported, torch, toggleTorch };
}
