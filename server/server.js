const http = require("http");
const fs = require("fs");
const path = require("path");
const WebSocket = require("ws");

const PORT = 3000;
const ROOT = path.join(__dirname, "..");

const MIME = {
    ".html": "text/html; charset=utf-8",
    ".js": "application/javascript; charset=utf-8",
    ".css": "text/css; charset=utf-8",
    ".json": "application/json",
    ".png": "image/png",
    ".ico": "image/x-icon"
};

function safePath(urlPath) {
    const decoded = decodeURIComponent(urlPath.split("?")[0]);
    const resolved = path.normalize(path.join(ROOT, decoded));
    if (!resolved.startsWith(ROOT)) return null;
    return resolved;
}

const server = http.createServer((req, res) => {
    let filePath = safePath(req.url === "/" ? "/index.html" : req.url);
    if (!filePath) {
        res.writeHead(403);
        res.end("Forbidden");
        return;
    }

    fs.readFile(filePath, (err, data) => {
        if (err) {
            res.writeHead(err.code === "ENOENT" ? 404 : 500);
            res.end(err.code === "ENOENT" ? "Not found" : "Server error");
            return;
        }
        const ext = path.extname(filePath).toLowerCase();
        res.writeHead(200, { "Content-Type": MIME[ext] || "application/octet-stream" });
        res.end(data);
    });
});

const wss = new WebSocket.Server({ server });

const clients = new Map();
const queue = [];
let nextId = 1;

function send(ws, type, data = {}) {
    if (ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify({ type, ...data }));
    }
}

function broadcastMatch(playerA, playerB) {
    send(playerA.ws, "match_found", {
        players: [playerA.id, playerB.id],
        opponent: playerB.id
    });
    send(playerB.ws, "match_found", {
        players: [playerA.id, playerB.id],
        opponent: playerA.id
    });
    playerA.opponent = playerB;
    playerB.opponent = playerA;
}

function tryMatch() {
    while (queue.length >= 2) {
        const a = queue.shift();
        const b = queue.shift();
        if (a.ws.readyState !== WebSocket.OPEN || b.ws.readyState !== WebSocket.OPEN) {
            if (a.ws.readyState === WebSocket.OPEN) queue.unshift(a);
            if (b.ws.readyState === WebSocket.OPEN) queue.unshift(b);
            continue;
        }
        broadcastMatch(a, b);
    }
}

wss.on("connection", (ws) => {
    const id = `p${nextId++}`;
    const client = { id, ws, opponent: null };
    clients.set(ws, client);

    send(ws, "welcome", { playerId: id });

    ws.on("message", (raw) => {
        let msg;
        try {
            msg = JSON.parse(raw);
        } catch (_) {
            return;
        }

        const c = clients.get(ws);
        if (!c) return;

        switch (msg.type) {
            case "find_match":
                if (!queue.includes(c)) queue.push(c);
                tryMatch();
                break;
            case "state":
                if (c.opponent) {
                    send(c.opponent.ws, "opponent_state", {
                        state: msg.state,
                        shareTop: msg.shareTop
                    });
                }
                break;
            case "line_clear":
                if (c.opponent) {
                    send(c.opponent.ws, "line_clear", {
                        lines: msg.lines,
                        shareTop: msg.shareTop
                    });
                }
                break;
            case "game_over":
                if (c.opponent) {
                    send(c.opponent.ws, "opponent_over");
                    c.opponent.opponent = null;
                }
                c.opponent = null;
                break;
        }
    });

    ws.on("close", () => {
        const c = clients.get(ws);
        if (!c) return;

        const idx = queue.indexOf(c);
        if (idx !== -1) queue.splice(idx, 1);

        if (c.opponent) {
            send(c.opponent.ws, "opponent_left");
            c.opponent.opponent = null;
        }

        clients.delete(ws);
    });
});

server.listen(PORT, () => {
    console.log(`MyTetr: http://localhost:${PORT}`);
    console.log(`WebSocket: ws://localhost:${PORT}`);
});
