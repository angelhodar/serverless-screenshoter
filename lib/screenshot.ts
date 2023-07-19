import sharp from "sharp";
import puppeteer, { ScreenshotOptions } from "puppeteer-core";
import chromium from "@sparticuz/chromium-min";

interface ScreenShotParams {
  url: string;
  width: number;
  height: number;
  selector?: string | null;
}

const remoteExecutablePath =
  "https://github.com/Sparticuz/chromium/releases/download/v114.0.0/chromium-v114.0.0-pack.tar";

const executablePath =
  process.platform === "win32"
    ? "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe"
    : process.platform === "linux"
    ? remoteExecutablePath
    : "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";

const compressImage = async (imageBuffer: string | Buffer) => {
  return await sharp(imageBuffer)
    .resize({ width: 1000 })
    .jpeg({
      quality: 80,
      mozjpeg: true,
    })
    .toBuffer();
};

export const getScreenShot = async (params: ScreenShotParams) => {
  const { url, selector, width, height } = params;

  const decodedUrl = decodeURIComponent(url);

  chromium.setHeadlessMode = "new";
  chromium.setGraphicsMode = false;

  try {
    const browser = await puppeteer.launch({
      args: chromium.args,
      defaultViewport: chromium.defaultViewport,
      executablePath: process.env.VERCEL
        ? await chromium.executablePath(executablePath)
        : executablePath,
      headless: chromium.headless,
      ignoreHTTPSErrors: true,
    });

    const page = await browser.newPage();

    await page.goto(decodedUrl, { waitUntil: "networkidle0" });
    await page.setViewport({ width, height, deviceScaleFactor: 2 });

    await page.evaluate(() => {
      const element = document.getElementById("cookies-banner");
      if (element) element.parentNode?.removeChild(element);
    });

    const screenShotOptions: ScreenshotOptions = { type: "png" };

    if (selector) {
      const exportContainer = await page.waitForSelector("#" + selector);
      if (exportContainer) {
        const elementBounds = await exportContainer.boundingBox();
        if (elementBounds)
          screenShotOptions.clip = {
            ...elementBounds,
            /**
             * Little hack to avoid black borders:
             * https://github.com/mixn/carbon-now-cli/issues/9#issuecomment-414334708
             */
            x: Math.round(elementBounds.x),
            height: Math.round(elementBounds.height) - 1,
          };
      }
    }

    const screenshot = await page.screenshot(screenShotOptions);
    const optimizedScreenshot = compressImage(screenshot);

    const pages = await browser.pages();

    for (const page of pages) {
      await page.close();
    }

    await browser.close();

    return optimizedScreenshot;
  } catch (error) {
    console.log(error);
    return null;
  }
};
