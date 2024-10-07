import sharp from "sharp";
import { Config } from "./config.js";

function printNormalDistribution(mean: number, variance: number) {
    const ys = [];
    for (let i = 0; i < 80; i++) {
        const x = i / 80;

        ys.push(1 / Math.sqrt(2 * variance * Math.PI) * Math.exp(-0.5 * (x - mean) * (x - mean) / variance));
    }

    for (let i = 29; i > 0; i--) {
        console.log("|" + ys.map(y => i == Math.round(y * 30) ? "*" : " ").join(""));

    }

    console.log("+----------------------------------------------------------------------------------------");
    
}

function findNormalDistribution(im: Buffer, alpha: Buffer | null) {
    let sum = 0;
    let quotient = 0;

    if (alpha) {
        for (let i = 0; i < im.length; i += 1) {
            if (!alpha || alpha[i] > 127) {
                const gray = im[i];
                sum += gray;
                quotient++;
            }
        };

    } else {
        for (let i = 0; i < im.length; i += 1) {
            const gray = im[i];
            sum += gray;
            quotient++;
        }
    }

    const mean = sum / quotient;

    sum = 0;

    if (alpha) {
        for (let i = 0; i < im.length; i++) {
            if (alpha[i] > 127) {
                const gray = im[i];
                sum += (gray - mean) * (gray - mean);
            }
        }
    } else {
        for (let i = 0; i < im.length; i++) {
            const gray = im[i];
            sum += (gray - mean) * (gray - mean);
        }
    }

    const variance = sum / quotient / 255 / 255;

    return [mean / 255, variance];
}

export async function autoContrast(image: sharp.Sharp, alpha: Buffer | null, config: Config) {
    const im = await image.clone().raw().toBuffer();

    const [mean, variance] = findNormalDistribution(im, alpha);

    // console.log(`mean = ${mean}, variance = ${variance}`);
    // printNormalDistribution(mean, variance);

    let pivot, offset;
    
    if (mean >= 0.75 || mean <= 0.25) {
        pivot = mean >= 0.5 ? 255 : 0;
        offset = 0;
    } else {
        pivot = 255 * mean;
        offset = (0.5 - mean) * 255;
    }

    const var95 = 0.33 * 0.33;

    const a1Start = 1;
    const a1End = var95 / variance;

    const scale = config.contrast * a1End + (1 - config.contrast) * a1Start; 

    const a1 = scale;
    const a0 = (1 - scale) * pivot + offset;

    return image
        .linear(a1, a0)
        .flatten({ background: { r: config.background, g: config.background, b: config.background } });
}
