import { Message, Attachment } from '../types';
import { clsx } from 'clsx';
import { Copy, Check, User as UserIcon, ShieldCheck, RefreshCw, X, Download } from 'lucide-react';
import React, { useState } from 'react';
import Markdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { User } from 'firebase/auth';

interface MessageBubbleProps {
  message: Message;
  onRetry?: () => void;
  user?: User | null;
}

export function MessageBubble({ message, onRetry, user }: MessageBubbleProps) {
  const isUser = message.role === 'user';
  const [isCopied, setIsCopied] = useState(false);
  const [fullscreenImage, setFullscreenImage] = useState<string | null>(null);

  const handleCopy = () => {
    navigator.clipboard.writeText(message.content);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  const handleDownloadImage = (e: React.MouseEvent, att: Attachment) => {
    e.stopPropagation();
    const link = document.createElement('a');
    link.href = `data:${att.mimeType || 'image/png'};base64,${att.data}`;
    link.download = att.name || 'generated-image.png';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (isUser) {
    return (
      <>
        <div className="flex w-full px-4 py-4 md:px-6 lg:px-8 justify-end">
          <div className="max-w-[85%] md:max-w-[70%] bg-slate-100 rounded-3xl px-5 py-3 text-slate-900">
            {message.attachments && message.attachments.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-3">
                {message.attachments.map((att, i) => (
                  <div key={i} className="relative group rounded-xl overflow-hidden border border-slate-200 bg-white">
                    {att.mimeType.startsWith('image/') && att.data ? (
                      <img 
                        src={`data:${att.mimeType};base64,${att.data}`} 
                        alt={att.name} 
                        className="h-32 w-auto object-cover cursor-pointer hover:opacity-90 transition-opacity" 
                        onClick={() => setFullscreenImage(`data:${att.mimeType};base64,${att.data}`)}
                      />
                    ) : (
                      <div className="flex items-center gap-2 px-3 py-2 h-12">
                        <div className="w-4 h-4 text-blue-500 flex-shrink-0">
                          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><line x1="10" y1="9" x2="8" y2="9"/></svg>
                        </div>
                        <span className="text-xs font-medium text-slate-700 max-w-[200px] truncate">{att.name}</span>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
            <div className="whitespace-pre-wrap text-[15px] leading-relaxed break-words">
              {message.content}
            </div>
          </div>
        </div>

        {/* Fullscreen Image Modal */}
        {fullscreenImage && (
          <div 
            className="fixed inset-0 z-[100] bg-black/90 flex items-center justify-center p-4 backdrop-blur-sm"
            onClick={() => setFullscreenImage(null)}
          >
            <button 
              className="absolute top-4 right-16 p-2 text-white/70 hover:text-white bg-black/50 hover:bg-black/80 rounded-full transition-all"
              onClick={(e) => {
                e.stopPropagation();
                const link = document.createElement('a');
                link.href = fullscreenImage;
                link.download = 'generated-image.png';
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
              }}
              title="Tải ảnh xuống"
            >
              <Download className="w-6 h-6" />
            </button>
            <button 
              className="absolute top-4 right-4 p-2 text-white/70 hover:text-white bg-black/50 hover:bg-black/80 rounded-full transition-all"
              onClick={(e) => {
                e.stopPropagation();
                setFullscreenImage(null);
              }}
            >
              <X className="w-6 h-6" />
            </button>
            <img 
              src={fullscreenImage} 
              alt="Fullscreen view" 
              className="max-w-full max-h-full object-contain rounded-lg shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            />
          </div>
        )}
      </>
    );
  }

  return (
    <div className="flex w-full gap-4 px-4 py-6 md:px-6 lg:px-8 hover:bg-slate-50 transition-colors">
      <div className="flex-shrink-0 mt-1">
        <div className="w-8 h-8 rounded-full bg-red-600 flex items-center justify-center shadow-sm">
          <ShieldCheck className="w-5 h-5 text-white" />
        </div>
      </div>

      <div className="flex-1 max-w-3xl min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <span className="text-[15px] font-semibold text-slate-900">
            Trung ương Đoàn TNCS Hồ Chí Minh AI
          </span>
        </div>

        <div className="prose-custom break-words">
          <Markdown remarkPlugins={[remarkGfm]}>
            {message.content}
          </Markdown>
        </div>

        {message.attachments && message.attachments.length > 0 && (
          <div className="flex flex-wrap gap-2 mt-4">
            {message.attachments.map((att, i) => (
              <div key={i} className="relative group rounded-xl overflow-hidden border border-slate-200 bg-white shadow-sm">
                {(att.mimeType?.startsWith('image/') || !att.mimeType) && att.data ? (
                  <div className="relative group/img">
                    <img 
                      src={`data:${att.mimeType || 'image/png'};base64,${att.data}`} 
                      alt={att.name} 
                      className="h-64 w-auto object-cover cursor-pointer hover:opacity-90 transition-opacity" 
                      onClick={() => setFullscreenImage(`data:${att.mimeType || 'image/png'};base64,${att.data}`)}
                    />
                    <button
                      onClick={(e) => handleDownloadImage(e, att)}
                      className="absolute top-2 right-2 p-2 bg-black/50 hover:bg-black/70 text-white rounded-full opacity-0 group-hover/img:opacity-100 transition-opacity"
                      title="Tải ảnh xuống"
                    >
                      <Download className="w-4 h-4" />
                    </button>
                  </div>
                ) : null}
              </div>
            ))}
          </div>
        )}

        <div className="mt-3 flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity md:opacity-100">
          <button
            onClick={handleCopy}
            className="flex items-center gap-1.5 text-xs font-medium text-slate-500 hover:text-slate-700 transition-colors p-1.5 rounded-md hover:bg-slate-200"
            title="Sao chép nội dung"
          >
            {isCopied ? <Check className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4" />}
          </button>
          
          {onRetry && (
            <button
              onClick={onRetry}
              className="flex items-center gap-1.5 text-xs font-medium text-slate-500 hover:text-slate-700 transition-colors p-1.5 rounded-md hover:bg-slate-200"
              title="Hỏi lại câu này"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          )}
        </div>
        {/* Fullscreen Image Modal for AI */}
        {fullscreenImage && (
          <div 
            className="fixed inset-0 z-[100] bg-black/90 flex items-center justify-center p-4 backdrop-blur-sm"
            onClick={() => setFullscreenImage(null)}
          >
            <button 
              className="absolute top-4 right-16 p-2 text-white/70 hover:text-white bg-black/50 hover:bg-black/80 rounded-full transition-all"
              onClick={(e) => {
                e.stopPropagation();
                const link = document.createElement('a');
                link.href = fullscreenImage;
                link.download = 'generated-image.png';
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
              }}
              title="Tải ảnh xuống"
            >
              <Download className="w-6 h-6" />
            </button>
            <button 
              className="absolute top-4 right-4 p-2 text-white/70 hover:text-white bg-black/50 hover:bg-black/80 rounded-full transition-all"
              onClick={(e) => {
                e.stopPropagation();
                setFullscreenImage(null);
              }}
            >
              <X className="w-6 h-6" />
            </button>
            <img 
              src={fullscreenImage} 
              alt="Fullscreen view" 
              className="max-w-full max-h-full object-contain rounded-lg shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            />
          </div>
        )}
      </div>
    </div>
  );
}
