import { MessageSquarePlus, History, BookOpen, Users, Flag, GraduationCap, Trash2, PanelLeftClose, PanelLeftOpen, X, Search, CheckSquare, Square } from 'lucide-react';
import { clsx } from 'clsx';
import { Chat } from '../types';
import { useState } from 'react';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
  onNewChat: () => void;
  onTopicSelect: (topic: string) => void;
  chats: Chat[];
  currentChatId: string | null;
  onSelectChat: (chatId: string) => void;
  onDeleteChat: (chatId: string) => void;
  onDeleteAllChats: () => void;
  onDeleteMultipleChats: (chatIds: string[]) => void;
  onToggle: () => void;
}

const TOPICS = [
  { id: 'history', label: 'Lịch sử Đoàn', icon: History, prompt: 'Hãy kể tóm tắt về lịch sử hình thành và phát triển của Trung ương Đoàn TNCS Hồ Chí Minh.' },
  { id: 'charter', label: 'Điều lệ Đoàn', icon: BookOpen, prompt: 'Điều kiện để được kết nạp vào Trung ương Đoàn TNCS Hồ Chí Minh là gì?' },
  { id: 'rights', label: 'Quyền & Nhiệm vụ', icon: Users, prompt: 'Đoàn viên có những quyền và nhiệm vụ gì?' },
  { id: 'activities', label: 'Phong trào', icon: Flag, prompt: 'Kể tên các phong trào hành động cách mạng lớn của Đoàn hiện nay.' },
  { id: 'school', label: 'Công tác phát triển', icon: GraduationCap, prompt: 'Quy trình kết nạp một thanh niên ưu tú vào Trung ương Đoàn TNCS Hồ Chí Minh gồm những bước nào?' },
];

export function Sidebar({ isOpen, onClose, onNewChat, onTopicSelect, chats, currentChatId, onSelectChat, onDeleteChat, onDeleteAllChats, onDeleteMultipleChats, onToggle }: SidebarProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showDeleteSelectedConfirm, setShowDeleteSelectedConfirm] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [selectedChats, setSelectedChats] = useState<string[]>([]);
  const filteredChats = chats.filter(chat => chat.title.toLowerCase().includes(searchQuery.toLowerCase()));

  const toggleChatSelection = (chatId: string) => {
    setSelectedChats(prev => 
      prev.includes(chatId) ? prev.filter(id => id !== chatId) : [...prev, chatId]
    );
  };

  return (
    <>
      {/* Mobile overlay */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/20 backdrop-blur-sm z-40 md:hidden"
          onClick={onClose}
        />
      )}
      
      {/* Desktop spacer */}
      <div className={clsx(
        "hidden md:block flex-shrink-0 h-screen transition-all duration-300",
        isOpen ? "w-[260px]" : "w-0"
      )} />

      <aside className={clsx(
        "fixed top-0 left-0 h-screen w-[260px] bg-[#f9f9f9] flex flex-col transition-transform duration-300 z-50",
        isOpen ? "translate-x-0" : "-translate-x-full"
      )}>
        <div className="p-3 flex items-center justify-between">
          <button
            onClick={onToggle}
            className="hidden md:flex p-2 rounded-lg hover:bg-black/5 text-slate-600 transition-colors"
            title="Đóng sidebar"
          >
            <PanelLeftClose className="w-5 h-5" />
          </button>
          <button
            onClick={onClose}
            className="md:hidden p-2 rounded-lg hover:bg-black/5 text-slate-600 transition-colors"
            title="Đóng sidebar"
          >
            <X className="w-5 h-5" />
          </button>
          <button
            onClick={onNewChat}
            className="flex-1 flex items-center gap-3 hover:bg-black/5 text-slate-700 py-2 px-3 rounded-lg font-medium transition-colors text-sm ml-1"
          >
            <div className="w-7 h-7 rounded-full bg-black/5 flex items-center justify-center">
              <MessageSquarePlus className="w-4 h-4" />
            </div>
            <span>Cuộc trò chuyện mới</span>
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-3 flex flex-col gap-6 pb-4">
          <div>
            <h3 className="text-xs font-semibold text-slate-500 px-2 mb-2">
              Chủ đề gợi ý
            </h3>
            <div className="space-y-0.5">
              {TOPICS.map((topic) => (
                <button
                  key={topic.id}
                  onClick={() => {
                    onTopicSelect(topic.prompt);
                    onClose();
                  }}
                  className="w-full flex items-center gap-3 px-2 py-2 rounded-lg text-left text-sm text-slate-700 hover:bg-black/5 transition-colors group"
                >
                  <topic.icon className="w-4 h-4 text-slate-500" />
                  <span className="truncate">{topic.label}</span>
                </button>
              ))}
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between px-2 mb-2">
              <h3 className="text-xs font-semibold text-slate-500">
                Lịch sử trò chuyện
              </h3>
              {chats.length > 0 && (
                <button
                  onClick={() => {
                    if (isEditMode) {
                      setIsEditMode(false);
                      setSelectedChats([]);
                    } else {
                      setIsEditMode(true);
                    }
                  }}
                  className="text-xs text-slate-500 hover:text-slate-700 font-medium transition-colors"
                >
                  {isEditMode ? 'Xong' : 'Chọn'}
                </button>
              )}
            </div>
            
            {isEditMode && (
              <div className="flex items-center justify-between px-2 mb-3">
                <button
                  onClick={() => {
                    if (selectedChats.length === filteredChats.length) {
                      setSelectedChats([]);
                    } else {
                      setSelectedChats(filteredChats.map(c => c.id));
                    }
                  }}
                  className="text-xs text-slate-600 hover:text-slate-800 font-medium"
                >
                  {selectedChats.length === filteredChats.length ? 'Bỏ chọn tất cả' : 'Chọn tất cả'}
                </button>
                <div className="flex gap-2">
                  <button
                    onClick={() => setShowDeleteConfirm(true)}
                    className="text-xs text-red-500 hover:text-red-600 font-medium"
                  >
                    Xóa tất cả
                  </button>
                  {selectedChats.length > 0 && (
                    <button
                      onClick={() => setShowDeleteSelectedConfirm(true)}
                      className="text-xs text-red-500 hover:text-red-600 font-medium"
                    >
                      Xóa ({selectedChats.length})
                    </button>
                  )}
                </div>
              </div>
            )}

            {!isEditMode && (
              <div className="px-2 mb-3">
                <div className="relative">
                  <Search className="w-4 h-4 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Tìm kiếm đoạn chat..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full bg-black/5 border-none rounded-lg pl-9 pr-3 py-1.5 text-sm text-slate-700 placeholder-slate-500 focus:ring-1 focus:ring-slate-300 outline-none"
                  />
                </div>
              </div>
            )}
            {filteredChats.length === 0 ? (
              <div className="text-sm text-slate-500 px-2">
                {searchQuery ? 'Không tìm thấy kết quả.' : 'Chưa có lịch sử.'}
              </div>
            ) : (
              <div className="space-y-0.5">
                {filteredChats.map((chat) => (
                  <div
                    key={chat.id}
                    className={clsx(
                      "w-full flex items-center justify-between px-2 py-2 rounded-lg transition-colors group text-sm",
                      currentChatId === chat.id
                        ? "bg-black/5 text-slate-900"
                        : "text-slate-700 hover:bg-black/5"
                    )}
                  >
                    <button
                      onClick={() => {
                        if (isEditMode) {
                          toggleChatSelection(chat.id);
                        } else {
                          onSelectChat(chat.id);
                          onClose();
                        }
                      }}
                      className="flex items-center gap-3 text-left flex-1 min-w-0"
                    >
                      {isEditMode && (
                        <div className="flex-shrink-0 text-slate-400">
                          {selectedChats.includes(chat.id) ? (
                            <CheckSquare className="w-4 h-4 text-red-500" />
                          ) : (
                            <Square className="w-4 h-4" />
                          )}
                        </div>
                      )}
                      <span className="truncate flex-1">{chat.title}</span>
                    </button>
                    {!isEditMode && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onDeleteChat(chat.id);
                        }}
                        className="p-1 rounded-md text-slate-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
                        title="Xoá"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </aside>

      {/* Desktop expand button when sidebar is closed */}
      {!isOpen && (
        <button
          onClick={onToggle}
          className="hidden md:flex fixed top-3 left-3 z-40 p-2 rounded-lg hover:bg-slate-100 text-slate-600 transition-colors"
          title="Mở sidebar"
        >
          <PanelLeftOpen className="w-5 h-5" />
        </button>
      )}

      {/* Delete All Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[60] flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 max-w-sm w-full shadow-xl">
            <h3 className="text-lg font-semibold text-slate-900 mb-2">Xóa tất cả lịch sử?</h3>
            <p className="text-sm text-slate-600 mb-6">
              Bạn có chắc chắn muốn xóa toàn bộ lịch sử trò chuyện không? Hành động này không thể hoàn tác.
            </p>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
              >
                Hủy
              </button>
              <button
                onClick={() => {
                  onDeleteAllChats();
                  setShowDeleteConfirm(false);
                  setIsEditMode(false);
                  setSelectedChats([]);
                }}
                className="px-4 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-lg transition-colors"
              >
                Xóa tất cả
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Selected Confirmation Modal */}
      {showDeleteSelectedConfirm && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[60] flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 max-w-sm w-full shadow-xl">
            <h3 className="text-lg font-semibold text-slate-900 mb-2">Xóa {selectedChats.length} mục đã chọn?</h3>
            <p className="text-sm text-slate-600 mb-6">
              Bạn có chắc chắn muốn xóa {selectedChats.length} cuộc trò chuyện đã chọn không? Hành động này không thể hoàn tác.
            </p>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setShowDeleteSelectedConfirm(false)}
                className="px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
              >
                Hủy
              </button>
              <button
                onClick={() => {
                  onDeleteMultipleChats(selectedChats);
                  setShowDeleteSelectedConfirm(false);
                  setIsEditMode(false);
                  setSelectedChats([]);
                }}
                className="px-4 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-lg transition-colors"
              >
                Xóa
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
