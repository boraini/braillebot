export const defaultConfig = {
    targetPixels: 100 * 100,
    maxRowCharacters: 30,
    brailleWidth: 2,
    brailleHeight: 4,
    brailleRowSpacing: 2,
    brailleColSpacing: 1,
    offBoundsValue: 0,
    numDitherLevels: 0,
    contrast: 0,
    background: 0,
};

export type Config = typeof defaultConfig;
