const WebSocket = require('ws');
const http = require('http');

const server = http.createServer((req, res) => {
    res.writeHead(200);
    res.end("Don't Worry Signaling Server is Running");
});

const wss = new WebSocket.Server({ server });

// Map to keep track of active IDs and their connections
const clients = new Map();

wss.on('connection', (ws) => {
    let userUniqueId = null;

    ws.on('message', (message) => {
        const data = JSON.parse(message);

        // 1. Register a new ID
        if (data.type === 'store_user') {
            userUniqueId = data.id;
            clients.set(userUniqueId, ws);
            console.log(`User registered: ${userUniqueId}`);
        }

        // 2. Relay message to a specific ID
        if (data.type === 'relay_message') {
            const targetClient = clients.get(data.targetId);
            if (targetClient && targetClient.readyState === WebSocket.OPEN) {
                targetClient.send(JSON.stringify({
                    type: data.messageType, // e.g., 'offer', 'answer', 'candidate'
                    from: userUniqueId,
                    content: data.content
                }));
            }
        }
    });

    ws.on('close', () => {
        if (userUniqueId) {
            clients.delete(userUniqueId);
            console.log(`User disconnected: ${userUniqueId}`);
        }
    });
});

const PORT = process.env.PORT || 10000;
server.listen(PORT, '0.0.0.0', () => {
    console.log(`Server listening on port ${PORT}`);
});
