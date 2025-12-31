
export type Language = 'Português' | 'English' | 'Español';

export interface VoiceOption {
  id: string;
  name: string;
  style: string;
}

export interface ScriptBlock {
  part: number;
  text: string;
}

export interface ProductionData {
  reworkedScript: ScriptBlock[];
  titles: string[];
  description: string;
  tags: string[];
}

export enum Step {
  CONFIG = 'config',
  INPUT = 'input',
  PROCESSING = 'processing',
  RESULT = 'result'
}
