import polka from "polka";
import {defaultConfig, Config, downloadAndConvertImage} from "./src/index.js";

const customConfig: Config = {
    ...defaultConfig,
    contrast: 1,
    numDitherLevels: 10,
    targetPixels: 200 * 200,
    maxRowCharacters: 30,
};

const server = polka()
.get("/convert", async (req, res) => {
    let imageUrl: string;

    if (req.query["url"] instanceof String || typeof req.query["url"] == "string") {
        imageUrl = req.query["url"] as string;
    } else {
        res.statusCode = 400;
        res.end("Bad Request");
        return;
    }

    try {
        const braille = await downloadAndConvertImage(imageUrl, customConfig);
        res.end("it worked\n" + braille);
    } catch(_e) {
        let message: string = "";
        if (typeof _e == "string") {
            message = _e;
        }
        if (_e instanceof Error) {
            message = _e.message;
        }
        res.statusCode = 502;
        res.end(message);
    }
})
.listen(process.env.PORT || 3000);
