# ChatHub - Real-Time Chat Application

A modern, feature-rich real-time chat application built with HTML, CSS, JavaScript, and Node.js WebSocket server.

![ChatHub Demo](https://img.shields.io/badge/Status-Active-green) ![Node.js](https://img.shields.io/badge/Node.js-14%2B-brightgreen) ![WebSocket](https://img.shields.io/badge/WebSocket-Supported-blue)

## 🌟 Features

### Core Features
- **Real-time messaging** - Send and receive messages instantly
- **Multiple chat rooms** - Join existing rooms (General, Random, Tech Talk) or create custom ones
- **User authentication** - Secure username-based login system with validation
- **Message formatting** - Bold (`**text**`), italic (`*text*`), and underline (`__text__`) support
- **Responsive design** - Works seamlessly on desktop, tablet, and mobile devices

### Advanced Features
- **Typing indicators** - See when other users are typing in real-time
- **Emoji picker** - Express yourself with built-in emoji selector
- **Message history** - Navigate through previous messages with arrow keys
- **Connection status** - Real-time connection monitoring with auto-reconnection
- **Sound notifications** - Audio alerts for new messages
- **Character counter** - Visual feedback for message length (500 char limit)
- **Unread counters** - Track unread messages in other rooms
- **Active user lists** - See who's currently online in each room
- **URL auto-linking** - Automatically converts URLs to clickable links

## 🚀 Getting Started

### Prerequisites
- **Node.js 14.0.0 or higher** - [Download here](https://nodejs.org/)
- A modern web browser (Chrome, Firefox, Safari, or Edge)

### Installation

1. **Clone or download the project**
   ```bash
   # If using git
   git clone <repository-url>
   cd chathub
   
   # Or extract downloaded ZIP file
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Start the server**
   ```bash
   # Production mode
   npm start
   
   # Development mode (with auto-restart)
   npm run dev
   ```

4. **Open your browser**
   - Navigate to `http://localhost:8080`
   - Enter your username and start chatting!

### Quick Start Guide

1. **Enter Username**: Type your desired username (letters, numbers, underscore, hyphen only)
2. **Join Chat**: Click "Join Chat" to connect to the server
3. **Select Room**: Choose from existing rooms or create a new one
4. **Start Chatting**: Type your message and press Enter or click Send

## 📁 Project Structure

```
chathub/
├── index.html          # Main HTML file
├── script.js           # Client-side JavaScript
├── styles.css          # CSS styling
├── server.js           # Node.js WebSocket server
├── package.json        # Node.js dependencies
├── package-lock.json   # Lock file for dependencies
├── node_modules/       # Installed dependencies
└── README.md           # This file
```

## 🎮 How to Use

### Basic Usage
- **Send Message**: Type in the input field and press Enter or click Send
- **Join Room**: Click on any room in the sidebar to join
- **Create Room**: Click "Create Room" button and enter a room name
- **Format Text**: Use markdown syntax or click formatting buttons
- **Add Emojis**: Click the emoji button (😀) to open emoji picker

### Message Formatting
- **Bold**: `**your text**` or click **B** button
- **Italic**: `*your text*` or click *I* button  
- **Underline**: `__your text__` or click <u>U</u> button
- **Links**: URLs are automatically converted to clickable links

### Keyboard Shortcuts
- **Enter**: Send message
- **↑/↓ Arrow Keys**: Navigate through message history
- **Ctrl/Cmd + K**: Focus message input field
- **Escape**: Close emoji picker

### Mobile Features
- Touch-friendly interface with large tap targets
- Collapsible sidebar accessed via menu button (☰)
- Optimized keyboard for message input
- Responsive design adapts to screen orientation

## 🔧 Technical Details

### Architecture
- **Frontend**: Pure HTML5, CSS3, and ES6+ JavaScript
- **Backend**: Node.js with WebSocket (ws) library
- **Communication**: Real-time bidirectional WebSocket protocol
- **State Management**: In-memory storage with automatic cleanup

### Browser Compatibility
- **Chrome**: 60+
- **Firefox**: 55+
- **Safari**: 12+
- **Edge**: 79+

### Security Features
- **Input Validation**: Username pattern validation and message length limits
- **XSS Prevention**: HTML content escaping to prevent cross-site scripting
- **Connection Security**: Secure WebSocket handling with proper error management

## 🛠️ Development

### Available Scripts
```bash
npm start       # Start production server
npm run dev     # Start development server with auto-restart
```

### Server Configuration
- **Default Port**: 8080
- **WebSocket URL**: `ws://localhost:8080`
- **Environment**: Set `PORT` environment variable to change port

### Customization
To modify the server port:
```bash
# Linux/Mac
PORT=3000 npm start

# Windows
set PORT=3000 && npm start
```

## 🐛 Troubleshooting

### Common Issues

**Connection Problems**
- Ensure Node.js server is running (`npm start`)
- Check if port 8080 is available
- Verify WebSocket URL in `script.js` matches your server
- Check browser console for error messages

**Username Issues**
- Use only letters, numbers, underscore (_), and hyphen (-)
- Keep username under 20 characters
- Try a different username if current one is taken

**Messages Not Sending**
- Check connection status (should show green "Connected")
- Ensure you've joined a chat room
- Verify message is under 500 characters
- Refresh page if connection is lost

### Performance Tips
- **Memory**: Close unused browser tabs for better performance
- **Network**: Use stable internet connection for best experience
- **Browser**: Keep browser updated to latest version

## 🚀 Deployment

### Local Network Access
To allow other devices on your network to access the chat:

1. Find your local IP address:
   ```bash
   # Windows
   ipconfig
   
   # Mac/Linux
   ifconfig
   ```

2. Update `WS_SERVER_URL` in `script.js`:
   ```javascript
   const WS_SERVER_URL = 'ws://YOUR_LOCAL_IP:8080';
   ```

3. Access from other devices: `http://YOUR_LOCAL_IP:8080`

### Production Deployment
For production deployment, consider:
- Using a process manager like PM2
- Setting up reverse proxy with Nginx
- Implementing HTTPS/WSS for secure connections
- Adding database for message persistence

## 🤝 Contributing

This is a student project, but suggestions are welcome! Areas for enhancement:
- File sharing capabilities
- Message search functionality
- User profiles and avatars
- Private messaging
- Room moderation tools
- Message persistence with database

## 📄 License

This project is licensed under the MIT License - see the package.json file for details.

## 👨‍💻 Author

Created as part of a web development assignment to demonstrate real-time chat application development using modern web technologies.

## 🙏 Acknowledgments

- Built with WebSocket technology for real-time communication
- Responsive design inspired by modern chat applications
- Emoji support for enhanced user expression
- Professional-grade error handling and reconnection logic

---

**Happy Chatting! 🎉**

For support or questions, check the browser console for error messages and ensure all prerequisites are met.