export const defaultConfig = {
    /** Total number of dots in the final image to aim for */
    targetPixels: 100 * 100,
    /** Maximum number of Braille characters to have in each line */
    maxRowCharacters: 30,
    /** Number of dots horizontally in a Braille character. It should be 2. */
    brailleWidth: 2,
    /** Number of dots horizontally in a Braille character. It should be 3 or 4. */
    brailleHeight: 4,
    /** Number of dots between Braille characters on a line */
    brailleRowSpacing: 2,
    /** Number of dots between lines of Braille characters */
    brailleColSpacing: 1,
    /** Colour to use for pixels beyond bounds. Set the same as background. */
    offBoundsValue: 0,
    /** Number of colours to have after the dithering step */
    numDitherLevels: 0,
    /** Relative amount of autocontrast adjustment. Set to 0 to disable autocontrast */
    contrast: 0,
    /** Grayscale background color intensity (0-255) to use with images with transparency */
    background: 0,
};

export type Config = typeof defaultConfig;
