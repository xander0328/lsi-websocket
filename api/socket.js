// api/socket.js
import WebSocket from 'ws';

export default async function handler(req, res) {
    const { action, userId, targetUserIds } = req.body;

    // External WebSocket URL (e.g., on a different server or cloud service)
    const wsServerUrl = "ws://your-websocket-server-url";  // Change this to your WebSocket server URL

    // Create a WebSocket client
    const ws = new WebSocket(wsServerUrl);

    ws.on('open', () => {
        console.log('Connected to WebSocket server');

        // Handle registration action
        if (action === 'register') {
            ws.send(JSON.stringify({
                action: 'register',
                userId: userId,
            }));
            console.log(`User ID ${userId} registered.`);
        }

        // Handle broadcast action
        if (action === 'broadcast') {
            ws.send(JSON.stringify({
                action: 'broadcast',
                message: 'notify',
            }));
            console.log('Broadcast message sent.');
        }

        // Handle private message action
        if (action === 'private') {
            ws.send(JSON.stringify({
                action: 'private',
                targetUserIds: targetUserIds,
                message: 'notify',
            }));
            console.log(`Private message sent to ${targetUserIds.join(', ')}`);
        }

        // Close the WebSocket connection after sending the message
        ws.close();
    });

    ws.on('message', (data) => {
        console.log('Received:', data);
    });

    // Return success response
    res.status(200).json({ status: 'WebSocket request processed' });
}
