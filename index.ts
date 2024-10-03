import polka from "polka";
import fs from "node:fs";
import {defaultConfig, Config, downloadAndConvertImage} from "./src/index.js";

const customConfig: Config = {
    ...defaultConfig,
    contrast: 1,
    numDitherLevels: 10,
    targetPixels: 200 * 200,
    maxRowCharacters: 30,
};

let apiKeys: string[] = [];

try {
    apiKeys = JSON.parse(fs.readFileSync("run/api-keys.json").toString());
} catch (e) {
    const reason = e instanceof Error ? e.message : typeof e == "string" ? e : "unknown";

    console.warn("API keys could not be loaded: " + reason);
}

const server = polka()
.use(
    async (req, res, next) => {
        const authorizationHeader = req.headers["authorization"];

        if (
            typeof authorizationHeader != "undefined"
            && authorizationHeader.startsWith("Bearer")
            && apiKeys.includes(authorizationHeader.substring("Bearer ".length).trim())
        ) {
            next();
        } else {
            res.statusCode = 401;
            res.end("Unauthorized");
        }
    }
)
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
});

(async () => {
    if (process.env.SSL_CERT && process.env.SSL_KEY) {
        const key = fs.readFileSync(process.env.SSL_KEY);
        const cert = fs.readFileSync(process.env.SSL_CERT);

        server.server = (await import("node:https"))
            .createServer({ key, cert });
        server.listen(process.env.PORT || 3000);
    } else {
        server.listen(process.env.PORT || 3000);
    }
})();
