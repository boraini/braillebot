import sharp, { FormatEnum } from "sharp";
import { Config } from "./config.js";
import { dither } from "./dither.js";
import { autoContrast } from "./autocontrast.js";
import { getBrailleChar } from "./braille.js";

const NEWLINE = "\n";

interface Dimensions {
    numRowPixels: number;
    numColPixels: number;
    numChannels: number;
    hasAlphaChannel: boolean;
}

type SharpWithDimensions = sharp.Sharp & Dimensions;
type BufferWithDimensions = Float32Array & Dimensions;
export type BufferAndMime = [buffer: Buffer, mime: "image/png"]

export async function downloadAndConvertImage(url: string, config: Config) {
    return downloadImage(url)
        .then(image => chooseDimensions(image, config))
        .then(image => filterImage(image, config))
        .then(image => convertPixelsToBraille(image, config))
}

export async function downloadImage(url: string): Promise<sharp.Sharp> {
    return fetch(url).then(response => {
        if (response.ok) return response.arrayBuffer();
        return Promise.reject(new Error("Error: download status: " + response.status));
    }).then(b => Promise.resolve(sharp(b)));
}

export async function chooseDimensions(image: sharp.Sharp, config: Config): Promise<SharpWithDimensions> {
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

    const myImage: SharpWithDimensions = image as SharpWithDimensions;

    myImage.numRowPixels = numRowPixels;
    myImage.numColPixels = numColPixels;
    myImage.numChannels = metadata.channels ?? 3;
    myImage.hasAlphaChannel = !!metadata.hasAlpha;

    return myImage;
}

export async function filterImage(image: SharpWithDimensions, config: Config): Promise<BufferWithDimensions> {
    const numColPixels = image.numColPixels;
    const numRowPixels = image.numRowPixels;
    const numChannels = image.numChannels;
    const hasAlphaChannel = image.hasAlphaChannel;
    
    let processedImageImm: sharp.Sharp = image;

    // resize image to make it pixelated
    processedImageImm = processedImageImm.resize(numColPixels, numRowPixels);

    // extract alpha channel
    let alpha = null;

    if (hasAlphaChannel) {
        await processedImageImm.clone().extractChannel("alpha").raw().toBuffer().then(a => alpha = a);
    }

    // make it black and white
    processedImageImm = processedImageImm.toColourspace("b-w");

    // apply the auto-contrast algorithm. This only works with black-and-white images
    if (config.contrast > 0) {
        processedImageImm = await autoContrast(processedImageImm, alpha, config);
    }

    // composite transparent image over background-color background
    processedImageImm = processedImageImm.flatten({ background: { r: config.background, g: config.background, b: config.background } });

    // have the image on buffer for the next step
    const processedImage = new Float32Array((await processedImageImm.raw({ depth: "float" }).toBuffer()).buffer) as BufferWithDimensions;

    // dither the image to make gradients show up better
    // note that the exported raw has only 1 channel
    if (config.numDitherLevels) dither(processedImage, config.numDitherLevels, numColPixels, numRowPixels);

    processedImage.numColPixels = numColPixels;
    processedImage.numRowPixels = numRowPixels;
    processedImage.numChannels = numChannels;
    processedImage.hasAlphaChannel = hasAlphaChannel;

    return processedImage;
    
}

export async function exportImageBuffer(processedImage: BufferWithDimensions): Promise<BufferAndMime> {
    const buf = await sharp(processedImage, {
        raw: {
            width: processedImage.numColPixels,
            height: processedImage.numRowPixels,
            channels: 1,
        },
    }).png().toBuffer();

    return [buf, "image/png"];
}

export async function convertPixelsToBraille(processedImage: BufferWithDimensions, config: Config): Promise<string> {
    const numColPixels = processedImage.numColPixels;
    const numRowPixels = processedImage.numRowPixels;
    const numChannels = processedImage.numChannels;

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
                numRowPixels,
                numChannels
            );
        }

        output += NEWLINE;
    }

    return output;

}
