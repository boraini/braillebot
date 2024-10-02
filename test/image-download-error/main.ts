import { downloadAndConvertImage } from "../../src/convert";
import { resolvePublicUrl } from "../integration-server";
import { defaultConfig } from "../../src/config";

export default function run() {
    expect(downloadAndConvertImage(resolvePublicUrl("/test.jpg"), defaultConfig)).rejects.toBeTruthy();
}
