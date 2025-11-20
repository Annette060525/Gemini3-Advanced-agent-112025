import { Theme, Language, Translation, AgentConfig } from './types';

export const FLOWER_THEMES: Record<string, Theme> = {
  "Cherry Blossom": { name: "Cherry Blossom", primary: "#FFB7C5", secondary: "#FFC0CB", accent: "#FF69B4", bg_light: "linear-gradient(135deg, #ffe6f0 0%, #fff5f8 50%, #ffe6f0 100%)", bg_dark: "linear-gradient(135deg, #2d1b2e 0%, #3d2533 50%, #2d1b2e 100%)", icon: "🌸" },
  "Rose": { name: "Rose", primary: "#E91E63", secondary: "#F06292", accent: "#C2185B", bg_light: "linear-gradient(135deg, #fce4ec 0%, #fff 50%, #fce4ec 100%)", bg_dark: "linear-gradient(135deg, #1a0e13 0%, #2d1420 50%, #1a0e13 100%)", icon: "🌹" },
  "Lavender": { name: "Lavender", primary: "#9C27B0", secondary: "#BA68C8", accent: "#7B1FA2", bg_light: "linear-gradient(135deg, #f3e5f5 0%, #fff 50%, #f3e5f5 100%)", bg_dark: "linear-gradient(135deg, #1a0d1f 0%, #2d1a33 50%, #1a0d1f 100%)", icon: "💜" },
  "Tulip": { name: "Tulip", primary: "#FF5722", secondary: "#FF8A65", accent: "#E64A19", bg_light: "linear-gradient(135deg, #fbe9e7 0%, #fff 50%, #fbe9e7 100%)", bg_dark: "linear-gradient(135deg, #1f0e0a 0%, #331814 50%, #1f0e0a 100%)", icon: "🌷" },
  "Sunflower": { name: "Sunflower", primary: "#FFC107", secondary: "#FFD54F", accent: "#FFA000", bg_light: "linear-gradient(135deg, #fff9e6 0%, #fffef5 50%, #fff9e6 100%)", bg_dark: "linear-gradient(135deg, #1f1a0a 0%, #332814 50%, #1f1a0a 100%)", icon: "🌻" },
  "Lotus": { name: "Lotus", primary: "#E91E8C", secondary: "#F48FB1", accent: "#AD1457", bg_light: "linear-gradient(135deg, #fce4f0 0%, #fff 50%, #fce4f0 100%)", bg_dark: "linear-gradient(135deg, #1f0e1a 0%, #331826 50%, #1f0e1a 100%)", icon: "🪷" },
  "Orchid": { name: "Orchid", primary: "#9C27B0", secondary: "#CE93D8", accent: "#6A1B9A", bg_light: "linear-gradient(135deg, #f3e5f5 0%, #faf5ff 50%, #f3e5f5 100%)", bg_dark: "linear-gradient(135deg, #1a0d1f 0%, #2d1a33 50%, #1a0d1f 100%)", icon: "🌺" },
  "Jasmine": { name: "Jasmine", primary: "#4CAF50", secondary: "#81C784", accent: "#388E3C", bg_light: "linear-gradient(135deg, #e8f5e9 0%, #f1f8f1 50%, #e8f5e9 100%)", bg_dark: "linear-gradient(135deg, #0a1f0d 0%, #14331a 50%, #0a1f0d 100%)", icon: "🤍" },
  "Peony": { name: "Peony", primary: "#E91E63", secondary: "#F06292", accent: "#C2185B", bg_light: "linear-gradient(135deg, #fce4ec 0%, #fff 50%, #fce4ec 100%)", bg_dark: "linear-gradient(135deg, #1f0e13 0%, #331826 50%, #1f0e13 100%)", icon: "🌺" },
  "Lily": { name: "Lily", primary: "#FFFFFF", secondary: "#F5F5F5", accent: "#E0E0E0", bg_light: "linear-gradient(135deg, #fafafa 0%, #fff 50%, #fafafa 100%)", bg_dark: "linear-gradient(135deg, #0d0d0d 0%, #1a1a1a 50%, #0d0d0d 100%)", icon: "⚪" },
  "Violet": { name: "Violet", primary: "#673AB7", secondary: "#9575CD", accent: "#512DA8", bg_light: "linear-gradient(135deg, #ede7f6 0%, #f8f5ff 50%, #ede7f6 100%)", bg_dark: "linear-gradient(135deg, #0d0a1f 0%, #1a1433 50%, #0d0a1f 100%)", icon: "💜" },
  "Plum Blossom": { name: "Plum Blossom", primary: "#E91E63", secondary: "#F48FB1", accent: "#C2185B", bg_light: "linear-gradient(135deg, #fce4ec 0%, #fff5f8 50%, #fce4ec 100%)", bg_dark: "linear-gradient(135deg, #1f0e13 0%, #2d1a20 50%, #1f0e13 100%)", icon: "🌸" },
  "Camellia": { name: "Camellia", primary: "#D32F2F", secondary: "#EF5350", accent: "#B71C1C", bg_light: "linear-gradient(135deg, #ffebee 0%, #fff 50%, #ffebee 100%)", bg_dark: "linear-gradient(135deg, #1f0a0a 0%, #330d0d 50%, #1f0a0a 100%)", icon: "🌹" },
  "Carnation": { name: "Carnation", primary: "#F06292", secondary: "#F8BBD0", accent: "#E91E63", bg_light: "linear-gradient(135deg, #fce4ec 0%, #fff5f8 50%, #fce4ec 100%)", bg_dark: "linear-gradient(135deg, #1f0e13 0%, #2d1a20 50%, #1f0e13 100%)", icon: "💐" },
  "Begonia": { name: "Begonia", primary: "#FF5252", secondary: "#FF8A80", accent: "#D50000", bg_light: "linear-gradient(135deg, #ffebee 0%, #fff 50%, #ffebee 100%)", bg_dark: "linear-gradient(135deg, #1f0a0a 0%, #330d0d 50%, #1f0a0a 100%)", icon: "🌺" },
  "Osmanthus": { name: "Osmanthus", primary: "#FF9800", secondary: "#FFB74D", accent: "#F57C00", bg_light: "linear-gradient(135deg, #fff3e0 0%, #fffaf5 50%, #fff3e0 100%)", bg_dark: "linear-gradient(135deg, #1f140a 0%, #332014 50%, #1f140a 100%)", icon: "🟡" },
  "Wisteria": { name: "Wisteria", primary: "#9C27B0", secondary: "#BA68C8", accent: "#7B1FA2", bg_light: "linear-gradient(135deg, #f3e5f5 0%, #faf5ff 50%, #f3e5f5 100%)", bg_dark: "linear-gradient(135deg, #1a0d1f 0%, #2d1a33 50%, #1a0d1f 100%)", icon: "💜" },
  "Narcissus": { name: "Narcissus", primary: "#FFEB3B", secondary: "#FFF59D", accent: "#F9A825", bg_light: "linear-gradient(135deg, #fffde7 0%, #fffff5 50%, #fffde7 100%)", bg_dark: "linear-gradient(135deg, #1f1f0a 0%, #33330d 50%, #1f1f0a 100%)", icon: "🌼" },
  "Azalea": { name: "Azalea", primary: "#E91E63", secondary: "#F06292", accent: "#C2185B", bg_light: "linear-gradient(135deg, #fce4ec 0%, #fff 50%, #fce4ec 100%)", bg_dark: "linear-gradient(135deg, #1f0e13 0%, #2d1a20 50%, #1f0e13 100%)", icon: "🌸" },
  "Hibiscus": { name: "Hibiscus", primary: "#FF5722", secondary: "#FF8A65", accent: "#E64A19", bg_light: "linear-gradient(135deg, #fbe9e7 0%, #fff 50%, #fbe9e7 100%)", bg_dark: "linear-gradient(135deg, #1f0e0a 0%, #331814 50%, #1f0e0a 100%)", icon: "🌺" }
};

export const TRANSLATIONS: Record<Language, Translation> = {
  [Language.ZH_TW]: {
    title: "🌸 TFDA Agentic AI代理人輔助審查系統",
    subtitle: "智慧文件分析與資料提取 AI 代理人平台",
    theme_selector: "選擇花卉主題",
    language: "語言",
    dark_mode: "深色模式",
    upload_tab: "1) 上傳與OCR",
    preview_tab: "2) 預覽與編輯",
    config_tab: "3) 代理設定",
    execute_tab: "4) 執行",
    dashboard_tab: "5) 儀表板",
    notes_tab: "6) 審查筆記",
    advanced_tab: "7) 進階比較",
    upload_pdf: "上傳 PDF 檔案",
    start_ocr: "開始 OCR",
    providers: "API 供應商",
    api_key_placeholder: "輸入 Gemini API Key",
  },
  [Language.EN]: {
    title: "🌸 TFDA Agentic AI Assistance Review System",
    subtitle: "Intelligent Document Analysis & Data Extraction AI Agent Platform",
    theme_selector: "Select Floral Theme",
    language: "Language",
    dark_mode: "Dark Mode",
    upload_tab: "1) Upload & OCR",
    preview_tab: "2) Preview & Edit",
    config_tab: "3) Agent Config",
    execute_tab: "4) Execute",
    dashboard_tab: "5) Dashboard",
    notes_tab: "6) Review Notes",
    advanced_tab: "7) Agent Compare",
    upload_pdf: "Upload PDF File",
    start_ocr: "Start OCR",
    providers: "API Providers",
    api_key_placeholder: "Enter Gemini API Key",
  }
};

export const DEFAULT_AGENTS: AgentConfig[] = [
  {
    id: "1",
    name: "申請資料重點分析與摘要專家",
    description: "申請資料重點分析與摘要專家",
    system_prompt: "你是一位醫療器材法規專家。根據提供的文件，進行繁體中文摘要in markdown in traditional chinese with keywords in coral color. Please also create a table include 20 key items。\n- 識別：廠商名稱、地址、品名、類別、證書編號、日期、機構 \n- 標註不確定項目，保留原文引用 \n- 以結構化格式輸出（表格或JSON）",
    user_prompt: "你是一位醫療器材法規專家。根據提供的文件，進行繁體中文摘要in markdown in traditional chinese with keywords in coral color. Please also create a table include 20 key items。",
    model: "gemini-2.5-flash",
    temperature: 0,
    top_p: 0.9,
    max_tokens: 3000
  },
  {
    id: "2",
    name: "合約資料分析師",
    description: "合約資料分析師",
    system_prompt: "合約資料分析師，請確認合約中包含以下內容，請摘要合約內容。\n- 委託者及受託者之名稱及地址\n- 託製造之合意\n- 委託製造之醫療器材分類分級品項\n- 委託製造之製程\n- 委託者及受託者之權利義務",
    user_prompt: "請確認合約中包含以下內容，請摘要合約內容 in markdown in traditional chinese with keywords in coral color",
    model: "gemini-2.5-flash",
    temperature: 0,
    top_p: 0.9,
    max_tokens: 3200
  },
  {
    id: "3",
    name: "醫療器材委託製造合約審查專家",
    description: "醫療器材委託製造合約審查專家",
    system_prompt: "醫療器材合約審查專家，請確認合約資料是否包含以下審查重點內容，並提供綜合審查建議。",
    user_prompt: "請確認合約資料是否包含以下審查重點內容，並提供綜合審查建議。若目前提供的資料不足以判定是否符合規定，請告訴使用者應該進一步提供或確認那些資訊。",
    model: "gemini-2.5-flash",
    temperature: 0.3,
    top_p: 0.9,
    max_tokens: 1500
  },
  {
    id: "4",
    name: "仿單變更比對器",
    description: "比對仿單版本差異，識別重要變更",
    system_prompt: "你是法規文件比對專家。\n- 識別新舊版本差異（新增、刪除、修改）\n- 標註重要安全性變更\n- 以對照表呈現差異",
    user_prompt: "請比對以下文件的版本差異：",
    model: "gemini-2.5-flash-lite",
    temperature: 0.2,
    top_p: 0.9,
    max_tokens: 1200
  },
  {
    id: "5",
    name: "綜合報告生成器",
    description: "整合所有分析結果生成完整報告",
    system_prompt: "你是文件整合專家。\n- 彙整：前述所有代理的分析結果\n- 生成：結構化完整報告\n- 標註：重點發現、風險警示、建議事項\n- 以專業格式輸出（含目錄、章節）",
    user_prompt: "請整合以下所有分析結果生成綜合報告：",
    model: "gemini-2.5-flash",
    temperature: 0.4,
    top_p: 0.95,
    max_tokens: 2000
  }
];