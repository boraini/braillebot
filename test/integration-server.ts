import polka from "polka";
import * as libServeStatic from "serve-static";

let port = 8000;

export function resolvePublicUrl(path: string) {
    return "http://localhost:" + port + path;
}

export async function serveStatic(path: string): Promise<polka.Polka | null> {
    return new Promise(resolve => {
        const myPolka = polka().use(libServeStatic.default(path)).listen(port, "localhost", () => {
            resolve(myPolka);
        });
    });
}

export async function endServeStatic(server: polka.Polka | null) {
    if (server == null) return;

    if (server.server) {
        return new Promise(resolve => {
            server.server!.close(resolve);
        });
    }
}
