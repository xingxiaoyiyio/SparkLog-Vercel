import { GoogleGenerativeAI } from "@google/generative-ai";
import { NextResponse } from 'next/server';

// 生成模拟摘要的辅助函数
function generateMockSummary(messages: any[]) {
  // 简单分析消息内容，生成模拟摘要
  const transcript = messages
    .map((m: any) => m.text || '')
    .join(' ');
    
  const positiveKeywords = ['开心', '高兴', '快乐', '棒', '好', '成功', '完成'];
  const negativeKeywords = ['难过', '伤心', '糟糕', '不好', '失败', '遗憾'];
  const hasTaskCompletion = transcript.includes('完成') || transcript.includes('搞定');
  
  // 根据内容生成模拟数据
  let moodEmoji = "😊";
  let moodColor = "#FFD700";
  let highlights = ["完成日常记录", "保持了好心情"];
  let actionItems = [];
  let inspirations = [];
  let stats = [];
  
  // 检测是否有任务完成
  if (hasTaskCompletion) {
    highlights.push("完成了重要任务");
    stats.push({ "label": "完成任务", "value": "1项" });
  }
  
  // 检测情绪
  if (positiveKeywords.some(keyword => transcript.includes(keyword))) {
    moodEmoji = "😄";
    moodColor = "#4CAF50";
    highlights.push("保持积极心态");
  } else if (negativeKeywords.some(keyword => transcript.includes(keyword))) {
    moodEmoji = "😔";
    moodColor = "#FF9800";
    actionItems.push("明天会更好");
  }
  
  return {
    highlight: highlights,
    actionItems: actionItems,
    inspirations: inspirations,
    stats: stats,
    moodEmoji: moodEmoji,
    moodColor: moodColor
  };
}

export async function POST(req: Request) {
  try {
    // 从环境变量获取 API Key
    const apiKey = process.env.GEMINI_API_KEY;
    
    // 调试 API Key
    console.log("Summary API - GEMINI_API_KEY 存在:", !!apiKey);
    console.log("Summary API - GEMINI_API_KEY 长度:", apiKey?.length || 0);
    
    // 解析请求体
    const { messages } = await req.json();
    
    // 如果API Key存在，尝试调用真实API
    if (apiKey && apiKey.length > 0) {
      console.log("尝试使用真实API调用");
      try {
        // 详细检查 API Key
        if (!apiKey) {
          console.error("Summary API - GEMINI_API_KEY 环境变量未设置");
          return NextResponse.json({ error: "GEMINI_API_KEY 环境变量未设置", isRealAPI: true }, { status: 400 });
        }
        
        // 初始化 GoogleGenerativeAI（只传 API Key）
        const ai = new GoogleGenerativeAI(apiKey);

        // Get the model
        const model = ai.getGenerativeModel({
          model: 'gemini-1.5-flash'
        });

        // Convert message history to a text transcript
        const transcript = messages
          .map((m: any) => `${m.role === 'user' ? '用户' : 'SparkLog'}: ${m.text}`)
          .join('\n');

        const prompt = `
        🔴 系统指令：立即执行【今日日结】任务。
        
        以下是今天的完整对话记录：
        ====================
        ${transcript}
        ====================
        
        请根据上述对话内容，生成一份结构化的日记总结。
        
        要求：
        1. 语言必须是**中文**。
        2. 严格按照下方的 JSON 格式返回。
        3. **stats (数据统计)**：请仔细分析对话，如果有提到具体的花费（金额）、数量（如见了3个客户、跑了5公里、读了2本书），请自动汇总计算。如果没有数字，此项必须为空数组 []。
        4. **highlight (今日高光)**：3-5 个具体的点，简短有力，必须基于对话内容，不要编造。
        5. **moodEmoji**：选择一个最能代表今天心情的 Emoji。
        6. **moodColor**：选择一个代表今天心情的颜色 Hex 代码 (必须是有效的颜色代码，例如 #FF5733)。
        
        JSON 结构定义：
        {
          "highlight": ["高光时刻1", "高光时刻2"],
          "actionItems": ["待办1", "计划2"],
          "inspirations": ["链接标题", "灵感碎片"],
          "stats": [
              { "label": "今日消费", "value": "128元" },
              { "label": "完成任务", "value": "3项" }
          ],
          "moodEmoji": "🌟",
          "moodColor": "#HEXCODE"
        }
        `;

        const result = await model.generateContent({
          contents: [{ role: 'user', parts: [{ text: prompt }] }],
          generationConfig: {
            responseMimeType: "application/json"
          }
        });

        const jsonStr = result.response?.text() || '';
        // Google GenAI usually returns pure JSON with responseMimeType, but strip code blocks just in case
        const cleanJson = jsonStr.replace(/```json|```/g, '');
        const data = JSON.parse(cleanJson);

        // Enforce server date
        const today = new Date();
        const dateString = `${today.getFullYear()}年${today.getMonth() + 1}月${today.getDate()}日`;

        return NextResponse.json({
          ...data,
          date: dateString,
          rawLog: [],
          isRealAPI: true
        });
      } catch (apiError) {
        console.error('真实API调用失败，使用模拟响应:', apiError);
        // 真实API调用失败，回退到模拟响应
      }
    }
    
    // 生成模拟摘要
    console.log("使用模拟响应");
    const mockSummary = generateMockSummary(messages);
    
    // Enforce server date for mock response
    const today = new Date();
    const dateString = `${today.getFullYear()}年${today.getMonth() + 1}月${today.getDate()}日`;
    
    return NextResponse.json({
      ...mockSummary,
      date: dateString,
      rawLog: [],
      isMock: true
    });
  } catch (error) {
    // 记录错误信息
    console.error('Summary API - 处理失败:', error);
    
    // 返回友好的错误信息和模拟响应
    const today = new Date();
    const dateString = `${today.getFullYear()}年${today.getMonth() + 1}月${today.getDate()}日`;
    
    return NextResponse.json({
      highlight: ["完成日常记录"],
      actionItems: [],
      inspirations: [],
      stats: [],
      moodEmoji: "😐",
      moodColor: "#808080",
      date: dateString,
      rawLog: [],
      isMock: true
    });
  }
}