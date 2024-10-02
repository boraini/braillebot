import fs from "node:fs";
import path from "node:path/posix";
import polka from "polka";
import { serveStatic, endServeStatic } from "./integration-server";

describe("integration tests", () => {
    const directory = fs.readdirSync("test", { withFileTypes: true });

    for (const ent of directory) {
        if (!ent.isDirectory()) continue;

        it(ent.name, async () => {
            const modulePath = path.resolve("test", ent.name, "main.ts");

            const testModule = await import(modulePath);

            const publicPath = path.resolve("test", ent.name, "public");
            
            const publicServer = await new Promise<polka.Polka | null>(resolve => fs.stat(publicPath, (err, result) => {
                if (!err && result.isDirectory()) {
                    serveStatic(publicPath).then(resolve);
                } else {
                    resolve(null);
                }

            }));

            let err = null;

            try {
                await testModule.default();
            } catch (e) {
                err = e;
            } finally {
                await endServeStatic(publicServer);
            }
            
            if (err) {
                throw err;
            }

        });

    }
});
