import sharp from "sharp";
import { Config } from "./config";
import { quantize } from "./quantize";

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
    return fetch(url).then(data => data.arrayBuffer()).then(b => Promise.resolve(sharp(b)));
}

export async function convertImage(image: sharp.Sharp, config: Config) {
    const metadata = await image.metadata();

    if (!metadata.width || !metadata.height) {
        throw new Error("width and height not known");
    }

    const ratio = Math.sqrt(config.targetPixels / (metadata.width * metadata.height));

    const numColPixelsWithoutLimit = ratio * metadata.width;
    const numColPixelsWithLimit = config.maxRowCharacters * (config.brailleWidth + config.brailleColSpacing);
    const numColPixels = Math.round(Math.min(numColPixelsWithLimit, numColPixelsWithoutLimit));

    if (numColPixels <= 0) {
        throw new Error("image too narrow");
    }

    const numRowPixels = Math.round(metadata.height * numColPixels / metadata.width);

    const processedImage = await image.resize(numColPixels, numRowPixels).toColourspace("b-w").raw().toBuffer();

    const threshold = 127;

    quantize(processedImage, threshold, numColPixels, numRowPixels);

    const numColChars = Math.ceil(numRowPixels / (config.brailleWidth + config.brailleColSpacing));
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
