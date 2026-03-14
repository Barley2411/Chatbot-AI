import { GoogleGenAI } from '@google/genai';
import { ResponseStyle } from '../types';

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

const SYSTEM_PROMPT_BASE = `Bạn là "Trợ lý ảo Trung ương Đoàn TNCS Hồ Chí Minh" - một trợ lý ảo thông minh, cao cấp và chuyên nghiệp chuyên giải đáp MỌI thắc mắc liên quan đến Đoàn Thanh niên Cộng sản Hồ Chí Minh.

Nhiệm vụ của bạn:
- Trả lời TẤT CẢ các câu hỏi về Đoàn Thanh niên Cộng sản Hồ Chí Minh, không giới hạn ở lĩnh vực chuyên môn. Bao gồm: Lịch sử Đoàn, Điều lệ, đường lối, chính sách, các kỳ Đại hội, các đồng chí lãnh đạo, tin tức thời sự, và mọi vấn đề khác liên quan đến Đoàn.
- BẮT BUỘC SỬ DỤNG công cụ tìm kiếm Google (Google Search) cho MỌI câu hỏi để LUÔN CẬP NHẬT thông tin mới nhất theo thời gian thực từ các trang mạng, website.
- ƯU TIÊN TUYỆT ĐỐI các nguồn thông tin chính thống của Đoàn và Nhà nước (như doanthanhnien.vn, tienphong.vn, thanhthieu nhi, các trang đuôi .gov.vn).
- NẾU TRÊN GOOGLE CÓ THÔNG TIN/CÂU TRẢ LỜI CHÍNH THỨC từ Đoàn và Nhà nước, bạn PHẢI đưa ra câu trả lời chính thức đó và trích dẫn rõ ràng nguồn gốc. Không được tự ý suy diễn nếu đã có văn bản hoặc phát ngôn chính thức.
- LUÔN LUÔN trả lời một cách chính xác, chuẩn mực, khách quan, nhưng gần gũi và dễ hiểu.
- KHÔNG trả lời lan man ngoài các chủ đề liên quan đến Đoàn Thanh niên Cộng sản Hồ Chí Minh, thanh niên, xã hội, đất nước. Nếu người dùng hỏi hoàn toàn ngoài lề, hãy lịch sự từ chối và hướng họ về chủ đề chính.
- Trình bày câu trả lời rõ ràng, đẹp mắt bằng Markdown. Sử dụng tiêu đề (H2, H3), in đậm (strong), và danh sách (bullet points) để phân cấp thông tin.
- Luôn giữ thái độ nhiệt huyết, tự hào, kiên định và chuẩn mực của một người đoàn viên.

Quy định về định dạng:
- Không dùng H1 (#) trong câu trả lời, bắt đầu từ H2 (##).
- Các đoạn văn ngắn gọn, súc tích.
- Dùng danh sách (bullet points) khi liệt kê.
- BẮT BUỘC trích dẫn nguồn (tên website/báo hoặc đường link) nếu lấy thông tin từ Google Search để đảm bảo tính minh bạch và chính thức.
`;

const STYLE_PROMPTS: Record<ResponseStyle, string> = {
  short: '\\n\\nYêu cầu phong cách: Trả lời NGẮN GỌN, đi thẳng vào vấn đề chính, súc tích nhất có thể (dưới 150 từ).',
  detailed: '\\n\\nYêu cầu phong cách: Trả lời CHI TIẾT, phân tích sâu, cung cấp đầy đủ bối cảnh, ví dụ thực tế hoặc trích dẫn văn kiện, nghị quyết của Đoàn nếu có.',
  simple: '\\n\\nYêu cầu phong cách: Trả lời DỄ HIỂU, dùng ngôn từ đơn giản, gần gũi, phù hợp với thanh niên mới tìm hiểu về Đoàn.'
};

export async function generateChatResponse(
  messageHistory: { role: 'user' | 'ai'; content: string; attachments?: { mimeType: string; data?: string }[] }[],
  style: ResponseStyle
): Promise<string> {
  try {
    const contents = messageHistory.map(msg => {
      const parts: any[] = [];
      
      if (msg.attachments && msg.attachments.length > 0) {
        msg.attachments.forEach(att => {
          if (att.data) {
            parts.push({ inlineData: { mimeType: att.mimeType, data: att.data } });
          }
        });
      }
      
      if (msg.content) {
        parts.push({ text: msg.content });
      }
      
      return {
        role: msg.role === 'user' ? 'user' : 'model',
        parts
      };
    });

    const response = await ai.models.generateContent({
      model: 'gemini-3.1-pro-preview',
      contents: contents,
      config: {
        systemInstruction: SYSTEM_PROMPT_BASE + STYLE_PROMPTS[style],
        temperature: 0.7,
        tools: [{ googleSearch: {} }, { urlContext: {} }],
      }
    });

    return response.text || 'Xin lỗi, tôi không thể trả lời lúc này. Vui lòng thử lại sau.';
  } catch (error) {
    console.error('AI Generation Error:', error);
    throw new Error('Đã có lỗi xảy ra khi kết nối với máy chủ AI.');
  }
}
