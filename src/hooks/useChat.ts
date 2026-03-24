import { useState, useCallback } from 'react';
import { 
  db,
  collection, 
  addDoc, 
  updateDoc, 
  doc, 
  serverTimestamp, 
  writeBatch 
} from '../api/apiClient';
import { ChatMessage, UserProfile } from '../types';

export function useChat(user: UserProfile | null) {
  const [newMessage, setNewMessage] = useState('');
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [adminChatUserId, setAdminChatUserId] = useState<string | null>(null);

  const sendMessage = useCallback(async (targetUserId?: string) => {
    if (!user || !newMessage.trim()) return;

    try {
      const chatId = user.role === 'admin' ? (targetUserId || adminChatUserId) : user.uid;
      if (!chatId) return;

      const messageData = {
        userId: chatId,
        senderId: user.uid,
        senderName: user.displayName,
        senderRole: user.role,
        text: newMessage.trim(),
        timestamp: serverTimestamp(),
        isRead: false
      };

      await addDoc(collection(db, 'chats', chatId, 'messages'), messageData);
      
      // Update last message in conversation
      await updateDoc(doc(db, 'chats', chatId), {
        lastMessage: newMessage.trim(),
        lastTime: serverTimestamp(),
        userName: user.role === 'admin' ? undefined : user.displayName
      });

      setNewMessage('');
    } catch (error) {
      console.error('Send message error:', error);
    }
  }, [user, newMessage, adminChatUserId]);

  const markAsRead = useCallback(async (messageIds: string[], targetUserId?: string) => {
    if (!user) return;
    const chatId = user.role === 'admin' ? (targetUserId || adminChatUserId) : user.uid;
    if (!chatId) return;

    try {
      const batch = writeBatch(db);
      messageIds.forEach(id => {
        batch.update(doc(db, 'chats', chatId, 'messages', id), { isRead: true });
      });
      await batch.commit();
    } catch (error) {
      console.error('Mark as read error:', error);
    }
  }, [user, adminChatUserId]);

  return {
    newMessage,
    setNewMessage,
    isChatOpen,
    setIsChatOpen,
    adminChatUserId,
    setAdminChatUserId,
    sendMessage,
    markAsRead
  };
}
