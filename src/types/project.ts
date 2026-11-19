export type TransitionType =
  | "fade_from_black"
  | "crossfade"
  | "slide_left"
  | "slide_right"
  | "wipe"
  | "none";

export interface TitleCardVisuals {
  title: string;
  subtitle?: string;
  background?: string;
}

export interface CarouselSlide {
  title: string;
  bullets: string[];
}

export interface CarouselVisuals {
  slides: CarouselSlide[];
}

export interface DiagramVisuals {
  engine: "mermaid";
  source: string;
  animate?: boolean;
}

export interface CodeWalkthroughVisuals {
  engine: "code_highlight";
  language: string;
  source: string;
  highlight_lines?: number[];
  typewriter?: boolean;
}

export interface Simulation3DVisuals {
  engine: "threejs" | "motion_canvas";
  scene: string;
  camera_path?: string;
}

export interface StockFootageVisuals {
  engine: "pexels" | "pixabay";
  query: string;
  overlay_text?: string;
  mediaUrl?: string;
  mediaType?: "video" | "image";
  thumbnail?: string;
  duration?: number;
}

export interface TextOverlayVisuals {
  text: string;
  style?: "kinetic" | "static" | "fade";
  position?: "center" | "top" | "bottom";
}

export type SceneVisuals =
  | TitleCardVisuals
  | CarouselVisuals
  | DiagramVisuals
  | CodeWalkthroughVisuals
  | Simulation3DVisuals
  | StockFootageVisuals
  | TextOverlayVisuals;

// ─── LAYER SYSTEM ──────────────────────────────────────────────

export type LayerType = "background" | "content" | "caption" | "overlay" | "media";

export interface LayerAnimation {
  type: "fade" | "slideUp" | "slideDown" | "slideLeft" | "slideRight" | "scale" | "none";
  duration: number;
  delay: number;
}

export interface Layer {
  id: string;
  name: string;
  type: LayerType;
  zIndex: number;
  startTime: number;
  duration: number;
  visuals: LayerVisuals;
  animationIn?: LayerAnimation;
  animationOut?: LayerAnimation;
}

export type LayerVisuals =
  | { kind: "solid"; color: string }
  | { kind: "gradient"; from: string; to: string; angle: number }
  | { kind: "text"; text: string; align: "left" | "center" | "right"; size?: "sm" | "md" | "lg" | "xl"; style?: "heading" | "body" | "caption" }
  | { kind: "image"; src: string; objectFit: "cover" | "contain" }
  | { kind: "video"; src: string; loop: boolean }
  | { kind: "code"; language: string; source: string }
  | { kind: "diagram"; engine: "mermaid"; source: string }
  | { kind: "carousel"; slides: CarouselSlide[] }
  | { kind: "shape"; shape: "line" | "circle" | "rect"; color: string; opacity: number; width?: number; height?: number }
  | { kind: "caption" };

// ─── SCENE ─────────────────────────────────────────────────────

export type SceneType =
  | "title_card"
  | "carousel"
  | "diagram"
  | "code_walkthrough"
  | "simulation_3d"
  | "stock_footage"
  | "text_overlay";

export interface Scene {
  id: string;
  type: SceneType;
  narration: string;
  duration: number | null;
  visuals: SceneVisuals;
  layers: Layer[];
  transition_in: TransitionType;
  transition_out: TransitionType;
  order: number;
}

// ─── PROJECT ───────────────────────────────────────────────────

export interface BackgroundMusic {
  trackId: string;
  volume: number;
  ducking: boolean;
  duckingRatio: number;
  normalRatio: number;
}

export interface Project {
  id: string;
  title: string;
  createdAt: string;
  updatedAt: string;
  scenes: Scene[];
  status: "draft" | "generating" | "complete" | "error";
  templateId: string | null;
  backgroundMusic: BackgroundMusic | null;
  selectedModel: string | null;
}

export interface MusicTrack {
  id: string;
  filename: string;
  originalName: string;
  format: string;
  duration: number;
  size: number;
  addedAt: string;
}

export interface MusicLibrary {
  tracks: MusicTrack[];
}

// ─── CONSTANTS ─────────────────────────────────────────────────

export const SCENE_TYPE_LABELS: Record<SceneType, string> = {
  title_card: "Title Card",
  carousel: "Carousel",
  diagram: "Diagram",
  code_walkthrough: "Code Walkthrough",
  simulation_3d: "3D Simulation",
  stock_footage: "Stock Footage",
  text_overlay: "Text Overlay",
};

export const TRANSITION_LABELS: Record<TransitionType, string> = {
  fade_from_black: "Fade from Black",
  crossfade: "Crossfade",
  slide_left: "Slide Left",
  slide_right: "Slide Right",
  wipe: "Wipe",
  none: "None",
};

export const LAYER_TYPE_LABELS: Record<LayerType, string> = {
  background: "Background",
  content: "Content",
  caption: "Caption",
  overlay: "Overlay",
  media: "Media",
};
