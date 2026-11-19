export type PipelineStatus =
  | "idle"
  | "starting"
  | "generating_script"
  | "generating_tts"
  | "rendering_frames"
  | "composing"
  | "complete"
  | "error";

export interface ProgressUpdate {
  status: PipelineStatus;
  message: string;
  progress: number;
  sceneIndex?: number;
  totalScenes?: number;
  error?: string;
}
