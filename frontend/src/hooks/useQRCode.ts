import { useCallback } from "react";
import QRCode from "qrcode";

export const useQRCode = () => {
  const generateQRDataUrl = useCallback(
    async (text: string): Promise<string> => {
      try {
        const dataUrl = await QRCode.toDataURL(text, {
          errorCorrectionLevel: "H",
          type: "image/png",
          width: 300, // 300px for high resolution
          margin: 1,
          color: {
            dark: "#000000",
            light: "#FFFFFF",
          },
        });
        return dataUrl;
      } catch (error) {
        console.error("Failed to generate QR code:", error);
        throw error;
      }
    },
    []
  );

  const generateMultipleQRs = useCallback(
    async (tokens: string[]): Promise<string[]> => {
      try {
        const qrDataUrls = await Promise.all(
          tokens.map((token) => generateQRDataUrl(token))
        );
        return qrDataUrls;
      } catch (error) {
        console.error("Failed to generate multiple QR codes:", error);
        throw error;
      }
    },
    [generateQRDataUrl]
  );

  return {
    generateQRDataUrl,
    generateMultipleQRs,
  };
};