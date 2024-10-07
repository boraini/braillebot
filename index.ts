import polka from "polka";
import fs from "node:fs";
import { defaultConfig, Config, downloadAndConvertImage, downloadImage, filterImage, chooseDimensions, exportImageBuffer } from "./src/index.js";

const customConfig: Config = {
    ...defaultConfig,
    contrast: 1,
    numDitherLevels: 1,
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

function findImageUrl(req: any) {
    if (req.query["url"] instanceof String || typeof req.query["url"] == "string") {
        return req.query["url"] as string;
    } else {
        throw new Error("URL not found in request");
    }
}

const server = polka();

if (apiKeys.length > 0) {
    server
    .use(async (req, res, next) => {
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
    });
}

server
.get("/convert", async (req, res) => {
    let imageUrl: string;

    try {
        imageUrl = findImageUrl(req);
    } catch(e) {
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
.get("/filter", async (req, res) => {
    let imageUrl: string;

    try {
        imageUrl = findImageUrl(req);
    } catch(e) {
        res.statusCode = 400;
        res.end("Bad Request");
        return;
    }

    try {
        const [image, mime] = await downloadImage(imageUrl)
            .then(img => chooseDimensions(img, customConfig))
            .then(img => filterImage(img, customConfig))
            .then(exportImageBuffer);

        res.setHeader("Content-Type", mime);
        res.end(image);
    } catch (e) {
        console.error(e);
        res.statusCode = 502;
        res.end("Internal Server Error");
        return;
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
