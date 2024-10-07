const w1 = 7 / 16.0
const w2 = 3 / 16.0
const w3 = 5 / 16.0
const w4 = 1 / 16.0

function setPixel(im: Float32Array, x: number, y: number, nx: number, ny: number, val: number) {
    if (x < 0 || y < 0 || x >= nx || y >= ny) return;
    im[y * nx + x] = val;
}

function getPixel(im: Float32Array, x: number, y: number, nx: number, ny: number) {
    if (x < 0 || y < 0 || x >= nx || y >= ny) return 0;
    return im[y * nx + x];
}

export function dither(im: Float32Array, numLevels: number, nx: number, ny: number) {
    const stride = 255 / numLevels;

    for (let y = 0; y < ny; y++) {
        for (let x = 0; x < nx; x++) {
            const oldPixel = getPixel(im, x, y, nx, ny);
            const newPixel = Math.min(255, Math.max(0, Math.round(oldPixel / stride) * stride));

            setPixel(im, x, y, nx, ny, newPixel);

            const quantizationError = oldPixel - newPixel;
            setPixel(im, x + 1, y + 0, nx, ny, getPixel(im, x + 1, y + 0, nx, ny) + quantizationError * w1)
            setPixel(im, x - 1, y + 1, nx, ny, getPixel(im, x - 1, y + 1, nx, ny) + quantizationError * w2)
            setPixel(im, x + 0, y + 1, nx, ny, getPixel(im, x + 0, y + 1, nx, ny) + quantizationError * w3)
            setPixel(im, x + 1, y + 1, nx, ny, getPixel(im, x + 1, y + 1, nx, ny) + quantizationError * w4)
        }
    }


    return im
}
