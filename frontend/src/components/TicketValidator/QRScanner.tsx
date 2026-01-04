import { useEffect, useRef } from "react";
import { Html5QrcodeScanner } from "html5-qrcode";

interface QRScannerProps {
  onScan: (decodedText: string) => void;
  onError?: (error: string) => void;
}

export const QRScanner = ({ onScan, onError }: QRScannerProps) => {
  const scannerRef = useRef<Html5QrcodeScanner | null>(null);
  const isMountedRef = useRef(true);

  useEffect(() => {
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  useEffect(() => {
    if (!isMountedRef.current) return;

    try {
      scannerRef.current = new Html5QrcodeScanner(
        "qr-reader",
        {
          fps: 10,
          qrbox: { width: 300, height: 300 },
          rememberLastUsedCamera: true,
          showTorchButtonIfSupported: true,
          aspectRatio: 1,
        },
        false
      );

      scannerRef.current.render(
        (decodedText) => {
          onScan(decodedText);
        },
        () => {
          // Silently handle scanning errors to avoid console spam
        }
      );
    } catch (error) {
      console.error("Failed to initialize scanner:", error);
      onError?.("Failed to initialize camera");
    }

    return () => {
      if (scannerRef.current) {
        try {
          scannerRef.current.pause();
        } catch (err) {
          console.error("Error stopping scanner:", err);
        }
      }
    };
  }, [onScan, onError]);

  return (
    <div className="w-full">
      <div id="qr-reader" className="w-full"></div>
    </div>
  );
};