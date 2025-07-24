**ChatHub - Real-Time Chat Application**

    A modern, feature-rich real-time chat application built with HTML, CSS, and JavaScript.

 Features

    Core Features
        - Real-time messaging - Send and receive messages instantly
        - Multiple chat rooms - Join existing rooms or create new ones
        - User authentication - Secure username-based login system
        - Message formatting - Bold, italic, and underline text formatting
        - Responsive design - Works seamlessly on desktop and mobile devices

    Advanced Features
        - Typing indicators - See when other users are typing
        - Emoji picker - Express yourself with built-in emojis
        - Message history - Navigate through previous messages with arrow keys
        - Connection status - Real-time connection monitoring
        - Sound notifications - Audio alerts for new messages
        - Character counter - Visual feedback for message length
        - Unread counters - Track unread messages in other rooms
        - Active user lists - See who's currently online in each room

 Getting Started

    Prerequisites
        - A modern web browser (Chrome, Firefox, Safari, or Edge)
        - No additional software installation required

 Installation
    1. Download and extract the project files
    2. Open `index.html` in your web browser
    3. That's it! No server setup required.

 File Structure

    chat-application/
    ├── index.html          # Main HTML file
    ├── styles.css          # CSS styling (referenced in HTML)
    ├── script.js           # JavaScript functionality (referenced in HTML)
    └── README.md           # This file

 How to Use

    Getting Started
        1. Enter Username: Type your desired username (letters, numbers, underscore, hyphen only)
        2. Click "Join Chat": This will connect you to the chat system
        3. Select a Room: Choose from existing rooms (General, Random, Tech Talk) or create your own
        4. Start Chatting: Type your message and press Enter or click Send

    Available Rooms
        - General - Main discussion room
        - Random - Casual conversations
        - Tech Talk - Technology discussions
        - Custom Rooms - Create your own themed rooms

    Message Formatting
        - Bold: Use `**text**` or click the B button
        - Italic: Use `*text*` or click the I button  
        - Underline: Use `__text__` or click the U button
        - Emojis: Click the emoji button to access the emoji picker

    Keyboard Shortcuts
        - Enter: Send message
        - ↑/↓ Arrow Keys: Navigate message history
        - Ctrl/Cmd + K: Focus message input
        - Escape: Close emoji picker

    Mobile Features
        - Touch-friendly interface
        - Collapsible sidebar for room navigation
        - Responsive design adapts to screen size

 Technical Implementation

    Architecture
        - Frontend Only: Pure HTML, CSS, and JavaScript implementation
        - WebSocket Simulation: Custom WebSocket class for real-time communication
        - Local State Management: In-memory data storage for rooms and messages
        - Responsive Design: CSS Grid and Flexbox for adaptive layouts

    Key Components
        - EnhancedChatWebSocket: Simulates real-time communication
        - Room Management: Dynamic room creation and user management
        - Message System: Rich text messaging with formatting support
        - User Interface: Modern, accessible design with animations

     Browser Compatibility
        - Chrome 60+
        - Firefox 55+
        - Safari 12+
        - Edge 79+

 Security Features

    Input Validation
        - Username pattern validation
        - Message length limits (500 characters)
        - HTML content escaping to prevent XSS

    User Management
        - Unique username enforcement
        - Session-based user tracking
        - Automatic cleanup on disconnect

 Troubleshooting

    Common Issues

        Connection Problems 
        - Refresh the page if connection status shows "Offline"
        - Check browser console for error messages
        - Ensure JavaScript is enabled

        Username Issues
        - Use only letters, numbers, underscore, and hyphen
        - Keep username under 20 characters
        - Try a different username if current one is taken

        Message Not Sending
        - Check that you're connected (green status indicator)
        - Ensure you've selected a chat room
        - Verify message is under 500 characters

    Performance Tips
        - Close unused browser tabs for better performance
        - Clear browser cache if experiencing issues
        - Use latest browser version for optimal experience

 Development Notes

    Future Enhancements
        - Persistent message storage
        - File sharing capabilities  
        - Video/voice chat integration
        - User profiles and avatars
        - Room moderation tools
        - Message search functionality

    Code Structure
        - Modular JavaScript with clear separation of concerns
        - CSS custom properties for consistent theming
        - Semantic HTML for accessibility
        - Progressive enhancement approach
