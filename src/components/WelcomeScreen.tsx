import { Sparkles, BookOpen, Flag, Users, GraduationCap } from 'lucide-react';
import { motion } from 'motion/react';

import { User } from 'firebase/auth';

interface WelcomeScreenProps {
  onTopicSelect: (topic: string) => void;
  user?: User | null;
}

const SUGGESTIONS = [
  {
    icon: BookOpen,
    title: 'Điều lệ Đoàn',
    description: 'Tìm hiểu về quyền, nhiệm vụ và điều kiện kết nạp Đoàn viên.',
    prompt: 'Hãy tóm tắt những điểm quan trọng nhất trong Điều lệ Trung ương Đoàn TNCS Hồ Chí Minh hiện hành.',
    color: 'from-blue-500 to-cyan-400',
    bg: 'bg-blue-50',
    iconColor: 'text-blue-600'
  },
  {
    icon: Flag,
    title: 'Lịch sử Đoàn',
    description: 'Khám phá các cột mốc lịch sử quan trọng của Trung ương Đoàn TNCS Hồ Chí Minh.',
    prompt: 'Trình bày tóm tắt về sự kiện thành lập Đoàn TNCS Hồ Chí Minh ngày 26/3/1931.',
    color: 'from-red-500 to-orange-400',
    bg: 'bg-red-50',
    iconColor: 'text-red-600'
  },
  {
    icon: Users,
    title: 'Tổ chức cơ sở Đoàn',
    description: 'Cơ cấu tổ chức và hoạt động của chi đoàn, đoàn cơ sở.',
    prompt: 'Chi đoàn là gì? Nhiệm vụ và quyền hạn của Ban Chấp hành Chi đoàn?',
    color: 'from-emerald-500 to-teal-400',
    bg: 'bg-emerald-50',
    iconColor: 'text-emerald-600'
  },
  {
    icon: GraduationCap,
    title: 'Công tác phát triển Đoàn',
    description: 'Quy trình và thủ tục bồi dưỡng, kết nạp thanh niên ưu tú vào Đoàn.',
    prompt: 'Quy trình kết nạp một thanh niên ưu tú vào Trung ương Đoàn TNCS Hồ Chí Minh gồm những bước nào?',
    color: 'from-purple-500 to-indigo-400',
    bg: 'bg-purple-50',
    iconColor: 'text-purple-600'
  }
];

export function WelcomeScreen({ onTopicSelect, user }: WelcomeScreenProps) {
  return (
    <div className="flex flex-col items-center justify-center min-h-full p-6 md:p-12">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="text-center max-w-2xl mx-auto mb-12"
      >
        <div className="inline-flex items-center justify-center p-3 bg-red-500/10 rounded-2xl mb-6 shadow-inner border border-red-500/20">
          <Sparkles className="w-8 h-8 text-red-600" />
        </div>
        <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mb-4 tracking-tight">
          Xin chào, đồng chí{user?.displayName ? ` ${user.displayName}` : ''}!
        </h2>
        <p className="text-lg text-slate-600 leading-relaxed">
          Tôi là <span className="font-semibold text-red-600">Trợ lý ảo Trung ương Đoàn TNCS Hồ Chí Minh</span>, chuyên giải đáp mọi thắc mắc về tổ chức Đoàn. Tôi có thể giúp gì cho đồng chí hôm nay?
        </p>
      </motion.div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full max-w-4xl mx-auto">
        {SUGGESTIONS.map((item, index) => (
          <motion.button
            key={item.title}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: index * 0.1 }}
            onClick={() => onTopicSelect(item.prompt)}
            className="group relative flex flex-col items-start text-left p-6 rounded-2xl glass-card overflow-hidden"
          >
            <div className="absolute inset-0 bg-gradient-to-br opacity-0 group-hover:opacity-5 transition-opacity duration-500 pointer-events-none" />
            
            <div className={`p-3 rounded-xl ${item.bg} mb-4 group-hover:scale-110 transition-transform duration-300`}>
              <item.icon className={`w-6 h-6 ${item.iconColor}`} />
            </div>
            
            <h3 className="text-lg font-semibold text-slate-800 mb-2 group-hover:text-red-600 transition-colors">
              {item.title}
            </h3>
            <p className="text-sm text-slate-500 leading-relaxed">
              {item.description}
            </p>
          </motion.button>
        ))}
      </div>
    </div>
  );
}
