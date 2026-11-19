import type { SceneType, TransitionType } from "./project";

// ─── DESIGN TOKENS ─────────────────────────────────────────────

export interface ColorTokens {
  background: string;
  surface: string;
  surfaceElevated: string;
  textPrimary: string;
  textSecondary: string;
  textMuted: string;
  accent: string;
  accentMuted: string;
  border: string;
  captionBg: string;
  codeBg: string;
  codeSurface: string;
}

export interface TypographyTokens {
  headingFont: string;
  bodyFont: string;
  monoFont: string;
  captionFont: string;
  sizes: {
    h1: string;
    h2: string;
    h3: string;
    body: string;
    caption: string;
    small: string;
    code: string;
  };
  weights: {
    heading: number;
    body: number;
    caption: number;
    mono: number;
  };
  lineHeights: {
    tight: number;
    normal: number;
    relaxed: number;
  };
  letterSpacing: {
    tight: string;
    normal: string;
    wide: string;
  };
}

export interface SpacingTokens {
  scenePaddingX: string;
  scenePaddingY: string;
  elementGap: string;
  borderRadius: string;
  borderRadiusLarge: string;
}

export interface MotionTokens {
  defaultDuration: number;
  easing: string;
  entranceDelay: number;
  staggerDelay: number;
}

export interface DesignTokens {
  colors: ColorTokens;
  typography: TypographyTokens;
  spacing: SpacingTokens;
  motion: MotionTokens;
}

// ─── COMPONENT STYLES ──────────────────────────────────────────

export interface TitleCardStyle {
  titleAlign: "center" | "left";
  subtitleAlign: "center" | "left";
  showAccentLine: boolean;
  accentLineWidth: string;
  accentLineHeight: string;
  titleSize: "h1" | "h2";
  subtitleSize: "h3" | "body";
}

export interface TextOverlayStyle {
  textAlign: "center" | "left" | "right";
  maxWidth: string;
  showAccentLine: boolean;
  textSize: "h1" | "h2" | "h3" | "body";
}

export interface CarouselStyle {
  bulletStyle: "dot" | "dash" | "number";
  bulletColor: "accent" | "primary" | "muted";
  titleAlign: "left" | "center";
  itemSpacing: string;
}

export interface DiagramStyle {
  background: "transparent" | "surface" | "solid";
  border: boolean;
  scale: number;
  padding: string;
}

export interface CodeStyle {
  showWindowControls: boolean;
  windowControlsStyle: "mac" | "minimal";
  lineNumbers: boolean;
  padding: string;
  borderRadius: string;
  fontSize: string;
}

export interface StockStyle {
  overlayOpacity: number;
  overlayGradient: "bottom" | "full" | "none";
  textShadow: boolean;
  textPosition: "center" | "bottom" | "top";
}

export interface ComponentStyles {
  title_card: TitleCardStyle;
  text_overlay: TextOverlayStyle;
  carousel: CarouselStyle;
  diagram: DiagramStyle;
  code_walkthrough: CodeStyle;
  stock_footage: StockStyle;
}

// ─── CAPTION STYLE ─────────────────────────────────────────────

export interface CaptionStyleConfig {
  position: "bottom" | "top" | "center";
  background: "gradient" | "solid" | "none";
  wordHighlight: "glow" | "background" | "color";
  fontSize: string;
  maxWidth: string;
  padding: string;
  wordSpacing: string;
}

// ─── TEMPLATE ──────────────────────────────────────────────────

export interface SceneTypeConfig {
  enabled: boolean;
  defaultLayout: string;
  defaultLayers: Array<{
    type: "background" | "content" | "caption" | "overlay" | "media";
    defaultVisuals: Record<string, unknown>;
  }>;
}

export interface VideoTemplate {
  id: string;
  name: string;
  description: string;
  tokens: DesignTokens;
  componentStyles: ComponentStyles;
  defaultTransitions: {
    in: TransitionType;
    out: TransitionType;
  };
  captionStyle: CaptionStyleConfig;
  availableSceneTypes: SceneType[];
  sceneTypeDefaults: Partial<Record<SceneType, SceneTypeConfig>>;
  previewColors: string[];
}

// ─── DEFAULT TEMPLATE: Clean Minimal Cinematic ─────────────────

export const DEFAULT_TEMPLATE: VideoTemplate = {
  id: "clean-minimal-cinematic",
  name: "Clean Minimal Cinematic",
  description: "Ultra-dark background with bold editorial typography, subtle geometric accents, and restrained smooth motion. Inspired by premium documentary and explainer content.",
  tokens: {
    colors: {
      background: "#050505",
      surface: "#0a0a0a",
      surfaceElevated: "#111111",
      textPrimary: "#fafafa",
      textSecondary: "#a1a1aa",
      textMuted: "#52525b",
      accent: "#e4e4e7",
      accentMuted: "#71717a",
      border: "#27272a",
      captionBg: "rgba(0,0,0,0.85)",
      codeBg: "#09090b",
      codeSurface: "#111111",
    },
    typography: {
      headingFont: '-apple-system, BlinkMacSystemFont, "SF Pro Display", "Helvetica Neue", Helvetica, Arial, sans-serif',
      bodyFont: '-apple-system, BlinkMacSystemFont, "SF Pro Text", "Helvetica Neue", Helvetica, Arial, sans-serif',
      monoFont: '"SF Mono", SFMono-Regular, ui-monospace, Menlo, Consolas, monospace',
      captionFont: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif',
      sizes: {
        h1: "96px",
        h2: "56px",
        h3: "40px",
        body: "32px",
        caption: "34px",
        small: "14px",
        code: "22px",
      },
      weights: {
        heading: 800,
        body: 500,
        caption: 600,
        mono: 400,
      },
      lineHeights: {
        tight: 1.05,
        normal: 1.3,
        relaxed: 1.5,
      },
      letterSpacing: {
        tight: "-0.03em",
        normal: "-0.01em",
        wide: "0.02em",
      },
    },
    spacing: {
      scenePaddingX: "140px",
      scenePaddingY: "100px",
      elementGap: "32px",
      borderRadius: "12px",
      borderRadiusLarge: "16px",
    },
    motion: {
      defaultDuration: 0.8,
      easing: "cubic-bezier(0.22, 1, 0.36, 1)",
      entranceDelay: 0.2,
      staggerDelay: 0.12,
    },
  },
  componentStyles: {
    title_card: {
      titleAlign: "center",
      subtitleAlign: "center",
      showAccentLine: true,
      accentLineWidth: "80px",
      accentLineHeight: "4px",
      titleSize: "h1",
      subtitleSize: "h3",
    },
    text_overlay: {
      textAlign: "left",
      maxWidth: "1300px",
      showAccentLine: false,
      textSize: "h2",
    },
    carousel: {
      bulletStyle: "dot",
      bulletColor: "muted",
      titleAlign: "left",
      itemSpacing: "20px",
    },
    diagram: {
      background: "transparent",
      border: false,
      scale: 1.4,
      padding: "40px",
    },
    code_walkthrough: {
      showWindowControls: true,
      windowControlsStyle: "mac",
      lineNumbers: false,
      padding: "32px",
      borderRadius: "16px",
      fontSize: "22px",
    },
    stock_footage: {
      overlayOpacity: 0.75,
      overlayGradient: "bottom",
      textShadow: true,
      textPosition: "center",
    },
  },
  defaultTransitions: {
    in: "fade_from_black",
    out: "crossfade",
  },
  captionStyle: {
    position: "bottom",
    background: "gradient",
    wordHighlight: "glow",
    fontSize: "34px",
    maxWidth: "1600px",
    padding: "50px 160px 70px",
    wordSpacing: "3px",
  },
  availableSceneTypes: [
    "title_card",
    "text_overlay",
    "carousel",
    "diagram",
    "code_walkthrough",
    "stock_footage",
    "simulation_3d",
  ],
  sceneTypeDefaults: {
    title_card: {
      enabled: true,
      defaultLayout: "centered",
      defaultLayers: [
        { type: "background", defaultVisuals: { kind: "gradient", from: "#050505", to: "#0a0a0a", angle: 135 } },
        { type: "content", defaultVisuals: { kind: "text", text: "", align: "center", size: "xl", style: "heading" } },
        { type: "caption", defaultVisuals: { kind: "caption" } },
      ],
    },
    text_overlay: {
      enabled: true,
      defaultLayout: "left-aligned",
      defaultLayers: [
        { type: "background", defaultVisuals: { kind: "gradient", from: "#050505", to: "#0a0a0a", angle: 135 } },
        { type: "content", defaultVisuals: { kind: "text", text: "", align: "left", size: "lg", style: "heading" } },
        { type: "caption", defaultVisuals: { kind: "caption" } },
      ],
    },
    carousel: {
      enabled: true,
      defaultLayout: "bullet-list",
      defaultLayers: [
        { type: "background", defaultVisuals: { kind: "solid", color: "#050505" } },
        { type: "content", defaultVisuals: { kind: "carousel", slides: [{ title: "", bullets: [] }] } },
        { type: "caption", defaultVisuals: { kind: "caption" } },
      ],
    },
    diagram: {
      enabled: true,
      defaultLayout: "centered",
      defaultLayers: [
        { type: "background", defaultVisuals: { kind: "solid", color: "#050505" } },
        { type: "content", defaultVisuals: { kind: "diagram", engine: "mermaid", source: "" } },
        { type: "caption", defaultVisuals: { kind: "caption" } },
      ],
    },
    code_walkthrough: {
      enabled: true,
      defaultLayout: "windowed",
      defaultLayers: [
        { type: "background", defaultVisuals: { kind: "solid", color: "#050505" } },
        { type: "content", defaultVisuals: { kind: "code", language: "python", source: "" } },
        { type: "caption", defaultVisuals: { kind: "caption" } },
      ],
    },
    stock_footage: {
      enabled: true,
      defaultLayout: "full-bleed",
      defaultLayers: [
        { type: "media", defaultVisuals: { kind: "image", src: "", objectFit: "cover" } },
        { type: "overlay", defaultVisuals: { kind: "shape", shape: "rect", color: "#000000", opacity: 0.6 } },
        { type: "content", defaultVisuals: { kind: "text", text: "", align: "center", size: "lg", style: "heading" } },
        { type: "caption", defaultVisuals: { kind: "caption" } },
      ],
    },
    simulation_3d: {
      enabled: true,
      defaultLayout: "centered",
      defaultLayers: [
        { type: "background", defaultVisuals: { kind: "solid", color: "#050505" } },
        { type: "content", defaultVisuals: { kind: "text", text: "3D Simulation", align: "center", size: "lg", style: "heading" } },
        { type: "caption", defaultVisuals: { kind: "caption" } },
      ],
    },
  },
  previewColors: ["#050505", "#fafafa", "#a1a1aa", "#27272a"],
};

// ─── TEMPLATE REGISTRY ─────────────────────────────────────────

export const BUILT_IN_TEMPLATES: VideoTemplate[] = [DEFAULT_TEMPLATE];

export function getTemplateById(id: string): VideoTemplate | undefined {
  return BUILT_IN_TEMPLATES.find((t) => t.id === id);
}

export function getAllTemplates(): VideoTemplate[] {
  return BUILT_IN_TEMPLATES;
}
