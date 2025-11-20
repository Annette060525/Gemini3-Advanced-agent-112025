export enum Language {
  ZH_TW = 'zh_TW',
  EN = 'en'
}

export interface Theme {
  name: string;
  primary: string;
  secondary: string;
  accent: string;
  bg_light: string;
  bg_dark: string;
  icon: string;
}

export interface AgentConfig {
  id: string;
  name: string;
  description: string;
  system_prompt: string;
  user_prompt: string;
  model: string;
  temperature: number;
  top_p: number;
  max_tokens: number;
}

export interface AgentOutput {
  agentId: string;
  input: string;
  output: string;
  time: number;
  tokens: number;
  model: string;
}

export interface RunMetric {
  agent: string;
  latency: number;
  tokens: number;
  model: string;
}

export type ModelType = 
  | 'gemini-2.5-flash'
  | 'gemini-2.5-flash-lite'
  | 'gemini-2.0-flash'
  | 'gemini-1.5-flash';

export interface Translation {
  title: string;
  subtitle: string;
  theme_selector: string;
  language: string;
  dark_mode: string;
  upload_tab: string;
  preview_tab: string;
  config_tab: string;
  execute_tab: string;
  dashboard_tab: string;
  notes_tab: string;
  advanced_tab: string;
  upload_pdf: string;
  start_ocr: string;
  providers: string;
  api_key_placeholder: string;
}