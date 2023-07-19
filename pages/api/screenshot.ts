import type { NextApiRequest, NextApiResponse } from "next";
import { getScreenShot } from "@/lib/screenshot";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const url = (req.query.url as string) || "http://localhost:3000";
  const selector = (req.query.selector as string) || null;
  const width = parseInt(req.query.width as string) || 1920;
  const height = parseInt(req.query.width as string) || 1080;

  const image = await getScreenShot({ url, selector, width, height });

  if (!image) return res.status(500).json({ message: "error" });

  return res.setHeader("Content-Type", "image/jpeg").send(image);
}
