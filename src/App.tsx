import { useState, useRef, useEffect } from 'react';
import { Sidebar } from './components/Sidebar';
import { Header } from './components/Header';
import { MessageBubble } from './components/MessageBubble';
import { InputArea } from './components/InputArea';
import { WelcomeScreen } from './components/WelcomeScreen';
import { Message, ResponseStyle, Chat } from './types';
import { generateChatResponse } from './services/ai';
import { Loader2 } from 'lucide-react';
import { auth, db } from './firebase';
import { onAuthStateChanged, User } from 'firebase/auth';
import { collection, query, where, orderBy, onSnapshot, doc, setDoc, updateDoc, deleteDoc, serverTimestamp, Timestamp } from 'firebase/firestore';
import { handleFirestoreError, OperationType } from './utils/errorHandling';

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
  const [user, setUser] = useState<User | null>(null);
  const [chats, setChats] = useState<Chat[]>([]);
  const [localChats, setLocalChats] = useState<Chat[]>([]);
  const [currentChatId, setCurrentChatId] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setLocalChats(loadLocalChats());
  }, []);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      if (!currentUser) {
        setChats(loadLocalChats());
        setCurrentChatId(null);
        setMessages([]);
      }
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (!user) {
      setChats(localChats);
    }
  }, [localChats, user]);

  useEffect(() => {
    if (!user) return;

    const q = query(
      collection(db, 'chats'),
      where('userId', '==', user.uid),
      orderBy('updatedAt', 'desc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const fetchedChats: Chat[] = snapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          userId: data.userId,
          title: data.title,
          messages: data.messages.map((m: any) => ({
            ...m,
            timestamp: m.timestamp instanceof Timestamp ? m.timestamp.toDate() : new Date(m.timestamp),
            style: m.style || undefined,
            attachments: m.attachments || undefined
          })),
          createdAt: data.createdAt instanceof Timestamp ? data.createdAt.toDate() : new Date(data.createdAt),
          updatedAt: data.updatedAt instanceof Timestamp ? data.updatedAt.toDate() : new Date(data.updatedAt),
        };
      });
      setChats(fetchedChats);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'chats');
    });

    return () => unsubscribe();
  }, [user]);

  useEffect(() => {
    if (currentChatId) {
      const chat = chats.find(c => c.id === currentChatId);
      if (chat) {
        setMessages(chat.messages);
      }
    }
  }, [currentChatId, chats]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading]);

  const saveChat = async (chatId: string, newMessages: Message[], title: string, isNewChat: boolean) => {
    if (user) {
      const chatRef = doc(db, 'chats', chatId);
      const messagesToSave = newMessages.map(m => ({
        id: m.id,
        role: m.role,
        content: m.content,
        timestamp: m.timestamp,
        style: m.style || null,
        attachments: m.attachments?.map(a => ({ name: a.name, mimeType: a.mimeType })) || null
      }));

      try {
        if (!isNewChat) {
          await updateDoc(chatRef, {
            messages: messagesToSave,
            updatedAt: serverTimestamp()
          });
        } else {
          await setDoc(chatRef, {
            userId: user.uid,
            title,
            messages: messagesToSave,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp()
          });
        }
      } catch (error) {
        handleFirestoreError(error, isNewChat ? OperationType.CREATE : OperationType.UPDATE, `chats/${chatId}`);
      }
    } else {
      setLocalChats(prev => {
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
    }
  };

  const handleDeleteChat = async (chatId: string) => {
    if (user) {
      try {
        await deleteDoc(doc(db, 'chats', chatId));
        if (currentChatId === chatId) {
          setCurrentChatId(null);
          setMessages([]);
        }
      } catch (error) {
        handleFirestoreError(error, OperationType.DELETE, `chats/${chatId}`);
      }
    } else {
      setLocalChats(prev => {
        const updated = prev.filter(c => c.id !== chatId);
        saveLocalChats(updated);
        return updated;
      });
      if (currentChatId === chatId) {
        setCurrentChatId(null);
        setMessages([]);
      }
    }
  };

  const handleDeleteAllChats = async () => {
    if (user) {
      try {
        const deletePromises = chats.map(chat => deleteDoc(doc(db, 'chats', chat.id)));
        await Promise.all(deletePromises);
        setCurrentChatId(null);
        setMessages([]);
      } catch (error) {
        handleFirestoreError(error, OperationType.DELETE, `chats`);
      }
    } else {
      setLocalChats([]);
      saveLocalChats([]);
      setCurrentChatId(null);
      setMessages([]);
    }
  };

  const handleDeleteMultipleChats = async (chatIds: string[]) => {
    if (user) {
      try {
        const deletePromises = chatIds.map(id => deleteDoc(doc(db, 'chats', id)));
        await Promise.all(deletePromises);
        if (currentChatId && chatIds.includes(currentChatId)) {
          setCurrentChatId(null);
          setMessages([]);
        }
      } catch (error) {
        handleFirestoreError(error, OperationType.DELETE, `chats`);
      }
    } else {
      setLocalChats(prev => {
        const updated = prev.filter(c => !chatIds.includes(c.id));
        saveLocalChats(updated);
        return updated;
      });
      if (currentChatId && chatIds.includes(currentChatId)) {
        setCurrentChatId(null);
        setMessages([]);
      }
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
    } catch (error) {
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'ai',
        content: 'Xin lỗi, tôi đang gặp sự cố kết nối. Đồng chí vui lòng thử lại sau nhé.',
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
      } catch (error) {
        const errorMessage: Message = {
          id: Date.now().toString(),
          role: 'ai',
          content: 'Xin lỗi, tôi đang gặp sự cố kết nối. Đồng chí vui lòng thử lại sau nhé.',
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
          user={user} 
          currentChatTitle={chats.find(c => c.id === currentChatId)?.title}
        />
        
        <div className="flex-1 overflow-y-auto scroll-smooth">
          {messages.length === 0 ? (
            <WelcomeScreen onTopicSelect={(topic) => handleSendMessage(topic, 'detailed')} user={user} />
          ) : (
            <div className="pb-4">
              {messages.map((msg, index) => (
                <MessageBubble 
                  key={msg.id} 
                  message={msg} 
                  onRetry={msg.role === 'ai' ? () => handleRetry(index) : undefined}
                  user={user}
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
          <InputArea onSendMessage={handleSendMessage} isLoading={isLoading} user={user} />
        </div>
      </main>
    </div>
  );
}
