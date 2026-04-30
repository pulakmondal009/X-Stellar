/// <reference types="qrcode" />

import QRCode from "qrcode";

export async function generateSEP0007QR(
  destinationAddress: string,
  amount: number,
  memo?: string
): Promise<string> {
  const params = new URLSearchParams({
    destination: destinationAddress,
    amount: amount.toFixed(7),
  });

  if (memo) params.set("memo", memo);

  const uri = `web+stellar:pay?${params.toString()}`;

  return QRCode.toDataURL(uri, {
    width: 256,
    margin: 2,
    color: {
      dark: "#0F0F14",
      light: "#FFFFFF",
    },
  });
}
