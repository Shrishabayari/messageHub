const WebSocket = require('ws');
const http = require('http');
const path = require('path');
const fs = require('fs');

// Create HTTP server for serving static files
const server = http.createServer((req, res) => {
    let filePath = '.' + req.url;
    if (filePath === './') {
        filePath = './index.html';
    }

    const extname = String(path.extname(filePath)).toLowerCase();
    const mimeTypes = {
        '.html': 'text/html',
        '.js': 'text/javascript',
        '.css': 'text/css',
        '.json': 'application/json',
        '.png': 'image/png',
        '.jpg': 'image/jpg',
        '.gif': 'image/gif',
        '.svg': 'image/svg+xml',
    };

    const contentType = mimeTypes[extname] || 'application/octet-stream';

    fs.readFile(filePath, (error, content) => {
        if (error) {
            if (error.code === 'ENOENT') {
                res.writeHead(404);
                res.end('File not found');
            } else {
                res.writeHead(500);
                res.end('Server error: ' + error.code);
            }
        } else {
            res.writeHead(200, { 'Content-Type': contentType });
            res.end(content, 'utf-8');
        }
    });
});

// Create WebSocket server
const wss = new WebSocket.Server({ server });

// Store connected clients and rooms
const clients = new Map();
const rooms = {
    'general': { name: 'General', users: new Set(), messages: [] },
    'random': { name: 'Random', users: new Set(), messages: [] },
    'tech': { name: 'Tech Talk', users: new Set(), messages: [] }
};

wss.on('connection', (ws) => {
    console.log('New client connected');
    
    ws.on('message', (message) => {
        try {
            const data = JSON.parse(message);
            handleMessage(ws, data);
        } catch (error) {
            console.error('Error parsing message:', error);
            ws.send(JSON.stringify({ type: 'error', message: 'Invalid message format' }));
        }
    });

    ws.on('close', () => {
        console.log('Client disconnected');
        handleDisconnection(ws);
    });

    ws.on('error', (error) => {
        console.error('WebSocket error:', error);
    });
});

function handleMessage(ws, data) {
    switch (data.type) {
        case 'auth':
            handleAuth(ws, data);
            break;
        case 'message':
            handleChatMessage(ws, data);
            break;
        case 'joinRoom':
            handleJoinRoom(ws, data);
            break;
        case 'leaveRoom':
            handleLeaveRoom(ws, data);
            break;
        case 'createRoom':
            handleCreateRoom(ws, data);
            break;
        case 'typing':
            handleTyping(ws, data);
            break;
        case 'stopTyping':
            handleStopTyping(ws, data);
            break;
        default:
            console.log('Unknown message type:', data.type);
    }
}

function handleAuth(ws, data) {
    const username = data.username;
    
    // Check if username is already taken
    const existingClient = Array.from(clients.values()).find(client => client.username === username);
    if (existingClient) {
        ws.send(JSON.stringify({
            type: 'error',
            message: 'Username already taken! Please join with another name.'
        }));
        return;
    }
    
    // Store client info
    clients.set(ws, {
        username: username,
        currentRoom: null
    });
    
    console.log(`User ${username} authenticated`);
    
    ws.send(JSON.stringify({
        type: 'authSuccess',
        username: username
    }));
}

function handleChatMessage(ws, data) {
    const client = clients.get(ws);
    if (!client || !client.currentRoom) {
        return;
    }
    
    const message = {
        id: Date.now() + Math.random(),
        type: 'message',
        username: client.username,
        room: data.room,
        content: data.content,
        timestamp: new Date().toISOString()
    };
    
    // Store message in room history
    if (rooms[data.room]) {
        rooms[data.room].messages.push(message);
        // Keep only last 100 messages per room
        if (rooms[data.room].messages.length > 100) {
            rooms[data.room].messages = rooms[data.room].messages.slice(-100);
        }
    }
    
    // Broadcast message to all users in the room
    broadcastToRoom(data.room, message);
    
    console.log(`Message from ${client.username} in ${data.room}: ${data.content}`);
}

function handleJoinRoom(ws, data) {
    const client = clients.get(ws);
    if (!client || !rooms[data.room]) {
        return;
    }
    
    // Leave current room if any
    if (client.currentRoom && rooms[client.currentRoom]) {
        rooms[client.currentRoom].users.delete(client.username);
        broadcastToRoom(client.currentRoom, {
            type: 'userLeft',
            username: client.username,
            room: client.currentRoom
        });
    }
    
    // Join new room
    client.currentRoom = data.room;
    rooms[data.room].users.add(client.username);
    
    // Notify room about new user
    broadcastToRoom(data.room, {
        type: 'userJoined',
        username: client.username,
        room: data.room
    });
    
    // Send room users list to the joining user
    ws.send(JSON.stringify({
        type: 'roomUsers',
        room: data.room,
        users: Array.from(rooms[data.room].users)
    }));
    
    // Send recent messages to the joining user
    rooms[data.room].messages.slice(-20).forEach(message => {
        ws.send(JSON.stringify(message));
    });
    
    console.log(`${client.username} joined room ${data.room}`);
}

function handleLeaveRoom(ws, data) {
    const client = clients.get(ws);
    if (!client || !rooms[data.room]) {
        return;
    }
    
    rooms[data.room].users.delete(client.username);
    client.currentRoom = null;
    
    broadcastToRoom(data.room, {
        type: 'userLeft',
        username: client.username,
        room: data.room
    });
    
    console.log(`${client.username} left room ${data.room}`);
}

function handleCreateRoom(ws, data) {
    const client = clients.get(ws);
    if (!client) {
        return;
    }
    
    if (rooms[data.roomId]) {
        ws.send(JSON.stringify({
            type: 'error',
            message: 'Room already exists'
        }));
        return;
    }
    
    // Create new room
    rooms[data.roomId] = {
        name: data.roomName,
        users: new Set(),
        messages: []
    };
    
    // Broadcast room creation to all clients
    broadcast({
        type: 'roomCreated',
        roomId: data.roomId,
        roomName: data.roomName,
        creator: client.username
    });
    
    console.log(`Room ${data.roomName} created by ${client.username}`);
}

function handleTyping(ws, data) {
    const client = clients.get(ws);
    if (!client || !client.currentRoom) {
        return;
    }
    
    // Broadcast typing indicator to other users in the room
    broadcastToRoom(data.room, {
        type: 'typing',
        username: client.username,
        room: data.room
    }, ws); // Exclude sender
}

function handleStopTyping(ws, data) {
    const client = clients.get(ws);
    if (!client || !client.currentRoom) {
        return;
    }
    
    // Broadcast stop typing to other users in the room
    broadcastToRoom(data.room, {
        type: 'stopTyping',
        username: client.username,
        room: data.room
    }, ws); // Exclude sender
}

function handleDisconnection(ws) {
    const client = clients.get(ws);
    if (!client) {
        return;
    }
    
    // Remove user from current room
    if (client.currentRoom && rooms[client.currentRoom]) {
        rooms[client.currentRoom].users.delete(client.username);
        broadcastToRoom(client.currentRoom, {
            type: 'userLeft',
            username: client.username,
            room: client.currentRoom
        });
    }
    
    // Remove client from clients map
    clients.delete(ws);
    
    console.log(`${client.username} disconnected`);
}

function broadcastToRoom(roomId, message, excludeWs = null) {
    if (!rooms[roomId]) {
        return;
    }
    
    const messageStr = JSON.stringify(message);
    
    clients.forEach((client, ws) => {
        if (ws !== excludeWs && client.currentRoom === roomId && ws.readyState === WebSocket.OPEN) {
            ws.send(messageStr);
        }
    });
}

function broadcast(message, excludeWs = null) {
    const messageStr = JSON.stringify(message);
    
    clients.forEach((client, ws) => {
        if (ws !== excludeWs && ws.readyState === WebSocket.OPEN) {
            ws.send(messageStr);
        }
    });
}

// Start server
const PORT = process.env.PORT || 8080;
server.listen(PORT, () => {
    console.log(`Chat server running on port ${PORT}`);
    console.log(`WebSocket server running on ws://localhost:${PORT}`);
});

// Graceful shutdown
process.on('SIGINT', () => {
    console.log('Shutting down server...');
    wss.close(() => {
        server.close(() => {
            console.log('Server closed');
            process.exit(0);
        });
    });
});