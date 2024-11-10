import { Server } from 'ws';
import http from 'http';

export default function handler(req, res) {
    // Only handle WebSocket upgrade requests (i.e., WebSocket handshake)
    if (req.method === 'GET' && req.headers['upgrade'] === 'websocket') {
        // Create a WebSocket server on the request connection
        const server = http.createServer((req, res) => {
            res.writeHead(200, { 'Content-Type': 'text/plain' });
            res.end('WebSocket server is running');
        });

        const wss = new Server({ server });

        // Store connected clients by user ID
        const clients = new Map();

        wss.on('connection', (ws) => {
            console.log('New client connected');

            ws.on('message', (message) => {
                const data = JSON.parse(message);  // Assuming the message is in JSON format

                // Register or update the client with the user ID
                if (data.action === 'register') {
                    const userId = data.userId;

                    // Check if the user ID is already registered
                    if (clients.has(userId)) {
                        // Close the old connection to avoid duplication
                        clients.get(userId).close();
                    }

                    // Register the new connection
                    ws.userId = userId;
                    clients.set(userId, ws);
                    console.log(`User ID ${userId} registered.`);
                }

                // Handle broadcasting the message to all clients
                if (data.action === 'broadcast') {
                    const messageContent = 'notify';
                    // Broadcast the message to all connected clients
                    wss.clients.forEach((client) => {
                        if (client.readyState === WebSocket.OPEN) {
                            client.send(JSON.stringify({ message: messageContent, from: 'Server' }));
                        }
                    });
                }

                // Handle sending a private message to a specific user
                if (data.action === 'private') {
                    const targetUserIds = data.targetUserIds;
                    const messageContent = 'notify';

                    targetUserIds.forEach((targetUserId) => {
                        const targetClient = clients.get(targetUserId);
                        if (targetClient && targetClient.readyState === WebSocket.OPEN) {
                            targetClient.send(JSON.stringify({
                                message: messageContent
                            }));
                        }
                    });
                }
            });

            ws.on('close', () => {
                // Remove the client from the map on disconnect
                if (ws.userId) {
                    clients.delete(ws.userId);
                    console.log(`User ID ${ws.userId} disconnected.`);
                }
            });
        });

        // The WebSocket server needs to handle the upgrade request
        server.on('upgrade', (req, socket, head) => {
            wss.handleUpgrade(req, socket, head, (ws) => {
                wss.emit('connection', ws, req);
            });
        });

        // Vercel does not use the `server.listen()` method, so we skip it here
        res.status(200).send('WebSocket server is up and running');
    } else {
        res.status(405).send('Method Not Allowed');
    }
}
