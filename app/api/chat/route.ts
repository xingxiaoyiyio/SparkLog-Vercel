import { GoogleGenerativeAI } from "@google/generative-ai";
import { NextResponse } from 'next/server';

const SYSTEM_INSTRUCTION = `
角色定义：
你是 SparkLog（星火日志），一个碎片化日记助手。你的人设是好奇、充满活力且富有洞察力的“数字死党”。

语言要求：
**全程使用中文**。
**极致简洁**：除非用户要求深究，否则回复控制在 **40字以内**。不要废话，直击重点。

🔴 **关于链接处理的核心规则 (最高优先级)**：
1. **必须调用搜索**：收到 URL 必须使用 Google Search。
2. **严禁瞎猜**：如果 Search 结果只显示“验证码”、“登录”、“首页”或非常泛泛的平台介绍，**绝对不要**根据 URL 里的单词去编造内容。
3. **无法读取时的处理**：
   - 如果你无法从搜索摘要中获取该具体文章/视频的详细内容，**直接承认**。
   - 回复模板：“这个链接我看不到具体内容🙈。是关于什么的？给我个太长不看版（TL;DR）？”
   - **不要**试图解释为什么看不了，直接问用户内容。

交互流程：
1. 碎片记录模式（实时对话）
   - **链接**：尝试搜索 -> 有内容则一句话概括+提问；无内容则直接问用户“讲了啥？”。
   - **文本**：秒回。给予简短的情绪价值（“太棒了！”“抱抱🫂”），或者标记 Todo。
   - **图片**：一句话神吐槽或夸奖。

2. “每日日结”模式
   - 不需要确认，直接生成总结。
`;

// 生成模拟响应的辅助函数
function generateMockResponse(text: string, image?: string) {
  // 根据输入内容生成不同的模拟回复
  if (image) {
    return "这张图看起来不错呢！能和我分享一下更多细节吗？";
  }
  
  // 简单的关键词匹配来生成更相关的回复
  if (text.includes("你好") || text.includes("嗨") || text.includes("Hello")) {
    return "你好！今天过得怎么样？";
  }
  if (text.includes("开心") || text.includes("高兴") || text.includes("快乐")) {
    return "太棒了！能分享一下让你开心的事吗？";
  }
  if (text.includes("难过") || text.includes("伤心") || text.includes("糟糕")) {
    return "抱抱🫂，希望明天会更好。";
  }
  if (text.includes("计划") || text.includes("打算") || text.includes("目标")) {
    return "很好的计划！需要我帮你记下来吗？";
  }
  if (text.includes("完成") || text.includes("搞定") || text.includes("结束")) {
    return "恭喜你！又完成了一件事 ✅";
  }
  if (text.includes("https://")) {
    return "这个链接我看不到具体内容🙈。是关于什么的？给我个太长不看版（TL;DR）？";
  }
  
  // 默认回复
  return "我在听呢，继续说吧！";
}

export async function POST(req: Request) {
  try {
    // 从环境变量获取 API Key
    const apiKey = process.env.GEMINI_API_KEY;
    
    // 调试 API Key
    console.log("GEMINI_API_KEY 存在:", !!apiKey);
    console.log("GEMINI_API_KEY 长度:", apiKey?.length || 0);
    
    // 解析请求体
    const { text, history, image } = await req.json();
    
    // 如果API Key存在，尝试调用真实API
    if (apiKey && apiKey.length > 0) {
      console.log("尝试使用真实API调用");
      try {
        // 初始化 GoogleGenerativeAI（只传 API Key）
        const ai = new GoogleGenerativeAI(apiKey);

        // Get the model
        const model = ai.getGenerativeModel({
          model: 'gemini-1.5-flash', // 使用更通用的模型
          systemInstruction: SYSTEM_INSTRUCTION
        });

        // Reconstruct history for the chat session
        const historyContent = history
          .filter((msg: any) => msg.role !== 'system') // Filter out any system messages if they exist
          .map((msg: any) => ({
            role: msg.role === 'model' ? 'model' : 'user',
            parts: [{ text: msg.text }] // Note: We don't re-upload old images in history for simplicity here, just text context
          }));

        let result;
        if (image) {
          // Multimodal message
          result = await model.generateContent([
            ...historyContent,
            {
              role: 'user',
              parts: [
                { inlineData: { mimeType: 'image/jpeg', data: image } },
                { text: text || "看看这张图！" }
              ]
            }
          ]);
        } else {
          // Text message
          result = await model.generateContent([
            ...historyContent,
            {
              role: 'user',
              parts: [{ text }]
            }
          ]);
        }

        const responseText = result.response?.text() || "";
        const sources: any[] = [];
        
        // Handle sources if available
        try {
          const candidates = result.response?.candidates;
          if (candidates && candidates.length > 0) {
            const chunks = candidates[0]?.groundingMetadata?.groundingChunks;
            if (chunks) {
              chunks.forEach((chunk: any) => {
                if (chunk.web?.uri && chunk.web?.title) {
                  sources.push({ uri: chunk.web.uri, title: chunk.web.title });
                }
              });
            }
          }
        } catch (e) {
          console.log("Error processing sources:", e);
        }

        return NextResponse.json({ text: responseText, sources, isRealAPI: true });
      } catch (apiError) {
        console.error('真实API调用失败，使用模拟响应:', apiError);
        // 真实API调用失败，回退到模拟响应
      }
    }
    
    // 生成模拟响应
    console.log("使用模拟响应");
    const mockText = generateMockResponse(text, image);
    
    return NextResponse.json({
      text: mockText,
      sources: [],
      isMock: true
    });
  } catch (error) {
    // 记录错误信息
    console.error('Chat API - 处理失败:', error);
    
    // 返回友好的错误信息和模拟响应
    return NextResponse.json({
      text: "脑路有点堵车😵‍💫。我正在处理你的消息...",
      sources: [],
      isMock: true
    });
  }
}