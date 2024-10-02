import sharp from "sharp";
import { Config } from "./config.js";

function findNormalDistribution(im: Buffer) {
    let sum = 0;

    for (let i = 0; i < im.length; i++) {
        sum += im[i];
    };

    const mean = sum / im.length;

    sum = 0;

    for (let i = 0; i < im.length; i++) {
        sum += (im[i] - mean) * (im[i] - mean);
    }

    const variance = sum / im.length / 255 / 255;

    return [mean / 255, variance];
}

export async function autoContrast(image: sharp.Sharp, config: Config) {
    const im = await image.raw().toBuffer();

    const [mean, variance] = findNormalDistribution(im);

    const pivot = mean * 255;
    const offset = (0.5 - mean) * 255;

    const var95 = 0.22 * 0.22;

    const a1Start = 1;
    const a1End = var95 / variance;

    const scale = config.contrast * a1End + (1 - config.contrast) * a1Start; 

    const a1 = scale;
    const a0 = (1 - scale) * pivot + offset;

    return image.linear(a1, a0);
}
