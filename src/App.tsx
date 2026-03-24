import { useState, useRef, useEffect } from 'react';
import { Sidebar } from './components/Sidebar';
import { Header } from './components/Header';
import { MessageBubble } from './components/MessageBubble';
import { InputArea } from './components/InputArea';
import { WelcomeScreen } from './components/WelcomeScreen';
import { Message, ResponseStyle, Chat } from './types';
import { generateChatResponse } from './services/ai';
import { Loader2 } from 'lucide-react';

const LOCAL_CHATS_KEY = 'dang_cong_san_ai_local_chats';

const loadLocalChats = (): Chat[] => {
  try {
    const stored = localStorage.getItem(LOCAL_CHATS_KEY);
    if (stored) {
      const parsed = JSON.parse(stored);
      return parsed.map((c: any) => ({
        ...c,
        createdAt: new Date(c.createdAt),
        updatedAt: new Date(c.updatedAt),
        messages: c.messages.map((m: any) => ({
          ...m,
          timestamp: new Date(m.timestamp)
        }))
      }));
    }
  } catch (e) {
    console.error("Failed to load local chats", e);
  }
  return [];
};

const saveLocalChats = (newChats: Chat[]) => {
  try {
    localStorage.setItem(LOCAL_CHATS_KEY, JSON.stringify(newChats));
  } catch (e) {
    console.error("Failed to save local chats", e);
  }
};

export default function App() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [chats, setChats] = useState<Chat[]>([]);
  const [currentChatId, setCurrentChatId] = useState<string | null>(() => {
    return sessionStorage.getItem('dang_cong_san_ai_current_chat_id') || null;
  });
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const pendingChatId = useRef<string | null>(null);
  const [isChatsLoaded, setIsChatsLoaded] = useState(false);

  useEffect(() => {
    if (currentChatId) {
      sessionStorage.setItem('dang_cong_san_ai_current_chat_id', currentChatId);
    } else {
      sessionStorage.removeItem('dang_cong_san_ai_current_chat_id');
    }
  }, [currentChatId]);

  useEffect(() => {
    const loadedChats = loadLocalChats();
    setChats(loadedChats);
    setIsChatsLoaded(true);
  }, []);

  useEffect(() => {
    if (currentChatId && isChatsLoaded) {
      const chat = chats.find(c => c.id === currentChatId);
      if (chat) {
        setMessages(chat.messages);
        if (pendingChatId.current === currentChatId) {
          pendingChatId.current = null;
        }
      } else if (currentChatId !== pendingChatId.current) {
        setCurrentChatId(null);
        setMessages([]);
      }
    }
  }, [currentChatId, chats, isChatsLoaded]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading]);

  const saveChat = async (chatId: string, newMessages: Message[], title: string, isNewChat: boolean) => {
    setChats(prev => {
      let updated;
      if (isNewChat) {
        updated = [{
          id: chatId,
          userId: 'local',
          title,
          messages: newMessages,
          createdAt: new Date(),
          updatedAt: new Date()
        }, ...prev];
      } else {
        updated = prev.map(c => c.id === chatId ? {
          ...c,
          messages: newMessages,
          updatedAt: new Date()
        } : c);
      }
      saveLocalChats(updated);
      return updated;
    });
  };

  const handleDeleteChat = async (chatId: string) => {
    setChats(prev => {
      const updated = prev.filter(c => c.id !== chatId);
      saveLocalChats(updated);
      return updated;
    });
    if (currentChatId === chatId) {
      setCurrentChatId(null);
      setMessages([]);
    }
  };

  const handleDeleteAllChats = async () => {
    setChats([]);
    saveLocalChats([]);
    setCurrentChatId(null);
    setMessages([]);
  };

  const handleDeleteMultipleChats = async (chatIds: string[]) => {
    setChats(prev => {
      const updated = prev.filter(c => !chatIds.includes(c.id));
      saveLocalChats(updated);
      return updated;
    });
    if (currentChatId && chatIds.includes(currentChatId)) {
      setCurrentChatId(null);
      setMessages([]);
    }
  };

  const handleSendMessage = async (content: string, style: ResponseStyle, attachments?: { name: string; mimeType: string; data?: string }[]) => {
    const newUserMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content,
      timestamp: new Date(),
      style,
      attachments,
    };

    const updatedMessages = [...messages, newUserMessage];
    setMessages(updatedMessages);
    setIsLoading(true);

    let isNewChat = !currentChatId;
    let chatId = currentChatId;
    let title = content.trim() ? content.slice(0, 40) + (content.length > 40 ? '...' : '') : (attachments?.[0]?.name || 'Cuộc trò chuyện mới');

    if (!chatId) {
      chatId = Date.now().toString();
      pendingChatId.current = chatId;
      setCurrentChatId(chatId);
    }

    await saveChat(chatId, updatedMessages, title, isNewChat);

    try {
      const history = updatedMessages.map(m => ({ role: m.role, content: m.content, attachments: m.attachments }));
      const response = await generateChatResponse(history, style);
      
      const newAiMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'ai',
        content: response,
        timestamp: new Date(),
      };
      
      const finalMessages = [...updatedMessages, newAiMessage];
      setMessages(finalMessages);
      
      await saveChat(chatId, finalMessages, title, false);
    } catch (error: any) {
      let errorText = 'Xin lỗi, tôi đang gặp sự cố kết nối. Đồng chí vui lòng thử lại sau nhé.';
      if (error?.message === 'API_KEY_MISSING') {
        errorText = 'Vui lòng cài đặt Gemini API Key trong phần Cài đặt (biểu tượng bánh răng ở thanh bên trái) để bắt đầu trò chuyện.';
      }

      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'ai',
        content: errorText,
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRetry = async (messageIndex: number) => {
    let lastUserMessageIndex = messageIndex - 1;
    while (lastUserMessageIndex >= 0 && messages[lastUserMessageIndex].role !== 'user') {
      lastUserMessageIndex--;
    }

    if (lastUserMessageIndex >= 0) {
      const userMessage = messages[lastUserMessageIndex];
      const newMessages = messages.slice(0, lastUserMessageIndex + 1);
      setMessages(newMessages);
      
      setIsLoading(true);
      try {
        const history = newMessages.map(m => ({ role: m.role, content: m.content, attachments: m.attachments }));
        const response = await generateChatResponse(history, 'detailed');
        
        const newAiMessage: Message = {
          id: Date.now().toString(),
          role: 'ai',
          content: response,
          timestamp: new Date(),
        };
        
        const finalMessages = [...newMessages, newAiMessage];
        setMessages(finalMessages);
        
        if (currentChatId) {
          const chat = chats.find(c => c.id === currentChatId);
          await saveChat(currentChatId, finalMessages, chat?.title || 'Chat', false);
        }
      } catch (error: any) {
        let errorText = 'Xin lỗi, tôi đang gặp sự cố kết nối. Đồng chí vui lòng thử lại sau nhé.';
        if (error?.message === 'API_KEY_MISSING') {
          errorText = 'Vui lòng cài đặt Gemini API Key trong phần Cài đặt (biểu tượng bánh răng ở thanh bên trái) để bắt đầu trò chuyện.';
        }

        const errorMessage: Message = {
          id: Date.now().toString(),
          role: 'ai',
          content: errorText,
          timestamp: new Date(),
        };
        setMessages((prev) => [...prev, errorMessage]);
      } finally {
        setIsLoading(false);
      }
    }
  };

  const handleNewChat = () => {
    setMessages([]);
    setCurrentChatId(null);
    if (window.innerWidth < 768) {
      setIsSidebarOpen(false);
    }
  };

  const handleSelectChat = (chatId: string) => {
    setCurrentChatId(chatId);
    const chat = chats.find(c => c.id === chatId);
    if (chat) {
      setMessages(chat.messages);
    }
  };

  return (
    <div className="flex h-screen overflow-hidden bg-white">
      <Sidebar 
        isOpen={isSidebarOpen} 
        onClose={() => setIsSidebarOpen(false)} 
        onToggle={() => setIsSidebarOpen(prev => !prev)}
        onNewChat={handleNewChat}
        onTopicSelect={(topic) => handleSendMessage(topic, 'detailed')}
        chats={chats}
        currentChatId={currentChatId}
        onSelectChat={handleSelectChat}
        onDeleteChat={handleDeleteChat}
        onDeleteAllChats={handleDeleteAllChats}
        onDeleteMultipleChats={handleDeleteMultipleChats}
      />
      
      <main className="flex-1 flex flex-col h-full relative min-w-0">
        <Header 
          onMenuClick={() => setIsSidebarOpen(prev => !prev)} 
          currentChatTitle={chats.find(c => c.id === currentChatId)?.title}
          isSidebarOpen={isSidebarOpen}
        />
        
        <div className="flex-1 overflow-y-auto scroll-smooth">
          {messages.length === 0 ? (
            <WelcomeScreen onTopicSelect={(topic) => handleSendMessage(topic, 'detailed')} />
          ) : (
            <div className="pb-4">
              {messages.map((msg, index) => (
                <MessageBubble 
                  key={msg.id} 
                  message={msg} 
                  onRetry={msg.role === 'ai' ? () => handleRetry(index) : undefined}
                />
              ))}
              {isLoading && (
                <div className="flex w-full gap-4 px-4 py-6 md:px-6 lg:px-8">
                  <div className="flex-shrink-0 mt-1">
                    <div className="w-8 h-8 rounded-full bg-red-600 flex items-center justify-center shadow-sm">
                      <Loader2 className="w-4 h-4 text-white animate-spin" />
                    </div>
                  </div>
                  <div className="flex-1 flex items-center">
                    <div className="flex gap-1">
                      <div className="w-2 h-2 rounded-full bg-slate-300 animate-bounce" style={{ animationDelay: '0ms' }} />
                      <div className="w-2 h-2 rounded-full bg-slate-300 animate-bounce" style={{ animationDelay: '150ms' }} />
                      <div className="w-2 h-2 rounded-full bg-slate-300 animate-bounce" style={{ animationDelay: '300ms' }} />
                    </div>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} className="h-4" />
            </div>
          )}
        </div>

        <div className="bg-gradient-to-t from-white via-white to-transparent pt-6">
          <InputArea onSendMessage={handleSendMessage} isLoading={isLoading} />
        </div>
      </main>
    </div>
  );
}
