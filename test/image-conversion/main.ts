import { Config, defaultConfig } from "../../src/config";
import { downloadAndConvertImage } from "../../src/convert";
import { resolvePublicUrl } from "../integration-server";

export default async function run() {
    const config: Config = {
        ...defaultConfig,
        contrast: 1,
        numDitherLevels: 1,
        targetPixels: 200 * 200,
        maxRowCharacters: 80,
    };

    await downloadAndConvertImage(resolvePublicUrl("/testimage.jpg"), config).then(console.log);
    await downloadAndConvertImage(resolvePublicUrl("/reggie.png"), config).then(console.log);
    await downloadAndConvertImage(resolvePublicUrl("/dragon.png"), config).then(console.log);
    await downloadAndConvertImage(resolvePublicUrl("/sigma.jpg"), config).then(console.log);
    await downloadAndConvertImage(resolvePublicUrl("/sdv.png"), config).then(console.log);
    await downloadAndConvertImage(resolvePublicUrl("/gecko.png"), config).then(console.log);
}
