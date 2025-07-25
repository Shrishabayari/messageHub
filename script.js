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
let reconnectAttempts = 0;
let maxReconnectAttempts = 5;
let reconnectTimeout = null;
let isLoggingIn = false; // Flag to track login process

// WebSocket server URL - Change this to your server URL
const WS_SERVER_URL = 'ws://localhost:8080';

// Initialize the application
document.addEventListener('DOMContentLoaded', function() {
    initializeApp();
});

function initializeApp() {
    setupEventListeners();
    loadMessageHistory();
    updateCharacterCount();
    // Don't connect WebSocket until user logs in
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
    if (socket && socket.readyState === WebSocket.OPEN) {
        socket.close();
    }

    updateConnectionStatus('Connecting...');
    
    try {
        socket = new WebSocket(WS_SERVER_URL);
        
        socket.onopen = function() {
            console.log('WebSocket connected');
            isConnected = true;
            reconnectAttempts = 0;
            updateConnectionStatus('Connected', true);
            
            // Only send authentication if we have a valid currentUser
            if (currentUser && currentUser.trim() !== '') {
                sendMessage({
                    type: 'auth',
                    username: currentUser
                });
            } else {
                // If no valid user, close connection and reset
                console.error('No valid username for authentication');
                resetLoginForm();
                showLoginError('Invalid username. Please try again.');
                socket.close();
                return;
            }
            
            // Clear any reconnect timeouts
            if (reconnectTimeout) {
                clearTimeout(reconnectTimeout);
                reconnectTimeout = null;
            }
        };
        
        socket.onmessage = function(event) {
            try {
                const data = JSON.parse(event.data);
                handleServerMessage(data);
            } catch (error) {
                console.error('Error parsing message:', error);
            }
        };
        
        socket.onclose = function(event) {
            console.log('WebSocket disconnected:', event.code, event.reason);
            isConnected = false;
            updateConnectionStatus('Disconnected', false);
            enableMessageInput();
            
            // If we're in the login process and connection closed, reset login
            if (isLoggingIn) {
                resetLoginForm();
                showLoginError('Connection failed. Please try again.');
                return;
            }
            
            // Attempt to reconnect if not a normal closure
            if (event.code !== 1000 && reconnectAttempts < maxReconnectAttempts) {
                attemptReconnect();
            } else if (reconnectAttempts >= maxReconnectAttempts) {
                updateConnectionStatus('Connection failed', false);
                showNotification('Unable to connect to server. Please refresh the page.', 'error');
            }
        };
        
        socket.onerror = function(error) {
            console.error('WebSocket error:', error);
            updateConnectionStatus('Connection error', false);
            
            // If we're in the login process, show error on login screen
            if (isLoggingIn) {
                resetLoginForm();
                showLoginError('Connection error occurred. Please try again.');
            } else {
                showNotification('Connection error occurred', 'error');
            }
        };
        
    } catch (error) {
        console.error('Failed to create WebSocket:', error);
        updateConnectionStatus('Connection failed', false);
        
        if (isLoggingIn) {
            resetLoginForm();
            showLoginError('Failed to connect to server. Please try again.');
        } else {
            showNotification('Failed to connect to server', 'error');
            attemptReconnect();
        }
    }
}

function attemptReconnect() {
    if (reconnectAttempts >= maxReconnectAttempts) {
        updateConnectionStatus('Connection failed', false);
        showNotification('Maximum reconnection attempts reached', 'error');
        return;
    }
    
    reconnectAttempts++;
    updateConnectionStatus(`Reconnecting... (${reconnectAttempts}/${maxReconnectAttempts})`);
    
    reconnectTimeout = setTimeout(() => {
        console.log(`Reconnection attempt ${reconnectAttempts}`);
        initializeWebSocket();
    }, 3000 * reconnectAttempts); // Exponential backoff
}

function handleServerMessage(data) {
    switch(data.type) {
        case 'message':
            if (data.room === currentRoom) {
                displayMessage(data);
                if (data.username !== currentUser) {
                    playNotificationSound();
                }
            } else {
                // Message in other room - increment unread count
                if (rooms[data.room]) {
                    rooms[data.room].unreadCount++;
                    renderRooms();
                }
            }
            break;
            
        case 'userJoined':
            if (rooms[data.room]) {
                rooms[data.room].users.add(data.username);
            }
            if (currentRoom === data.room && data.username !== currentUser) {
                displaySystemMessage(`${data.username} joined the room`);
            }
            updateOnlineCount();
            renderRooms();
            updateActiveUsersList();
            break;
            
        case 'userLeft':
            if (rooms[data.room]) {
                rooms[data.room].users.delete(data.username);
            }
            if (currentRoom === data.room && data.username !== currentUser) {
                displaySystemMessage(`${data.username} left the room`);
            }
            updateOnlineCount();
            renderRooms();
            updateActiveUsersList();
            break;
            
        case 'typing':
            if (data.room === currentRoom && data.username !== currentUser) {
                handleTypingIndicator(data);
            }
            break;
            
        case 'stopTyping':
            if (data.room === currentRoom) {
                typingUsers.delete(data.username);
                updateTypingIndicator();
            }
            break;
            
        case 'roomUsers':
            if (rooms[data.room]) {
                rooms[data.room].users.clear();
                data.users.forEach(user => rooms[data.room].users.add(user));
                updateOnlineCount();
                renderRooms();
                updateActiveUsersList();
            }
            break;
            
        case 'roomCreated':
            rooms[data.roomId] = {
                name: data.roomName,
                users: new Set(),
                messages: [],
                unreadCount: 0
            };
            renderRooms();
            showNotification(`Room "${data.roomName}" created!`, 'success');
            break;
            
        case 'error':
            // If we're in the login process, show error on login screen
            if (isLoggingIn) {
                resetLoginForm();
                showLoginError(data.message || 'An error occurred during login');
            } else {
                showNotification(data.message || 'An error occurred', 'error');
            }
            break;
            
        case 'authSuccess':
            // Login successful - proceed to chat
            isLoggingIn = false;
            showChatInterface();
            showNotification(`Welcome to ChatHub, ${data.username}!`, 'success');
            // Auto-join general room
            joinRoom('general');
            break;
            
        default:
            console.log('Unknown message type:', data.type);
    }
}

function sendMessage(data) {
    if (socket && socket.readyState === WebSocket.OPEN) {
        // Additional validation for auth messages
        if (data.type === 'auth' && (!data.username || data.username.trim() === '')) {
            console.error('Attempted to send empty username for authentication');
            if (isLoggingIn) {
                resetLoginForm();
                showLoginError('Invalid username. Please try again.');
            }
            return false;
        }
        
        socket.send(JSON.stringify(data));
        return true;
    } else {
        if (isLoggingIn) {
            resetLoginForm();
            showLoginError('Connection lost. Please try again.');
        } else {
            showNotification('Not connected to server', 'warning');
        }
        return false;
    }
}

function updateConnectionStatus(text, online = null) {
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

function handleLogin(e) {
    e.preventDefault();
    const username = document.getElementById('username').value.trim();
    const errorElement = document.getElementById('loginError');
    const submitButton = e.target.querySelector('button[type="submit"]');
    
    // Clear previous errors
    errorElement.textContent = '';
    
    if (!username || username === '') {
        showLoginError('Please enter a username');
        return;
    }
    
    if (username.length > 20) {
        showLoginError('Username must be 20 characters or less');
        return;
    }
    
    if (!/^[A-Za-z0-9_-]+$/.test(username)) {
        showLoginError('Username can only contain letters, numbers, underscore and hyphen');
        return;
    }
    
    // Additional validation to prevent empty or whitespace-only usernames
    if (username.replace(/\s/g, '') === '') {
        showLoginError('Username cannot be empty or contain only spaces');
        return;
    }
    
    // Disable submit button and show loading state
    submitButton.disabled = true;
    submitButton.textContent = 'Connecting...';
    isLoggingIn = true;
    
    // Only set currentUser after all validations pass
    currentUser = username;
    users.add(username);
    
    // Connect to WebSocket for authentication
    initializeWebSocket();
}

function resetLoginForm() {
    const submitButton = document.querySelector('#loginForm button[type="submit"]');
    const usernameInput = document.getElementById('username');
    
    if (submitButton) {
        submitButton.disabled = false;
        submitButton.textContent = 'Join Chat';
    }
    
    if (usernameInput) {
        usernameInput.focus();
    }
    
    isLoggingIn = false;
    
    // Clear currentUser only if login failed
    if (isLoggingIn === false) {
        currentUser = '';
        users.clear(); // Clear the users set as well
    }
    
    // Close socket if open
    if (socket && socket.readyState === WebSocket.OPEN) {
        socket.close(1000, 'Login cancelled');
    }
}

function showLoginError(message) {
    const errorElement = document.getElementById('loginError');
    if (errorElement) {
        errorElement.textContent = message;
        errorElement.style.display = 'block';
    }
}

function showChatInterface() {
    // Hide login screen and show chat
    document.getElementById('loginScreen').classList.add('hidden');
    document.getElementById('currentUser').textContent = currentUser;
    
    // Initialize UI
    renderRooms();
    enableMessageInput();
}

function handleSendMessage(e) {
    e.preventDefault();
    const messageInput = document.getElementById('messageInput');
    const content = messageInput.value.trim();
    
    if (!content || !currentRoom || !isConnected) return;
    
    const message = {
        type: 'message',
        username: currentUser,
        room: currentRoom,
        content: applyFormatting(content),
        timestamp: new Date().toISOString()
    };
    
    // Add to message history
    messageHistory.unshift(content);
    if (messageHistory.length > 50) {
        messageHistory = messageHistory.slice(0, 50);
    }
    currentHistoryIndex = -1;
    
    // Send message to server
    if (sendMessage(message)) {
        // Clear input and reset formatting
        messageInput.value = '';
        clearFormatting();
        updateCharacterCount();
        stopTyping();
        
        // Scroll to bottom
        scrollToBottom();
    }
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
    if (!currentRoom || !isConnected) return;
    
    sendMessage({
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
    
    if (currentRoom && isConnected) {
        sendMessage({
            type: 'stopTyping',
            username: currentUser,
            room: currentRoom
        });
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
    messageElement.dataset.messageId = message.id || Date.now();
    
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
    
    // Send room creation request to server
    sendMessage({
        type: 'createRoom',
        roomId: roomId,
        roomName: roomName.trim(),
        creator: currentUser
    });
}

function joinRoom(roomId) {
    if (!rooms[roomId] || !isConnected) return;
    
    // Leave current room
    if (currentRoom && rooms[currentRoom]) {
        sendMessage({
            type: 'leaveRoom',
            username: currentUser,
            room: currentRoom
        });
    }
    
    // Join new room
    currentRoom = roomId;
    rooms[roomId].unreadCount = 0;
    
    sendMessage({
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
    if (currentRoom && currentUser && isConnected) {
        sendMessage({
            type: 'leaveRoom',
            username: currentUser,
            room: currentRoom
        });
    }
    
    if (socket && socket.readyState === WebSocket.OPEN) {
        socket.close(1000, 'Page unload');
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