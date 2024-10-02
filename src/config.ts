export const defaultConfig = {
    targetPixels: 100 * 100,
    maxRowCharacters: 30,
    brailleWidth: 2,
    brailleHeight: 4,
    brailleRowSpacing: 2,
    brailleColSpacing: 1,
    offBoundsValue: 0,
};

export type Config = typeof defaultConfig;
