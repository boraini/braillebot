import sharp from "sharp";
import { Config } from "./config.js";
import { dither } from "./dither.js";
import { autoContrast } from "./autocontrast.js";

const NEWLINE = "\n";

function offBounds(arr: Uint8Array, def: number, x: number, y: number, nx: number, ny: number) {
    if (x >= 0 && y >= 0 && x < nx && y < ny) {
        return arr[nx * y + x];
    } else {
        return def;
    }
}

function threshold(bound: number, value: number) {
    return bound < value ? 1 : 0;
}

function getBrailleChar(config: Config, arr: Uint8Array, x: number, y: number, nx: number, ny: number) {
    const def = config.offBoundsValue;

    let value = 0x2800;
    let mult = 0;

    value += threshold(127, offBounds(arr, def, x + 0, y + 0, nx, ny)) << (mult++);
    value += threshold(127, offBounds(arr, def, x + 0, y + 1, nx, ny)) << (mult++);
    value += threshold(127, offBounds(arr, def, x + 0, y + 2, nx, ny)) << (mult++);
    value += threshold(127, offBounds(arr, def, x + 1, y + 0, nx, ny)) << (mult++);
    value += threshold(127, offBounds(arr, def, x + 1, y + 1, nx, ny)) << (mult++);
    value += threshold(127, offBounds(arr, def, x + 1, y + 2, nx, ny)) << (mult++);

    if (config.brailleHeight >= 4) {
        value += threshold(127, offBounds(arr, def, x + 0, y + 3, nx, ny)) << (mult++);
        value += threshold(127, offBounds(arr, def, x + 1, y + 3, nx, ny)) << (mult++);
    }

    return String.fromCharCode(value);
}

export async function downloadAndConvertImage(url: string, config: Config) {
    return downloadImage(url).then(image => convertImage(image, config));
}

export async function downloadImage(url: string) {
    return fetch(url).then(response => {
        if (response.ok) return response.arrayBuffer();
        return Promise.reject(new Error("Error: download status: " + response.status));
    }).then(b => Promise.resolve(sharp(b)));
}

export async function convertImage(image: sharp.Sharp, config: Config) {
    const metadata = await image.metadata();

    if (!metadata.width || !metadata.height) {
        throw new Error("width and height not known");
    }

    // compute a new image size (numColPixels, numRowPixels) that either satisfies both
    // the maximum number of Braille characters per row or
    // the maximum number of pixels per row
    const ratio = Math.sqrt(config.targetPixels / (metadata.width * metadata.height));

    const numColPixelsWithoutLimit = ratio * metadata.width;
    const numColPixelsWithLimit = config.maxRowCharacters * (config.brailleWidth + config.brailleColSpacing);
    const numColPixels = Math.round(Math.min(numColPixelsWithLimit, numColPixelsWithoutLimit));

    if (numColPixels <= 0) {
        throw new Error("image too narrow");
    }

    const numRowPixels = Math.round(metadata.height * numColPixels / metadata.width);

    let processedImageImm = image;

    // composite transparent image over background-color background
    processedImageImm = image.flatten({ background: { r: config.background, g: config.background, b: config.background } });

    // resize image to make it pixelated
    processedImageImm = processedImageImm.resize(numColPixels, numRowPixels)

    // make it black and white
    processedImageImm = processedImageImm.toColourspace("b-w");

    // apply the auto-contrast algorithm. This only works with black-and-white images
    if (config.contrast > 0) {
        processedImageImm = await autoContrast(processedImageImm, config);
    }

    // have the image on buffer for the next step
    const processedImage = await processedImageImm.raw().toBuffer();

    // dither the image to make gradients show up better
    if (config.numDitherLevels) dither(processedImage, config.numDitherLevels, numColPixels, numRowPixels);

    // convert image into Braille characters
    const numColChars = Math.ceil(numColPixels / (config.brailleWidth + config.brailleColSpacing));
    const numRowChars = Math.ceil(numRowPixels / (config.brailleHeight + config.brailleRowSpacing));

    let output = "";
    for (let row = 0; row < numRowChars; row++) {
        for (let col = 0; col < numColChars; col++) {
            output += getBrailleChar(
                config,
                processedImage,
                col * (config.brailleWidth + config.brailleColSpacing),
                row * (config.brailleHeight + config.brailleRowSpacing),
                numColPixels,
                numRowPixels
            );
        }

        output += NEWLINE;
    }

    return output;
}
