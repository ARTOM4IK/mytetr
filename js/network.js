class Network {
    constructor(url) {
        this.url = url;
        this.ws = null;
        this.connected = false;
        this.handlers = {};
        this._settled = false;
    }

    connect(timeoutMs = 5000) {
        return new Promise((resolve, reject) => {
            this._settled = false;

            const fail = (err) => {
                if (this._settled) return;
                this._settled = true;
                clearTimeout(timer);
                reject(err || new Error("WebSocket connection failed"));
            };

            const succeed = () => {
                if (this._settled) return;
                this._settled = true;
                clearTimeout(timer);
                this.connected = true;
                resolve();
            };

            const timer = setTimeout(() => {
                if (this.ws) this.ws.close();
                fail(new Error("Connection timeout"));
            }, timeoutMs);

            try {
                this.ws = new WebSocket(this.url);
            } catch (e) {
                fail(e);
                return;
            }

            this.ws.onopen = succeed;

            this.ws.onerror = () => fail(new Error("WebSocket error"));

            this.ws.onclose = () => {
                this.connected = false;
                if (!this._settled) fail(new Error("WebSocket closed"));
                if (this.handlers.close) this.handlers.close();
            };

            this.ws.onmessage = (event) => {
                let msg;
                try {
                    msg = JSON.parse(event.data);
                } catch (_) {
                    return;
                }
                if (msg.type && this.handlers[msg.type]) {
                    this.handlers[msg.type](msg);
                }
            };
        });
    }

    on(type, handler) {
        this.handlers[type] = handler;
    }

    send(type, data = {}) {
        if (!this.ws || this.ws.readyState !== WebSocket.OPEN) return;
        this.ws.send(JSON.stringify({ type, ...data }));
    }

    findMatch() {
        this.send("find_match");
    }

    sendGameOver() {
        this.send("game_over");
    }

    disconnect() {
        this._settled = true;
        if (this.ws) {
            this.ws.onclose = null;
            this.ws.close();
            this.ws = null;
        }
        this.connected = false;
    }
}

function getWebSocketUrl() {
    if (location.protocol === "file:") {
        return "ws://localhost:3000";
    }
    const protocol = location.protocol === "https:" ? "wss:" : "ws:";
    return `${protocol}//${location.host}`;
}
