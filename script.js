// Global variables
let currentUser = '';
let currentRoom = '';
let users = new Set();
let rooms = {
    'general': { name: 'General', users: new Set(), messages: [] },
    'random': { name: 'Random', users: new Set(), messages: [] },
    'tech': { name: 'Tech Talk', users: new Set(), messages: [] }
};
let activeFormats = new Set();

// WebSocket simulation (for demo purposes)
class ChatWebSocket {
    constructor() {
        this.listeners = {};
        this.connected = false;
    }

    on(event, callback) {
        if (!this.listeners[event]) {
            this.listeners[event] = [];
        }
        this.listeners[event].push(callback);
    }

    emit(event, data) {
        if (this.listeners[event]) {
            this.listeners[event].forEach(callback => callback(data));
        }
    }

    connect() {
        setTimeout(() => {
            this.connected = true;
            this.emit('connect');
        }, 500);
    }

    send(data) {
        if (this.connected) {
            // Simulate message broadcasting to other users (not back to sender)
            setTimeout(() => {
                // Only broadcast to other users, not the sender
                if (data.username !== currentUser) {
                    this.emit('message', data);
                }
            }, 100);
        }
    }
}

const socket = new ChatWebSocket();

// DOM elements
const loginScreen = document.getElementById('loginScreen');
const loginForm = document.getElementById('loginForm');
const loginError = document.getElementById('loginError');
const currentUserSpan = document.getElementById('currentUser');
const roomList = document.getElementById('roomList');
const messagesContainer = document.getElementById('messagesContainer');
const messageForm = document.getElementById('messageForm');
const messageInput = document.getElementById('messageInput');
const sendBtn = document.getElementById('sendBtn');
const currentRoomName = document.getElementById('currentRoomName');
const onlineCount = document.getElementById('onlineCount');

// Initialize app
document.addEventListener('DOMContentLoaded', function() {
    initializeApp();
});

function initializeApp() {
    setupEventListeners();
    setupWebSocket();
    renderRooms();
    updateOnlineCount();
}

function setupEventListeners() {
    loginForm.addEventListener('submit', handleLogin);
    messageForm.addEventListener('submit', handleSendMessage);
    messageInput.addEventListener('keypress', handleKeyPress);
    
    // Mobile menu toggle
    if (window.innerWidth <= 576) {
        document.querySelector('.menu-toggle').style.display = 'block';
    }
    
    window.addEventListener('resize', handleResize);
}

function setupWebSocket() {
    socket.on('connect', () => {
        console.log('Connected to chat server');
    });

    socket.on('message', (data) => {
        // Only display messages from other users, not our own
        if (data.username !== currentUser && data.room === currentRoom) {
            displayMessage(data);
        }
        
        // Add message to room history
        if (rooms[data.room]) {
            rooms[data.room].messages.push(data);
        }
    });

    socket.on('userJoined', (data) => {
        if (data.room === currentRoom && data.username !== currentUser) {
            displaySystemMessage(`${data.username} joined the room`);
        }
        
        if (rooms[data.room]) {
            rooms[data.room].users.add(data.username);
        }
        updateOnlineCount();
    });

    socket.on('userLeft', (data) => {
        if (data.room === currentRoom && data.username !== currentUser) {
            displaySystemMessage(`${data.username} left the room`);
        }
        
        if (rooms[data.room]) {
            rooms[data.room].users.delete(data.username);
        }
        updateOnlineCount();
    });

    socket.connect();
}

function handleLogin(e) {
    e.preventDefault();
    const username = document.getElementById('username').value.trim();
    
    if (!username) {
        showError('Please enter a username');
        return;
    }

    if (username.length < 3) {
        showError('Username must be at least 3 characters long');
        return;
    }

    if (users.has(username)) {
        showError('Username already taken. Please choose another one.');
        return;
    }

    // Successful login
    currentUser = username;
    users.add(username);
    currentUserSpan.textContent = username;
    
    loginScreen.classList.add('hidden');
    messageInput.disabled = false;
    
    showNotification(`Welcome to ChatHub, ${username}!`);
}

function showError(message) {
    loginError.textContent = message;
    setTimeout(() => {
        loginError.textContent = '';
    }, 3000);
}

function handleSendMessage(e) {
    e.preventDefault();
    const message = messageInput.value.trim();
    
    if (!message || !currentRoom) return;

    const messageData = {
        id: Date.now(),
        username: currentUser,
        room: currentRoom,
        content: formatMessage(message),
        timestamp: new Date().toISOString()
    };

    // Display message immediately for sender
    displayMessage(messageData);
    
    // Add to room messages
    rooms[currentRoom].messages.push(messageData);
    
    // Simulate sending to other users (they would receive this through WebSocket)
    setTimeout(() => {
        // Simulate other users receiving the message
        simulateOtherUsersReceiving(messageData);
    }, 100);
    
    // Clear input
    messageInput.value = '';
    activeFormats.clear();
    updateFormatButtons();
}

function simulateOtherUsersReceiving(messageData) {
    // In a real application, this would be handled by the server
    // For demo purposes, we'll simulate other users in the room
    const otherUsers = ['Alice', 'Bob', 'Charlie', 'Diana'];
    const currentRoomUsers = Array.from(rooms[currentRoom].users);
    
    // Simulate responses from other users occasionally
    if (Math.random() < 0.3 && currentRoomUsers.length > 1) {
        const randomUser = otherUsers[Math.floor(Math.random() * otherUsers.length)];
        const responses = [
            'That\'s interesting!',
            'I agree with that.',
            'Good point!',
            'Thanks for sharing.',
            'Nice!',
            'Absolutely!',
            'I see what you mean.'
        ];
        
        setTimeout(() => {
            const response = {
                id: Date.now() + 1,
                username: randomUser,
                room: currentRoom,
                content: responses[Math.floor(Math.random() * responses.length)],
                timestamp: new Date().toISOString()
            };
            
            if (currentRoom === response.room) {
                displayMessage(response);
                rooms[currentRoom].messages.push(response);
            }
        }, 1000 + Math.random() * 2000);
    }
}

function handleKeyPress(e) {
    if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        handleSendMessage(e);
    }
}

function formatMessage(message) {
    let formatted = message;
    
    // Apply active formats
    if (activeFormats.has('bold')) {
        formatted = `<strong>${formatted}</strong>`;
    }
    if (activeFormats.has('italic')) {
        formatted = `<em>${formatted}</em>`;
    }
    if (activeFormats.has('underline')) {
        formatted = `<u>${formatted}</u>`;
    }
    
    // Auto-link URLs
    formatted = formatted.replace(
        /(https?:\/\/[^\s]+)/g,
        '<a href="$1" target="_blank" rel="noopener noreferrer">$1</a>'
    );
    
    return formatted;
}

function displayMessage(messageData) {
    const messageDiv = document.createElement('div');
    messageDiv.className = `message ${messageData.username === currentUser ? 'own' : 'other'}`;
    
    const time = new Date(messageData.timestamp).toLocaleTimeString([], {
        hour: '2-digit',
        minute: '2-digit'
    });
    
    messageDiv.innerHTML = `
        <div class="message-header">
            <span class="message-sender">${messageData.username}</span>
            <span class="message-time">${time}</span>
        </div>
        <div class="message-content">${messageData.content}</div>
    `;
    
    messagesContainer.appendChild(messageDiv);
    messagesContainer.scrollTop = messagesContainer.scrollHeight;
}

function displaySystemMessage(message) {
    const messageDiv = document.createElement('div');
    messageDiv.className = 'system-message';
    messageDiv.textContent = message;
    messagesContainer.appendChild(messageDiv);
    messagesContainer.scrollTop = messagesContainer.scrollHeight;
}

function renderRooms() {
    roomList.innerHTML = '';
    
    Object.entries(rooms).forEach(([roomId, room]) => {
        const roomItem = document.createElement('li');
        roomItem.className = 'room-item';
        roomItem.onclick = () => joinRoom(roomId);
        
        roomItem.innerHTML = `
            <div class="room-name">${room.name}</div>
            <div class="room-users">${room.users.size} users</div>
        `;
        
        roomList.appendChild(roomItem);
    });
}

function joinRoom(roomId) {
    if (currentRoom === roomId) return;
    
    // Leave current room
    if (currentRoom && rooms[currentRoom]) {
        rooms[currentRoom].users.delete(currentUser);
        // Simulate notifying others that user left
        setTimeout(() => {
            socket.emit('userLeft', { username: currentUser, room: currentRoom });
        }, 100);
    }
    
    // Join new room
    currentRoom = roomId;
    rooms[roomId].users.add(currentUser);
    currentRoomName.textContent = rooms[roomId].name;
    
    // Update UI
    document.querySelectorAll('.room-item').forEach(item => {
        item.classList.remove('active');
    });
    event.target.closest('.room-item').classList.add('active');
    
    // Load room messages
    loadRoomMessages(roomId);
    
    // Enable message input
    messageInput.disabled = false;
    sendBtn.disabled = false;
    
    // Simulate notifying others that user joined
    setTimeout(() => {
        socket.emit('userJoined', { username: currentUser, room: roomId });
    }, 100);
    
    // Update online count
    updateOnlineCount();
    renderRooms();
    
    // Close sidebar on mobile
    if (window.innerWidth <= 576) {
        document.getElementById('sidebar').classList.remove('open');
    }
}

function loadRoomMessages(roomId) {
    messagesContainer.innerHTML = '';
    
    if (rooms[roomId].messages.length === 0) {
        displaySystemMessage(`Welcome to ${rooms[roomId].name}! Start the conversation.`);
        
        // Add some simulated users to the room
        const simulatedUsers = ['Alice', 'Bob', 'Charlie'];
        simulatedUsers.forEach(user => {
            rooms[roomId].users.add(user);
        });
    } else {
        rooms[roomId].messages.forEach(message => {
            displayMessage(message);
        });
    }
}

function createRoom() {
    const roomName = prompt('Enter room name:');
    if (!roomName || roomName.trim() === '') return;
    
    const roomId = roomName.toLowerCase().replace(/\s+/g, '-');
    
    if (rooms[roomId]) {
        alert('Room already exists!');
        return;
    }
    
    rooms[roomId] = {
        name: roomName.trim(),
        users: new Set(),
        messages: []
    };
    
    renderRooms();
    showNotification(`Room "${roomName}" created successfully!`);
}

function toggleFormat(format) {
    const button = event.target;
    
    if (activeFormats.has(format)) {
        activeFormats.delete(format);
        button.classList.remove('active');
    } else {
        activeFormats.add(format);
        button.classList.add('active');
    }
}

function updateFormatButtons() {
    document.querySelectorAll('.format-btn').forEach(btn => {
        btn.classList.remove('active');
    });
}

function updateOnlineCount() {
    const totalUsers = currentRoom ? rooms[currentRoom].users.size : 0;
    onlineCount.textContent = totalUsers;
}

function toggleSidebar() {
    document.getElementById('sidebar').classList.toggle('open');
}

function handleResize() {
    if (window.innerWidth <= 576) {
        document.querySelector('.menu-toggle').style.display = 'block';
    } else {
        document.querySelector('.menu-toggle').style.display = 'none';
        document.getElementById('sidebar').classList.remove('open');
    }
}

function showNotification(message) {
    const notification = document.createElement('div');
    notification.className = 'notification';
    notification.textContent = message;
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.remove();
    }, 3000);
}