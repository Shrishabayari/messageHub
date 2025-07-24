// Global variables
let currentUser = '';
let currentRoom = '';
let users = new Set();
let rooms = {
    'general': { name: 'General', users: new Set(), messages: [], unreadCount: 0 },
    'random': { name: 'Random', users: new Set(), messages: [], unreadCount: 0 },
    'tech': { name: 'Tech Talk', users: new Set(), messages: [], unreadCount: 0 }
};
let activeFormats = new Set();
let typingUsers = new Set();
let typingTimeout = null;
let isConnected = false;
let messageHistory = [];
let currentHistoryIndex = -1;
let socket = null;

// Enhanced WebSocket simulation with more realistic behavior
class EnhancedChatWebSocket {
    constructor() {
        this.listeners = {};
        this.connected = false;
        this.reconnectAttempts = 0;
        this.maxReconnectAttempts = 5;
        this.simulatedUsers = ['Alice', 'Bob', 'Charlie', 'Diana', 'Eve', 'Frank', 'Grace', 'Henry'];
        this.messageQueue = [];
        this.latency = 100;
        this.userActivityIntervals = {};
    }

    on(event, callback) {
        if (!this.listeners[event]) {
            this.listeners[event] = [];
        }
        this.listeners[event].push(callback);
    }

    emit(event, data) {
        if (this.listeners[event]) {
            this.listeners[event].forEach(callback => {
                setTimeout(() => callback(data), this.latency);
            });
        }
    }

    connect() {
        this.updateConnectionStatus('Connecting...');
        
        setTimeout(() => {
            if (Math.random() > 0.1) {
                this.connected = true;
                this.reconnectAttempts = 0;
                this.updateConnectionStatus('Connected', true);
                this.emit('connect');
                this.processMessageQueue();
                this.simulateActiveUsers();
                this.startUserActivitySimulation();
            } else {
                this.handleConnectionFailure();
            }
        }, 1000 + Math.random() * 2000);
    }

    handleConnectionFailure() {
        this.connected = false;
        this.updateConnectionStatus('Connection failed', false);
        
        if (this.reconnectAttempts < this.maxReconnectAttempts) {
            this.reconnectAttempts++;
            this.updateConnectionStatus(`Reconnecting... (${this.reconnectAttempts}/${this.maxReconnectAttempts})`);
            setTimeout(() => this.connect(), 3000);
        } else {
            this.updateConnectionStatus('Offline', false);
            showNotification('Connection failed. Please refresh the page.', 'error');
        }
    }

    updateConnectionStatus(text, online = null) {
        const statusText = document.getElementById('statusText');
        const statusIndicator = document.getElementById('statusIndicator');
        
        if (statusText) statusText.textContent = text;
        if (statusIndicator) {
            if (online === true) {
                statusIndicator.className = 'status-indicator online';
                isConnected = true;
            } else if (online === false) {
                statusIndicator.className = 'status-indicator offline';
                isConnected = false;
            }
        }
    }

    send(data) {
        if (this.connected) {
            this.messageQueue.push(data);
            this.processMessage(data);
        } else {
            showNotification('Not connected. Message will be sent when connection is restored.', 'warning');
            this.messageQueue.push(data);
        }
    }

    processMessageQueue() {
        while (this.messageQueue.length > 0) {
            const message = this.messageQueue.shift();
            this.processMessage(message);
        }
    }

    processMessage(data) {
        if (data.type === 'message') {
            this.broadcastMessage(data);
        } else if (data.type === 'typing') {
            this.broadcastTyping(data);
        } else if (data.type === 'joinRoom') {
            this.broadcastUserJoined(data);
        } else if (data.type === 'leaveRoom') {
            this.broadcastUserLeft(data);
        }
    }

    broadcastMessage(data) {
        if (rooms[data.room]) {
            rooms[data.room].messages.push(data);
        }
        
        setTimeout(() => {
            this.simulateUserResponses(data);
        }, 500 + Math.random() * 2000);
    }

    broadcastTyping(data) {
        if (Math.random() < 0.3) {
            const randomUser = this.simulatedUsers[Math.floor(Math.random() * this.simulatedUsers.length)];
            setTimeout(() => {
                this.emit('typing', { username: randomUser, room: data.room });
            }, 1000 + Math.random() * 3000);
        }
    }

    broadcastUserJoined(data) {
        if (rooms[data.room]) {
            rooms[data.room].users.add(data.username);
        }
        this.emit('userJoined', data);
        updateOnlineCount();
        renderRooms();
        updateActiveUsersList();
    }

    broadcastUserLeft(data) {
        if (rooms[data.room]) {
            rooms[data.room].users.delete(data.username);
        }
        this.emit('userLeft', data);
        updateOnlineCount();
        renderRooms();
        updateActiveUsersList();
    }

    simulateActiveUsers() {
        Object.keys(rooms).forEach(roomId => {
            const numUsers = Math.floor(Math.random() * 4) + 2;
            for (let i = 0; i < numUsers; i++) {
                const user = this.simulatedUsers[Math.floor(Math.random() * this.simulatedUsers.length)];
                rooms[roomId].users.add(user);
            }
        });
        updateOnlineCount();
        renderRooms();
        updateActiveUsersList();
    }

    startUserActivitySimulation() {
        // Simulate users joining/leaving randomly
        setInterval(() => {
            if (Math.random() < 0.1) { // 10% chance every 5 seconds
                this.simulateUserJoinLeave();
            }
        }, 5000);

        // Simulate random messages
        setInterval(() => {
            if (Math.random() < 0.2) { // 20% chance every 10 seconds
                this.simulateRandomMessage();
            }
        }, 10000);
    }

    simulateUserJoinLeave() {
        const roomIds = Object.keys(rooms);
        const randomRoom = roomIds[Math.floor(Math.random() * roomIds.length)];
        const randomUser = this.simulatedUsers[Math.floor(Math.random() * this.simulatedUsers.length)];
        
        if (rooms[randomRoom].users.has(randomUser)) {
            rooms[randomRoom].users.delete(randomUser);
            this.emit('userLeft', { username: randomUser, room: randomRoom });
        } else {
            rooms[randomRoom].users.add(randomUser);
            this.emit('userJoined', { username: randomUser, room: randomRoom });
        }
    }

    simulateRandomMessage() {
        const roomIds = Object.keys(rooms);
        const randomRoom = roomIds[Math.floor(Math.random() * roomIds.length)];
        const usersInRoom = Array.from(rooms[randomRoom].users);
        
        if (usersInRoom.length === 0) return;
        
        const randomUser = usersInRoom[Math.floor(Math.random() * usersInRoom.length)];
        const randomMessages = [
            'Hey everyone! 👋',
            'How\'s everyone doing today?',
            'Anyone working on something interesting?',
            'Great weather today! ☀️',
            'Just finished a great project!',
            'Coffee time! ☕',
            'Hope everyone is having a good day!',
            'Any recommendations for good books?',
            'Just watched an amazing movie!',
            'Working late tonight 🌙'
        ];
        
        const message = {
            id: Date.now() + Math.random(),
            username: randomUser,
            room: randomRoom,
            content: randomMessages[Math.floor(Math.random() * randomMessages.length)],
            timestamp: new Date().toISOString(),
            type: 'message'
        };
        
        if (currentRoom === randomRoom) {
            displayMessage(message);
            playNotificationSound();
        } else {
            rooms[randomRoom].unreadCount++;
            renderRooms();
        }
    }

    simulateUserResponses(originalMessage) {
        if (Math.random() < 0.4) {
            const usersInRoom = Array.from(rooms[originalMessage.room].users);
            const otherUsers = usersInRoom.filter(user => user !== originalMessage.username);
            
            if (otherUsers.length === 0) return;
            
            const randomUser = otherUsers[Math.floor(Math.random() * otherUsers.length)];
            const responses = [
                'That\'s really interesting! 🤔',
                'I totally agree with that point.',
                'Great insight! Thanks for sharing.',
                'Nice! 👍',
                'I had a similar experience.',
                'That makes sense.',
                'Absolutely! 💯',
                'Good point there.',
                'Thanks for the info! 🙏',
                'Interesting perspective.',
                'Cool! 😎',
                'Awesome! 🎉',
                'Right on! ✨',
                'Very true!',
                'I love that idea!'
            ];
            
            const response = {
                id: Date.now() + Math.random(),
                username: randomUser,
                room: originalMessage.room,
                content: responses[Math.floor(Math.random() * responses.length)],
                timestamp: new Date().toISOString(),
                type: 'message'
            };
            
            setTimeout(() => {
                if (currentRoom === response.room) {
                    displayMessage(response);
                    playNotificationSound();
                } else {
                    rooms[response.room].unreadCount++;
                    renderRooms();
                }
            }, 1000 + Math.random() * 4000);
        }
    }
}

// Initialize the application
document.addEventListener('DOMContentLoaded', function() {
    initializeApp();
});

function initializeApp() {
    setupEventListeners();
    initializeWebSocket();
    loadMessageHistory();
    updateCharacterCount();
}

function setupEventListeners() {
    // Login form
    const loginForm = document.getElementById('loginForm');
    if (loginForm) {
        loginForm.addEventListener('submit', handleLogin);
    }

    // Message form
    const messageForm = document.getElementById('messageForm');
    if (messageForm) {
        messageForm.addEventListener('submit', handleSendMessage);
    }

    // Message input
    const messageInput = document.getElementById('messageInput');
    if (messageInput) {
        messageInput.addEventListener('input', handleMessageInput);
        messageInput.addEventListener('keydown', handleKeyDown);
    }

    // Window events
    window.addEventListener('beforeunload', handleBeforeUnload);
    window.addEventListener('resize', handleResize);
}

function initializeWebSocket() {
    socket = new EnhancedChatWebSocket();
    
    socket.on('connect', () => {
        showNotification('Connected to chat server!', 'success');
    });

    socket.on('typing', (data) => {
        handleTypingIndicator(data);
    });

    socket.on('userJoined', (data) => {
        if (currentRoom === data.room) {
            displaySystemMessage(`${data.username} joined the room`);
        }
    });

    socket.on('userLeft', (data) => {
        if (currentRoom === data.room) {
            displaySystemMessage(`${data.username} left the room`);
        }
    });
}

function handleLogin(e) {
    e.preventDefault();
    const username = document.getElementById('username').value.trim();
    const errorElement = document.getElementById('loginError');
    
    if (!username) {
        errorElement.textContent = 'Please enter a username';
        return;
    }
    
    if (username.length > 20) {
        errorElement.textContent = 'Username must be 20 characters or less';
        return;
    }
    
    if (!/^[A-Za-z0-9_-]+$/.test(username)) {
        errorElement.textContent = 'Username can only contain letters, numbers, underscore and hyphen';
        return;
    }
    
    currentUser = username;
    users.add(username);
    
    // Hide login screen and show chat
    document.getElementById('loginScreen').classList.add('hidden');
    document.getElementById('currentUser').textContent = username;
    
    // Connect to WebSocket
    socket.connect();
    
    // Initialize UI
    renderRooms();
    enableMessageInput();
    
    showNotification(`Welcome to ChatHub, ${username}!`, 'success');
}

function handleSendMessage(e) {
    e.preventDefault();
    const messageInput = document.getElementById('messageInput');
    const content = messageInput.value.trim();
    
    if (!content || !currentRoom || !isConnected) return;
    
    const message = {
        id: Date.now(),
        username: currentUser,
        room: currentRoom,
        content: applyFormatting(content),
        timestamp: new Date().toISOString(),
        type: 'message'
    };
    
    // Add to message history
    messageHistory.unshift(content);
    if (messageHistory.length > 50) {
        messageHistory = messageHistory.slice(0, 50);
    }
    currentHistoryIndex = -1;
    
    // Send message
    socket.send(message);
    displayMessage(message);
    
    // Clear input and reset formatting
    messageInput.value = '';
    clearFormatting();
    updateCharacterCount();
    stopTyping();
    
    // Scroll to bottom
    scrollToBottom();
}

function handleMessageInput(e) {
    updateCharacterCount();
    handleTyping();
}

function handleKeyDown(e) {
    if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        handleSendMessage(e);
    } else if (e.key === 'ArrowUp' && !e.shiftKey) {
        e.preventDefault();
        navigateHistory('up');
    } else if (e.key === 'ArrowDown' && !e.shiftKey) {
        e.preventDefault();
        navigateHistory('down');
    }
}

function handleTyping() {
    if (!currentRoom) return;
    
    socket.send({
        type: 'typing',
        username: currentUser,
        room: currentRoom
    });
    
    clearTimeout(typingTimeout);
    typingTimeout = setTimeout(stopTyping, 3000);
}

function stopTyping() {
    if (typingTimeout) {
        clearTimeout(typingTimeout);
        typingTimeout = null;
    }
}

function handleTypingIndicator(data) {
    if (data.room !== currentRoom || data.username === currentUser) return;
    
    typingUsers.add(data.username);
    updateTypingIndicator();
    
    setTimeout(() => {
        typingUsers.delete(data.username);
        updateTypingIndicator();
    }, 3000);
}

function updateTypingIndicator() {
    const indicator = document.getElementById('typingIndicator');
    if (!indicator) return;
    
    if (typingUsers.size === 0) {
        indicator.textContent = '';
    } else if (typingUsers.size === 1) {
        indicator.innerHTML = `${Array.from(typingUsers)[0]} is typing<span class="loading-dots"></span>`;
    } else {
        indicator.innerHTML = `${typingUsers.size} people are typing<span class="loading-dots"></span>`;
    }
}

function navigateHistory(direction) {
    const messageInput = document.getElementById('messageInput');
    
    if (direction === 'up') {
        if (currentHistoryIndex < messageHistory.length - 1) {
            currentHistoryIndex++;
            messageInput.value = messageHistory[currentHistoryIndex];
        }
    } else if (direction === 'down') {
        if (currentHistoryIndex > 0) {
            currentHistoryIndex--;
            messageInput.value = messageHistory[currentHistoryIndex];
        } else if (currentHistoryIndex === 0) {
            currentHistoryIndex = -1;
            messageInput.value = '';
        }
    }
    
    updateCharacterCount();
}

function displayMessage(message) {
    const messagesContainer = document.getElementById('messagesContainer');
    if (!messagesContainer) return;
    
    const messageElement = document.createElement('div');
    messageElement.className = `message ${message.username === currentUser ? 'own' : 'other'}`;
    messageElement.dataset.messageId = message.id;
    
    const time = new Date(message.timestamp).toLocaleTimeString([], { 
        hour: '2-digit', 
        minute: '2-digit' 
    });
    
    messageElement.innerHTML = `
        <div class="message-header">
            <span class="message-sender">${escapeHtml(message.username)}</span>
            <span class="message-time">${time}</span>
        </div>
        <div class="message-content">${parseMessageContent(message.content)}</div>
        ${message.username === currentUser ? '<div class="message-status">✓</div>' : ''}
    `;
    
    messagesContainer.appendChild(messageElement);
    scrollToBottom();
    
    // Remove old messages to prevent memory issues
    const messages = messagesContainer.querySelectorAll('.message');
    if (messages.length > 100) {
        messages[0].remove();
    }
}

function displaySystemMessage(content) {
    const messagesContainer = document.getElementById('messagesContainer');
    if (!messagesContainer) return;
    
    const messageElement = document.createElement('div');
    messageElement.className = 'system-message';
    messageElement.textContent = content;
    
    messagesContainer.appendChild(messageElement);
    scrollToBottom();
}

function parseMessageContent(content) {
    // Parse URLs
    content = content.replace(
        /(https?:\/\/[^\s]+)/g,
        '<a href="$1" target="_blank" rel="noopener noreferrer">$1</a>'
    );
    
    // Parse basic formatting
    content = content.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
    content = content.replace(/\*(.*?)\*/g, '<em>$1</em>');
    content = content.replace(/__(.*?)__/g, '<u>$1</u>');
    
    return content;
}

function applyFormatting(text) {
    let formattedText = text;
    
    if (activeFormats.has('bold')) {
        formattedText = `**${formattedText}**`;
    }
    if (activeFormats.has('italic')) {
        formattedText = `*${formattedText}*`;
    }
    if (activeFormats.has('underline')) {
        formattedText = `__${formattedText}__`;
    }
    
    return formattedText;
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

function clearFormatting() {
    activeFormats.clear();
    document.querySelectorAll('.format-btn').forEach(btn => {
        btn.classList.remove('active');
    });
}

function insertEmoji(emoji) {
    const messageInput = document.getElementById('messageInput');
    const currentValue = messageInput.value;
    const cursorPos = messageInput.selectionStart;
    
    const newValue = currentValue.slice(0, cursorPos) + emoji + currentValue.slice(cursorPos);
    messageInput.value = newValue;
    messageInput.focus();
    messageInput.setSelectionRange(cursorPos + emoji.length, cursorPos + emoji.length);
    
    updateCharacterCount();
    toggleEmojiPicker();
}

function toggleEmojiPicker() {
    const emojiPicker = document.getElementById('emojiPicker');
    if (emojiPicker.style.display === 'none' || !emojiPicker.style.display) {
        emojiPicker.style.display = 'block';
        // Close picker when clicking outside
        setTimeout(() => {
            document.addEventListener('click', closeEmojiPicker);
        }, 0);
    } else {
        emojiPicker.style.display = 'none';
        document.removeEventListener('click', closeEmojiPicker);
    }
}

function closeEmojiPicker(e) {
    const emojiPicker = document.getElementById('emojiPicker');
    if (!emojiPicker.contains(e.target) && !e.target.classList.contains('format-btn')) {
        emojiPicker.style.display = 'none';
        document.removeEventListener('click', closeEmojiPicker);
    }
}

function updateCharacterCount() {
    const messageInput = document.getElementById('messageInput');
    const characterCount = document.getElementById('characterCount');
    const sendBtn = document.getElementById('sendBtn');
    
    if (!messageInput || !characterCount) return;
    
    const length = messageInput.value.length;
    characterCount.textContent = `${length}/500`;
    
    if (length >= 450) {
        characterCount.style.color = '#dc3545';
    } else if (length >= 400) {
        characterCount.style.color = '#ffc107';
    } else {
        characterCount.style.color = '#6c757d';
    }
    
    if (sendBtn) {
        sendBtn.disabled = length === 0 || length > 500 || !isConnected;
    }
}

function createRoom() {
    const roomName = prompt('Enter room name:');
    if (!roomName || !roomName.trim()) return;
    
    const roomId = roomName.toLowerCase().replace(/[^a-z0-9]/g, '');
    if (rooms[roomId]) {
        showNotification('Room already exists!', 'error');
        return;
    }
    
    rooms[roomId] = {
        name: roomName.trim(),
        users: new Set([currentUser]),
        messages: [],
        unreadCount: 0
    };
    
    renderRooms();
    joinRoom(roomId);
    showNotification(`Room "${roomName}" created!`, 'success');
}

function joinRoom(roomId) {
    if (!rooms[roomId]) return;
    
    // Leave current room
    if (currentRoom && rooms[currentRoom]) {
        rooms[currentRoom].users.delete(currentUser);
        socket.send({
            type: 'leaveRoom',
            username: currentUser,
            room: currentRoom
        });
    }
    
    // Join new room
    currentRoom = roomId;
    rooms[roomId].users.add(currentUser);
    rooms[roomId].unreadCount = 0;
    
    socket.send({
        type: 'joinRoom',
        username: currentUser,
        room: roomId
    });
    
    // Update UI
    document.getElementById('currentRoomName').textContent = rooms[roomId].name;
    renderRooms();
    loadRoomMessages(roomId);
    updateActiveUsersList();
    enableMessageInput();
    
    // Clear typing users
    typingUsers.clear();
    updateTypingIndicator();
}

function loadRoomMessages(roomId) {
    const messagesContainer = document.getElementById('messagesContainer');
    if (!messagesContainer) return;
    
    messagesContainer.innerHTML = '';
    
    if (rooms[roomId] && rooms[roomId].messages.length > 0) {
        rooms[roomId].messages.forEach(message => {
            displayMessage(message);
        });
    } else {
        displaySystemMessage(`Welcome to ${rooms[roomId].name}! Start the conversation.`);
    }
}

function renderRooms() {
    const roomList = document.getElementById('roomList');
    if (!roomList) return;
    
    roomList.innerHTML = '';
    
    Object.entries(rooms).forEach(([roomId, room]) => {
        const roomElement = document.createElement('li');
        roomElement.className = `room-item ${currentRoom === roomId ? 'active' : ''}`;
        roomElement.onclick = () => joinRoom(roomId);
        
        roomElement.innerHTML = `
            <div class="room-name">${escapeHtml(room.name)}</div>
            <div class="room-users">${room.users.size} users</div>
            ${room.unreadCount > 0 ? `<div class="unread-count">${room.unreadCount}</div>` : ''}
        `;
        
        roomList.appendChild(roomElement);
    });
}

function updateActiveUsersList() {
    const activeUsersList = document.getElementById('activeUsersList');
    if (!activeUsersList || !currentRoom || !rooms[currentRoom]) return;
    
    activeUsersList.innerHTML = '';
    
    Array.from(rooms[currentRoom].users).sort().forEach(username => {
        const userElement = document.createElement('li');
        userElement.innerHTML = `
            <div class="user-avatar">${username.charAt(0).toUpperCase()}</div>
            ${escapeHtml(username)}
        `;
        activeUsersList.appendChild(userElement);
    });
}

function updateOnlineCount() {
    const onlineCount = document.getElementById('onlineCount');
    if (!onlineCount) return;
    
    const totalUsers = new Set();
    Object.values(rooms).forEach(room => {
        room.users.forEach(user => totalUsers.add(user));
    });
    
    onlineCount.textContent = totalUsers.size;
}

function enableMessageInput() {
    const messageInput = document.getElementById('messageInput');
    const sendBtn = document.getElementById('sendBtn');
    
    if (messageInput) {
        messageInput.disabled = !currentRoom || !isConnected;
        messageInput.placeholder = currentRoom && isConnected 
            ? 'Type your message...' 
            : 'Select a room to start chatting...';
    }
    
    if (sendBtn) {
        sendBtn.disabled = !currentRoom || !isConnected || !messageInput.value.trim();
    }
}

function scrollToBottom() {
    const messagesContainer = document.getElementById('messagesContainer');
    if (messagesContainer) {
        messagesContainer.scrollTop = messagesContainer.scrollHeight;
    }
}

function showNotification(message, type = 'success') {
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.textContent = message;
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.style.opacity = '0';
        setTimeout(() => {
            if (notification.parentNode) {
                notification.parentNode.removeChild(notification);
            }
        }, 300);
    }, 3000);
}

function playNotificationSound() {
    // Create a simple beep sound using Web Audio API
    try {
        const audioContext = new (window.AudioContext || window.webkitAudioContext)();
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();
        
        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);
        
        oscillator.frequency.value = 800;
        oscillator.type = 'sine';
        
        gainNode.gain.setValueAtTime(0.1, audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.1);
        
        oscillator.start(audioContext.currentTime);
        oscillator.stop(audioContext.currentTime + 0.1);
    } catch (e) {
        // Silently fail if audio context is not available
    }
}

function toggleSidebar() {
    const sidebar = document.getElementById('sidebar');
    if (sidebar) {
        sidebar.classList.toggle('open');
    }
}

function handleBeforeUnload(e) {
    if (currentRoom && currentUser) {
        socket.send({
            type: 'leaveRoom',
            username: currentUser,
            room: currentRoom
        });
    }
}

function handleResize() {
    // Adjust UI for mobile devices
    const isMobile = window.innerWidth <= 576;
    const menuToggle = document.querySelector('.menu-toggle');
    
    if (menuToggle) {
        menuToggle.style.display = isMobile ? 'block' : 'none';
    }
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

function loadMessageHistory() {
    // This would typically load from localStorage or server
    // For now, we'll just initialize an empty history
    messageHistory = [];
}

// Add some keyboard shortcuts
document.addEventListener('keydown', function(e) {
    // Ctrl/Cmd + K to focus message input
    if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        const messageInput = document.getElementById('messageInput');
        if (messageInput) {
            messageInput.focus();
        }
    }
    
    // Escape to close emoji picker
    if (e.key === 'Escape') {
        const emojiPicker = document.getElementById('emojiPicker');
        if (emojiPicker && emojiPicker.style.display === 'block') {
            emojiPicker.style.display = 'none';
            document.removeEventListener('click', closeEmojiPicker);
        }
    }
});

// Initialize responsive behavior
handleResize();
window.addEventListener('resize', handleResize);