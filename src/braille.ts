import type { Config } from "./config.js";

function offBounds(arr: Float32Array, def: number, x: number, y: number, nx: number, ny: number, nc: number) {
    if (x >= 0 && y >= 0 && x < nx && y < ny) {
        return arr[nx * y + x];
    } else {
        return def;
    }
}

function threshold(bound: number, value: number) {
    return bound < value ? 1 : 0;
}

export function getBrailleChar(config: Config, arr: Float32Array, x: number, y: number, nx: number, ny: number, nc: number) {
    const def = config.offBoundsValue;

    let value = 0x2800;
    let mult = 0;

    value += threshold(127, offBounds(arr, def, x + 0, y + 0, nx, ny, nc)) << (mult++);
    value += threshold(127, offBounds(arr, def, x + 0, y + 1, nx, ny, nc)) << (mult++);
    value += threshold(127, offBounds(arr, def, x + 0, y + 2, nx, ny, nc)) << (mult++);
    value += threshold(127, offBounds(arr, def, x + 1, y + 0, nx, ny, nc)) << (mult++);
    value += threshold(127, offBounds(arr, def, x + 1, y + 1, nx, ny, nc)) << (mult++);
    value += threshold(127, offBounds(arr, def, x + 1, y + 2, nx, ny, nc)) << (mult++);

    if (config.brailleHeight >= 4) {
        value += threshold(127, offBounds(arr, def, x + 0, y + 3, nx, ny, nc)) << (mult++);
        value += threshold(127, offBounds(arr, def, x + 1, y + 3, nx, ny, nc)) << (mult++);
    }

    return String.fromCharCode(value);
}
