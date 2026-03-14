import { SendHorizontal, Loader2, Sparkles, AlignLeft, List, Zap, Mic, Paperclip, X, Image as ImageIcon, FileText } from 'lucide-react';
import { useState, useRef, useEffect } from 'react';
import { clsx } from 'clsx';
import { ResponseStyle, Attachment } from '../types';
import { User } from 'firebase/auth';

interface InputAreaProps {
  onSendMessage: (message: string, style: ResponseStyle, attachments?: Attachment[]) => void;
  isLoading: boolean;
  user?: User | null;
}

const STYLES: { id: ResponseStyle; label: string; icon: any }[] = [
  { id: 'short', label: 'Ngắn gọn', icon: Zap },
  { id: 'detailed', label: 'Chi tiết', icon: List },
  { id: 'simple', label: 'Dễ hiểu', icon: AlignLeft },
];

export function InputArea({ onSendMessage, isLoading, user }: InputAreaProps) {
  const [input, setInput] = useState('');
  const [style, setStyle] = useState<ResponseStyle>('detailed');
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [isListening, setIsListening] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const recognitionRef = useRef<any>(null);

  useEffect(() => {
    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
    };
  }, []);

  const handleSubmit = (e?: React.FormEvent) => {
    e?.preventDefault();
    if ((input.trim() || attachments.length > 0) && !isLoading) {
      onSendMessage(input.trim(), style, attachments.length > 0 ? attachments : undefined);
      setInput('');
      setAttachments([]);
      if (textareaRef.current) {
        textareaRef.current.style.height = 'auto';
      }
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const handleFileUpload = async (files: FileList | null) => {
    if (!files) return;
    
    if (!user) {
      alert('Vui lòng đăng nhập bằng tài khoản Google để sử dụng chức năng đính kèm tệp.');
      return;
    }
    
    if (attachments.length + files.length > 10) {
      alert('Chỉ được phép tải lên tối đa 10 tệp đính kèm.');
      return;
    }

    const newAttachments: Attachment[] = [];
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      if (file.size > 5 * 1024 * 1024) {
        alert(`File ${file.name} quá lớn. Vui lòng chọn file < 5MB.`);
        continue;
      }

      // Compress image if it's an image
      let dataToSave = '';
      if (file.type.startsWith('image/')) {
        dataToSave = await compressImage(file);
      } else {
        const reader = new FileReader();
        dataToSave = await new Promise<string>((resolve) => {
          reader.onload = (e) => {
            const result = e.target?.result as string;
            resolve(result.split(',')[1]);
          };
          reader.readAsDataURL(file);
        });
      }
      
      newAttachments.push({ name: file.name, mimeType: file.type, data: dataToSave });
    }
    setAttachments(prev => [...prev, ...newAttachments]);
  };

  const compressImage = (file: File): Promise<string> => {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          let width = img.width;
          let height = img.height;
          
          // Max dimension 800px
          const MAX_DIM = 800;
          if (width > height && width > MAX_DIM) {
            height *= MAX_DIM / width;
            width = MAX_DIM;
          } else if (height > MAX_DIM) {
            width *= MAX_DIM / height;
            height = MAX_DIM;
          }
          
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          ctx?.drawImage(img, 0, 0, width, height);
          
          const dataUrl = canvas.toDataURL('image/jpeg', 0.7);
          resolve(dataUrl.split(',')[1]);
        };
        img.src = e.target?.result as string;
      };
      reader.readAsDataURL(file);
    });
  };

  const toggleListening = async () => {
    if (isListening) {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
      setIsListening(false);
      return;
    }

    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
      alert('Trình duyệt của bạn không hỗ trợ nhận diện giọng nói.');
      return;
    }

    try {
      await navigator.mediaDevices.getUserMedia({ audio: true });
    } catch (err) {
      console.error('Microphone permission denied', err);
      alert('Vui lòng cấp quyền sử dụng micro trong cài đặt trình duyệt để có thể nhập bằng giọng nói.');
      return;
    }

    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    const recognition = new SpeechRecognition();
    recognitionRef.current = recognition;
    
    recognition.lang = 'vi-VN';
    recognition.interimResults = true;
    recognition.continuous = true;
    recognition.maxAlternatives = 1;

    let finalTranscript = '';

    recognition.onstart = () => setIsListening(true);
    
    recognition.onresult = (event: any) => {
      let interimTranscript = '';
      for (let i = event.resultIndex; i < event.results.length; ++i) {
        if (event.results[i].isFinal) {
          finalTranscript += event.results[i][0].transcript;
        } else {
          interimTranscript += event.results[i][0].transcript;
        }
      }
      
      const currentInput = input.trim();
      const separator = currentInput && finalTranscript ? ' ' : '';
      setInput(currentInput + separator + finalTranscript + interimTranscript);
    };
    
    recognition.onerror = (event: any) => {
      console.error('Speech recognition error', event.error);
      if (event.error === 'not-allowed') {
        alert('Vui lòng cấp quyền sử dụng micro để nhập bằng giọng nói.');
      }
      setIsListening(false);
    };
    
    recognition.onend = () => {
      setIsListening(false);
    };

    try {
      recognition.start();
    } catch (e) {
      console.error('Failed to start recognition', e);
      setIsListening(false);
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    if (e.clipboardData.files.length > 0) {
      e.preventDefault();
      if (!user) {
        alert('Vui lòng đăng nhập bằng tài khoản Google để sử dụng chức năng dán ảnh/tệp.');
        return;
      }
      handleFileUpload(e.clipboardData.files);
    }
  };

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 200)}px`;
    }
  }, [input]);

  return (
    <div className="relative w-full max-w-3xl mx-auto px-4 pb-6 pt-2">
      <div className="flex items-center gap-2 mb-3 overflow-x-auto pb-1 scrollbar-hide">
        <span className="text-xs font-medium text-slate-500 flex items-center gap-1 whitespace-nowrap">
          <Sparkles className="w-3.5 h-3.5" />
          PHONG CÁCH:
        </span>
        {STYLES.map((s) => (
          <button
            key={s.id}
            onClick={() => setStyle(s.id)}
            className={clsx(
              "flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all duration-200 whitespace-nowrap",
              style === s.id 
                ? "bg-slate-800 text-white shadow-sm" 
                : "bg-slate-100 text-slate-600 hover:bg-slate-200"
            )}
          >
            <s.icon className={clsx("w-3.5 h-3.5", style === s.id ? "text-white" : "text-slate-500")} />
            {s.label}
          </button>
        ))}
      </div>

      <div 
        className={clsx(
          "relative flex flex-col w-full bg-slate-100 rounded-3xl border transition-colors",
          isDragging ? "border-slate-400 bg-slate-200" : "border-transparent focus-within:border-slate-300 focus-within:bg-white focus-within:shadow-sm"
        )}
        onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={(e) => { e.preventDefault(); setIsDragging(false); handleFileUpload(e.dataTransfer.files); }}
      >
        {/* Attachments Preview */}
        {attachments.length > 0 && (
          <div className="flex flex-wrap gap-2 px-4 pt-4 pb-2">
            {attachments.map((att, i) => (
              <div key={i} className="relative group flex items-center gap-2 bg-white border border-slate-200 rounded-xl p-1.5 pr-8 shadow-sm">
                {att.mimeType.startsWith('image/') && att.data ? (
                  <img src={`data:${att.mimeType};base64,${att.data}`} alt={att.name} className="h-10 w-10 object-cover rounded-lg" />
                ) : (
                  <div className="w-10 h-10 flex items-center justify-center bg-slate-50 rounded-lg">
                    <FileText className="w-5 h-5 text-blue-500" />
                  </div>
                )}
                <div className="flex flex-col justify-center">
                  <span className="text-xs font-medium text-slate-700 max-w-[120px] truncate">{att.name}</span>
                  <span className="text-[10px] text-slate-500 uppercase">{att.mimeType.split('/')[1] || 'FILE'}</span>
                </div>
                <button 
                  type="button" 
                  onClick={() => setAttachments(prev => prev.filter((_, idx) => idx !== i))} 
                  className="absolute right-1.5 top-1/2 -translate-y-1/2 p-1 rounded-full hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
          </div>
        )}

        <textarea
          ref={textareaRef}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          onPaste={handlePaste}
          placeholder="Hỏi bất cứ điều gì..."
          className="w-full max-h-[200px] min-h-[56px] bg-transparent border-none focus:ring-0 resize-none px-4 py-3.5 text-slate-900 placeholder-slate-500 text-[15px] leading-relaxed outline-none"
          rows={1}
          disabled={isLoading}
        />
        
        <div className="flex items-center justify-between px-3 pb-3 pt-1">
          <div className="flex items-center gap-1">
            <input type="file" multiple ref={fileInputRef} className="hidden" onChange={(e) => handleFileUpload(e.target.files)} />
            
            <button 
              type="button" 
              onClick={() => fileInputRef.current?.click()} 
              className="p-2 rounded-full text-slate-500 hover:bg-slate-200 transition-colors" 
              title="Đính kèm file"
            >
              <Paperclip className="w-5 h-5" />
            </button>

            <button 
              type="button" 
              onClick={toggleListening} 
              className={clsx(
                "p-2 rounded-full transition-colors", 
                isListening 
                  ? "text-red-500 bg-red-50 animate-pulse" 
                  : "text-slate-500 hover:bg-slate-200"
              )} 
              title={isListening ? "Dừng ghi âm" : "Nhập bằng giọng nói"}
            >
              <Mic className="w-5 h-5" />
            </button>
          </div>
          
          <button
            onClick={handleSubmit}
            disabled={(!input.trim() && attachments.length === 0) || isLoading}
            className={clsx(
              "p-2 rounded-full transition-all duration-200 flex items-center justify-center",
              (input.trim() || attachments.length > 0) && !isLoading
                ? "bg-black text-white hover:opacity-80"
                : "bg-slate-200 text-slate-400 cursor-not-allowed"
            )}
          >
            {isLoading ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <SendHorizontal className="w-5 h-5" />
            )}
          </button>
        </div>
      </div>
      
      <div className="text-center mt-3">
        <span className="text-xs text-slate-500">
          AI có thể mắc lỗi. Vui lòng kiểm tra lại các thông tin quan trọng.
        </span>
      </div>
    </div>
  );
}
