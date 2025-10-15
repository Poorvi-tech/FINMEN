import User from '../models/User.js';
import ChatMessage from '../models/ChatMessage.js';
import ChatSession from '../models/ChatSession.js';
import ActivityLog from '../models/ActivityLog.js';
import aimlService from '../services/aimlService.js';

/**
 * Socket handler for chat real-time interactions
 * Enables students to send and receive chat messages
 */
export const setupChatSocket = (io, socket, user) => {
  // Student subscribe to chat - Enhanced with AIML chat history
  socket.on('student:chat:subscribe', async ({ studentId }) => {
    try {
      // Verify user permissions (allow students, teachers, and other school roles)
      const allowedRoles = ['student', 'school_teacher', 'school_student', 'parent', 'school_parent'];
      if (user._id.toString() !== studentId || !allowedRoles.includes(user.role)) {
        socket.emit('student:chat:error', { message: 'Unauthorized access' });
        return;
      }

      console.log(`💬 Student ${studentId} subscribed to AIML chat`);
      
      // Join student-specific room for chat updates
      socket.join(`student-chat-${studentId}`);
      
      // Get or create student's chat session
      let chatSession = await ChatSession.findOne({ userId: studentId });
      if (!chatSession) {
        const today = new Date().toISOString().split('T')[0];
        chatSession = new ChatSession({
          userId: studentId,
          sessionId: `finmen_${studentId}_${today}`,
          messages: [],
          lastUsed: new Date()
        });
        await chatSession.save();
      }
      
      // Update stats and send chat history with user stats
      chatSession.updateStats();
      await chatSession.save();
      
      // Send enhanced chat history with session stats
      const enhancedHistory = {
        messages: chatSession.messages.slice(-50), // Last 50 messages
        userXP: chatSession.userXP,
        chatStreak: chatSession.chatStreak,
        achievements: chatSession.achievements,
        averageMood: chatSession.averageMood
      };
      
      socket.emit('student:chat:history', enhancedHistory);
      
      // Check AIML service health and notify client
      const serviceHealth = await aimlService.checkServiceHealth();
      socket.emit('student:chat:service-status', { 
        aimlAvailable: serviceHealth,
        message: serviceHealth ? 
          'AI chatbot is ready! 🤖✨' : 
          'AI is in basic mode - still here to help! 🤖'
      });
      
    } catch (err) {
      console.error('Error in student:chat:subscribe:', err);
      socket.emit('student:chat:error', { message: err.message });
    }
  });

  // Student send chat message - Enhanced with AIML integration
  socket.on('student:chat:send', async ({ studentId, message, text, attachments = [] }) => {
    try {
      // Verify user permissions (allow students, teachers, and other school roles)
      const allowedRoles = ['student', 'school_teacher', 'school_student', 'parent', 'school_parent'];
      if (user._id.toString() !== studentId || !allowedRoles.includes(user.role)) {
        socket.emit('student:chat:error', { message: 'Unauthorized access' });
        return;
      }

      // Use either 'message' or 'text' parameter for backward compatibility
      const userMessage = message || text;
      
      // Validate input
      if (!userMessage && attachments.length === 0) {
        socket.emit('student:chat:error', { message: 'Message or attachment is required' });
        return;
      }

      console.log(`💬 Student ${studentId} sent message: ${userMessage}`);
      
      // Process message through AIML service
      const chatResponse = await aimlService.processMessage(studentId, userMessage);
      
      // Update chat session stats
      const chatSession = await ChatSession.findOne({ userId: studentId });
      if (chatSession) {
        chatSession.updateStats();
        await chatSession.save();
      }
      
      // Send user message to student
      socket.emit('student:chat:message', chatResponse.userMessage);
      
      // Send bot response with a small delay for natural feel
      setTimeout(() => {
        socket.emit('student:chat:message', chatResponse.botMessage);
      }, 500 + Math.random() * 1500); // Random delay between 0.5-2 seconds
      
      // Log activity
      await ActivityLog.create({
        userId: studentId,
        activityType: 'chat_message_sent',
        details: {
          messageLength: userMessage.length,
          category: chatResponse.botMessage.category,
          hasAttachments: attachments.length > 0
        },
        timestamp: new Date()
      });

    } catch (err) {
      console.error('Error in student:chat:send:', err);
      socket.emit('student:chat:error', { message: 'Failed to process your message. Please try again.' });
    }
  });

  // Admin subscribe to all student chats
  socket.on('admin:chat:subscribe', async ({ adminId }) => {
    try {
      // Verify admin permissions
      if (user._id.toString() !== adminId || user.role !== 'admin') {
        socket.emit('admin:chat:error', { message: 'Unauthorized access' });
        return;
      }

      console.log(`💬 Admin ${adminId} subscribed to all chats`);
      
      // Join admin-specific room for chat updates
      socket.join('admin-chat');
      
      // Get all recent chat messages (last 100 messages)
      const chatHistory = await ChatMessage.find({})
        .sort({ timestamp: -1 })
        .limit(100)
        .populate('senderId', 'name profilePicture')
        .populate('receiverId', 'name profilePicture')
        .lean();
      
      socket.emit('admin:chat:history', chatHistory);
      
    } catch (err) {
      console.error('Error in admin:chat:subscribe:', err);
      socket.emit('admin:chat:error', { message: err.message });
    }
  });

  // Admin send chat message to student
  socket.on('admin:chat:send', async ({ adminId, studentId, message, attachments = [] }) => {
    try {
      // Verify admin permissions
      if (user._id.toString() !== adminId || user.role !== 'admin') {
        socket.emit('admin:chat:error', { message: 'Unauthorized access' });
        return;
      }

      // Validate input
      if (!message && attachments.length === 0) {
        socket.emit('admin:chat:error', { message: 'Message or attachment is required' });
        return;
      }

      if (!studentId) {
        socket.emit('admin:chat:error', { message: 'Student ID is required' });
        return;
      }

      // Verify student exists
      const student = await User.findOne({ _id: studentId, role: 'student' });
      if (!student) {
        socket.emit('admin:chat:error', { message: 'Student not found' });
        return;
      }

      // Create chat message
      const chatMessage = await ChatMessage.create({
        senderId: adminId,
        receiverId: studentId,
        message,
        attachments,
        timestamp: new Date(),
        isRead: false
      });

      // Populate sender info
      const populatedMessage = await ChatMessage.findById(chatMessage._id)
        .populate('senderId', 'name profilePicture')
        .lean();

      // Log activity
      await ActivityLog.create({
        userId: adminId,
        activityType: 'chat_message_sent',
        details: {
          messageId: chatMessage._id,
          receiverId: studentId
        },
        timestamp: new Date()
      });

      // Send message to all admins
      io.to('admin-chat').emit('admin:chat:message', {
        ...populatedMessage,
        studentId
      });
      
      // Send message to specific student if they're online
      io.to(`student-chat-${studentId}`).emit('student:chat:message', populatedMessage);

    } catch (err) {
      console.error('Error in admin:chat:send:', err);
      socket.emit('admin:chat:error', { message: err.message });
    }
  });

  // Mark messages as read
  socket.on('chat:mark-read', async ({ userId, messageIds }) => {
    try {
      // Verify user permissions
      if (user._id.toString() !== userId) {
        socket.emit('chat:error', { message: 'Unauthorized access' });
        return;
      }

      if (!messageIds || !Array.isArray(messageIds) || messageIds.length === 0) {
        socket.emit('chat:error', { message: 'Message IDs are required' });
        return;
      }

      // Update messages as read
      await ChatMessage.updateMany(
        { _id: { $in: messageIds }, receiverId: userId },
        { $set: { isRead: true } }
      );

      // Notify about read status
      if (user.role === 'student') {
        io.to('admin-chat').emit('admin:chat:read', { messageIds, studentId: userId });
      } else if (user.role === 'admin') {
        // Find the students associated with these messages
        const messages = await ChatMessage.find({ _id: { $in: messageIds } });
        const studentIds = [...new Set(messages.map(msg => 
          msg.senderId.toString() === userId ? msg.receiverId.toString() : msg.senderId.toString()
        ))];
        
        // Notify each student
        studentIds.forEach(studentId => {
          io.to(`student-chat-${studentId}`).emit('student:chat:read', { messageIds });
        });
      }

    } catch (err) {
      console.error('Error in chat:mark-read:', err);
      socket.emit('chat:error', { message: err.message });
    }
  });

  // Cleanup when socket disconnects
  socket.on('disconnect', () => {
    // Leave all rooms related to chat
    if (user.role === 'student') {
      socket.leave(`student-chat-${user._id}`);
    } else if (user.role === 'admin') {
      socket.leave('admin-chat');
    }
  });
};