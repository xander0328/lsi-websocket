import express from 'express';
import http from 'http';
import WebSocket from 'ws';

const app = express();

// Create an HTTP server
const server = http.createServer(app);

// Create a WebSocket server
const wss = new WebSocket.Server({ server });

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

// Set up a basic route for testing
app.get('/', (req, res) => res.send('WebSocket server is running'));

// Start the server
const PORT = process.env.PORT || 3000;

server.listen(PORT, () => {
    console.log(`Server is listening on port ${PORT}`);
});
