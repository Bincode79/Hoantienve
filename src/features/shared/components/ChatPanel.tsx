import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  MessageCircle, 
  Minus, 
  X, 
  ChevronLeft, 
  User as UserIcon, 
  Send 
} from 'lucide-react';
import { format } from 'date-fns';
import ChatBubble from '../../../components/ChatBubble';
import { ChatMessage, UserProfile } from '../../../types';
import { cn } from '../../../utils';

interface ChatPanelProps {
  messages: ChatMessage[];
  currentUser: UserProfile;
  onSendMessage: () => void;
  newMessage: string;
  onNewMessageChange: (value: string) => void;
  onClose: () => void;
  onMarkAsRead?: (messageIds: string[]) => void;
  adminChatUserId?: string | null;
  onSelectConversation?: (userId: string) => void;
  conversations?: { userId: string; userName: string; lastMessage: string; lastTime: any; unread: number }[];
  isAdminView?: boolean;
  onBack?: () => void;
}

export function ChatPanel({
  messages,
  currentUser,
  onSendMessage,
  newMessage,
  onNewMessageChange,
  onClose,
  onMarkAsRead,
  adminChatUserId,
  onSelectConversation,
  conversations,
  isAdminView,
  onBack
}: ChatPanelProps) {
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [isMinimized, setIsMinimized] = useState(false);
  const [showConversations, setShowConversations] = useState(!adminChatUserId && currentUser.role === 'admin');

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Đánh dấu tin nhắn đã đọc khi mở chat
  useEffect(() => {
    if (onMarkAsRead && messages.length > 0) {
      const unreadIds = messages
        .filter(m => !m.isRead && m.senderId !== currentUser.uid)
        .map(m => m.id);
      if (unreadIds.length > 0) {
        onMarkAsRead(unreadIds);
      }
    }
  }, [messages, onMarkAsRead, currentUser.uid]);

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      onSendMessage();
    }
  };

  const handleSelectConversation = (userId: string) => {
    setShowConversations(false);
    onSelectConversation?.(userId);
  };

  const handleBack = () => {
    setShowConversations(true);
    onBack?.();
  };

  // Floating chat bubble button (when minimized)
  if (isMinimized) {
    return (
      <motion.button
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0, opacity: 0 }}
        transition={{ type: 'spring', damping: 15, stiffness: 300 }}
        onClick={() => setIsMinimized(false)}
        className="fixed bottom-6 right-6 w-16 h-16 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full shadow-2xl shadow-blue-500/40 flex items-center justify-center hover:scale-105 active:scale-95 transition-transform z-[80]"
      >
        <MessageCircle size={28} className="text-white" />
        {messages.filter(m => !m.isRead && m.senderId !== currentUser.uid).length > 0 && (
          <span className="absolute -top-1 -right-1 min-w-[24px] h-6 px-1.5 bg-rose-500 text-white text-xs font-bold rounded-full flex items-center justify-center shadow-lg">
            {messages.filter(m => !m.isRead && m.senderId !== currentUser.uid).length}
          </span>
        )}
      </motion.button>
    );
  }

  // Header text dựa trên role và trạng thái
  const getHeaderSubtitle = () => {
    if (currentUser.role === 'admin') {
      if (showConversations) return 'Danh sách cuộc trò chuyện';
      if (adminChatUserId) {
        const conv = conversations?.find(c => c.userId === adminChatUserId);
        return conv ? `Trò chuyện với ${conv.userName}` : 'Hỗ trợ khách hàng';
      }
      return 'Hỗ trợ khách hàng';
    }
    return 'Liên hệ CSKH 24/7';
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 20, scale: 0.95 }}
      transition={{ type: 'spring', damping: 25, stiffness: 300 }}
      className="fixed bottom-6 right-6 w-[380px] h-[560px] bg-white rounded-3xl shadow-2xl shadow-gray-400/30 overflow-hidden z-[80] flex flex-col"
    >
      {/* Thanh tiêu đề (Header) */}
      <div className="p-4 flex items-center justify-between bg-gradient-to-r from-blue-500 to-blue-600 text-white shrink-0">
        <div className="flex items-center gap-3">
          {isAdminView && (adminChatUserId || !showConversations) && (
            <button
              onClick={handleBack}
              className="p-1.5 hover:bg-white/20 rounded-lg transition-colors -ml-1"
            >
              <ChevronLeft size={20} />
            </button>
          )}
          <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
            <MessageCircle size={20} />
          </div>
          <div>
            <h3 className="font-bold">Chat hỗ trợ</h3>
            <p className="text-xs text-blue-100">{getHeaderSubtitle()}</p>
          </div>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={() => setIsMinimized(true)}
            className="p-2 hover:bg-white/20 rounded-xl transition-colors"
            title="Thu nhỏ"
          >
            <Minus size={18} />
          </button>
          <button
            onClick={onClose}
            className="p-2 hover:bg-white/20 rounded-xl transition-colors"
          >
            <X size={20} />
          </button>
        </div>
      </div>

      {/* Danh sách cuộc trò chuyện (Admin only) */}
      {isAdminView && showConversations && (
        <div className="flex-1 overflow-y-auto bg-gray-50">
          {conversations && conversations.length > 0 ? (
            <div className="divide-y divide-gray-100">
              {conversations.map((conv) => (
                <button
                  key={conv.userId}
                  onClick={() => handleSelectConversation(conv.userId)}
                  className="w-full p-4 flex items-start gap-3 hover:bg-blue-50 transition-colors text-left"
                >
                  <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center shrink-0">
                    <UserIcon size={18} className="text-blue-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <p className="font-medium text-sm text-black truncate">{conv.userName}</p>
                      {conv.lastTime && (
                        <span className="text-[10px] text-gray-500 shrink-0 ml-2">
                          {conv.lastTime.toDate ? format(conv.lastTime.toDate(), 'HH:mm') : ''}
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-gray-500 truncate mt-0.5">{conv.lastMessage}</p>
                  </div>
                  {conv.unread > 0 && (
                    <span className="min-w-[20px] h-5 px-1.5 bg-rose-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center shrink-0">
                      {conv.unread}
                    </span>
                  )}
                </button>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-full text-center p-4">
              <div className="w-16 h-16 bg-blue-100 rounded-2xl flex items-center justify-center mb-4">
                <MessageCircle size={32} className="text-blue-500" />
              </div>
              <p className="text-sm font-medium text-black">Chưa có cuộc trò chuyện nào</p>
              <p className="text-xs text-gray-600 mt-1">Khách hàng sẽ xuất hiện khi gửi tin nhắn</p>
            </div>
          )}
        </div>
      )}

      {/* Tin nhắn (Messages) */}
      {(!isAdminView || !showConversations) && (
        <div className="flex-1 overflow-y-auto p-4 space-y-1 bg-gray-50">
          {messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center p-4">
              <div className="w-16 h-16 bg-blue-100 rounded-2xl flex items-center justify-center mb-4">
                <MessageCircle size={32} className="text-blue-500" />
              </div>
              <p className="text-sm font-medium text-black">Chưa có tin nhắn nào</p>
              <p className="text-xs text-gray-600 mt-1">
                {currentUser.role === 'admin' && adminChatUserId
                  ? 'Bắt đầu cuộc trò chuyện với khách hàng'
                  : 'Gửi tin nhắn để bắt đầu cuộc trò chuyện'}
              </p>
            </div>
          ) : (
            <>
              {messages.map((msg) => (
                <ChatBubble
                  key={msg.id}
                  message={msg}
                  isOwn={msg.senderId === currentUser.uid}
                />
              ))}
              <div ref={messagesEndRef} />
            </>
          )}
        </div>
      )}

      {/* Ô nhập liệu (Input) */}
      {(!isAdminView || !showConversations) && (
        <div className="p-4 border-t border-gray-100 bg-white shrink-0">
          <div className="flex items-end gap-2">
            <textarea
              value={newMessage}
              onChange={(e) => onNewMessageChange(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Nhập tin nhắn..."
              rows={1}
              className="flex-1 px-4 py-3 border border-gray-200 rounded-2xl text-sm bg-gray-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 transition-all resize-none placeholder:text-gray-600"
              style={{ maxHeight: '100px' }}
            />
            <button
              onClick={onSendMessage}
              disabled={!newMessage.trim()}
              className={cn(
                "p-3 rounded-2xl transition-all duration-200",
                newMessage.trim()
                  ? "bg-blue-500 text-white hover:bg-blue-600 shadow-md shadow-blue-200 active:scale-95"
                  : "bg-gray-100 text-gray-400 cursor-not-allowed"
              )}
            >
              <Send size={18} />
            </button>
          </div>
        </div>
      )}
    </motion.div>
  );
}
