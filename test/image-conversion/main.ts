import { Config, defaultConfig } from "../../src/config";
import { downloadAndConvertImage } from "../../src/convert";
import { resolvePublicUrl } from "../integration-server";

export default function run() {
    const config: Config = defaultConfig;

    return downloadAndConvertImage(resolvePublicUrl("/testimage.jpg"), config).then(console.log);
}
