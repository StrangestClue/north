import { v4 as uuidv4 } from "uuid";
import type {
  Scene,
  Layer,
  SceneType,
  SceneVisuals,
  TitleCardVisuals,
  TextOverlayVisuals,
  CarouselVisuals,
  DiagramVisuals,
  CodeWalkthroughVisuals,
  StockFootageVisuals,
} from "@/types/project";

export function visualsToLayers(type: SceneType, visuals: SceneVisuals): Layer[] {
  const baseLayers: Layer[] = [];

  switch (type) {
    case "title_card": {
      const v = visuals as TitleCardVisuals;
      baseLayers.push(
        { id: uuidv4(), name: "Background", type: "background", zIndex: 0, startTime: 0, duration: 0, visuals: { kind: "gradient", from: "#050505", to: "#0a0a0a", angle: 135 } },
        { id: uuidv4(), name: "Accent Line", type: "overlay", zIndex: 5, startTime: 0, duration: 0, visuals: { kind: "shape", shape: "line", color: "#fafafa", opacity: 1, width: 80, height: 4 } },
        { id: uuidv4(), name: "Title", type: "content", zIndex: 10, startTime: 0, duration: 0, visuals: { kind: "text", text: v.title || "", align: "center", size: "xl", style: "heading" } },
      );
      if (v.subtitle) {
        baseLayers.push({ id: uuidv4(), name: "Subtitle", type: "content", zIndex: 11, startTime: 0.3, duration: 0, visuals: { kind: "text", text: v.subtitle, align: "center", size: "md", style: "body" } });
      }
      break;
    }
    case "text_overlay": {
      const v = visuals as TextOverlayVisuals;
      baseLayers.push(
        { id: uuidv4(), name: "Background", type: "background", zIndex: 0, startTime: 0, duration: 0, visuals: { kind: "gradient", from: "#050505", to: "#0a0a0a", angle: 135 } },
        { id: uuidv4(), name: "Text", type: "content", zIndex: 10, startTime: 0, duration: 0, visuals: { kind: "text", text: v.text || "", align: v.position === "center" ? "center" : "left", size: "lg", style: "heading" } },
      );
      break;
    }
    case "carousel": {
      const v = visuals as CarouselVisuals;
      baseLayers.push(
        { id: uuidv4(), name: "Background", type: "background", zIndex: 0, startTime: 0, duration: 0, visuals: { kind: "solid", color: "#050505" } },
        { id: uuidv4(), name: "Accent Line", type: "overlay", zIndex: 5, startTime: 0, duration: 0, visuals: { kind: "shape", shape: "line", color: "#fafafa", opacity: 1, width: 80, height: 4 } },
        { id: uuidv4(), name: "Carousel", type: "content", zIndex: 10, startTime: 0, duration: 0, visuals: { kind: "carousel", slides: v.slides || [] } },
      );
      break;
    }
    case "diagram": {
      const v = visuals as DiagramVisuals;
      baseLayers.push(
        { id: uuidv4(), name: "Background", type: "background", zIndex: 0, startTime: 0, duration: 0, visuals: { kind: "solid", color: "#050505" } },
        { id: uuidv4(), name: "Diagram", type: "content", zIndex: 10, startTime: 0, duration: 0, visuals: { kind: "diagram", engine: v.engine, source: v.source } },
      );
      break;
    }
    case "code_walkthrough": {
      const v = visuals as CodeWalkthroughVisuals;
      baseLayers.push(
        { id: uuidv4(), name: "Background", type: "background", zIndex: 0, startTime: 0, duration: 0, visuals: { kind: "solid", color: "#050505" } },
        { id: uuidv4(), name: "Code", type: "content", zIndex: 10, startTime: 0, duration: 0, visuals: { kind: "code", language: v.language, source: v.source } },
      );
      break;
    }
    case "stock_footage": {
      const v = visuals as StockFootageVisuals;
      baseLayers.push(
        { id: uuidv4(), name: "Media", type: "media", zIndex: 0, startTime: 0, duration: 0, visuals: v.mediaUrl ? { kind: "image", src: v.mediaUrl, objectFit: "cover" } : { kind: "gradient", from: "#0a0a0a", to: "#18181b", angle: 135 } },
        { id: uuidv4(), name: "Overlay", type: "overlay", zIndex: 5, startTime: 0, duration: 0, visuals: { kind: "shape", shape: "rect", color: "#000000", opacity: 0.6 } },
      );
      if (v.overlay_text) {
        baseLayers.push({ id: uuidv4(), name: "Overlay Text", type: "content", zIndex: 10, startTime: 0, duration: 0, visuals: { kind: "text", text: v.overlay_text, align: "center", size: "lg", style: "heading" } });
      }
      break;
    }
    case "simulation_3d": {
      baseLayers.push(
        { id: uuidv4(), name: "Background", type: "background", zIndex: 0, startTime: 0, duration: 0, visuals: { kind: "solid", color: "#050505" } },
        { id: uuidv4(), name: "Content", type: "content", zIndex: 10, startTime: 0, duration: 0, visuals: { kind: "text", text: "3D Simulation", align: "center", size: "lg", style: "heading" } },
      );
      break;
    }
  }

  // Always add caption layer
  baseLayers.push({ id: uuidv4(), name: "Caption", type: "caption", zIndex: 50, startTime: 0, duration: 0, visuals: { kind: "caption" } });

  return baseLayers;
}

export function getDefaultLayersForSceneType(type: SceneType): Layer[] {
  switch (type) {
    case "title_card":
      return [
        { id: uuidv4(), name: "Background", type: "background", zIndex: 0, startTime: 0, duration: 0, visuals: { kind: "gradient", from: "#050505", to: "#0a0a0a", angle: 135 } },
        { id: uuidv4(), name: "Title", type: "content", zIndex: 10, startTime: 0, duration: 0, visuals: { kind: "text", text: "", align: "center", size: "xl", style: "heading" } },
        { id: uuidv4(), name: "Caption", type: "caption", zIndex: 50, startTime: 0, duration: 0, visuals: { kind: "caption" } },
      ];
    case "text_overlay":
      return [
        { id: uuidv4(), name: "Background", type: "background", zIndex: 0, startTime: 0, duration: 0, visuals: { kind: "gradient", from: "#050505", to: "#0a0a0a", angle: 135 } },
        { id: uuidv4(), name: "Text", type: "content", zIndex: 10, startTime: 0, duration: 0, visuals: { kind: "text", text: "", align: "left", size: "lg", style: "heading" } },
        { id: uuidv4(), name: "Caption", type: "caption", zIndex: 50, startTime: 0, duration: 0, visuals: { kind: "caption" } },
      ];
    case "carousel":
      return [
        { id: uuidv4(), name: "Background", type: "background", zIndex: 0, startTime: 0, duration: 0, visuals: { kind: "solid", color: "#050505" } },
        { id: uuidv4(), name: "Carousel", type: "content", zIndex: 10, startTime: 0, duration: 0, visuals: { kind: "carousel", slides: [{ title: "", bullets: [] }] } },
        { id: uuidv4(), name: "Caption", type: "caption", zIndex: 50, startTime: 0, duration: 0, visuals: { kind: "caption" } },
      ];
    case "diagram":
      return [
        { id: uuidv4(), name: "Background", type: "background", zIndex: 0, startTime: 0, duration: 0, visuals: { kind: "solid", color: "#050505" } },
        { id: uuidv4(), name: "Diagram", type: "content", zIndex: 10, startTime: 0, duration: 0, visuals: { kind: "diagram", engine: "mermaid", source: "" } },
        { id: uuidv4(), name: "Caption", type: "caption", zIndex: 50, startTime: 0, duration: 0, visuals: { kind: "caption" } },
      ];
    case "code_walkthrough":
      return [
        { id: uuidv4(), name: "Background", type: "background", zIndex: 0, startTime: 0, duration: 0, visuals: { kind: "solid", color: "#050505" } },
        { id: uuidv4(), name: "Code", type: "content", zIndex: 10, startTime: 0, duration: 0, visuals: { kind: "code", language: "python", source: "" } },
        { id: uuidv4(), name: "Caption", type: "caption", zIndex: 50, startTime: 0, duration: 0, visuals: { kind: "caption" } },
      ];
    case "stock_footage":
      return [
        { id: uuidv4(), name: "Media", type: "media", zIndex: 0, startTime: 0, duration: 0, visuals: { kind: "gradient", from: "#0a0a0a", to: "#18181b", angle: 135 } },
        { id: uuidv4(), name: "Overlay", type: "overlay", zIndex: 5, startTime: 0, duration: 0, visuals: { kind: "shape", shape: "rect", color: "#000000", opacity: 0.6 } },
        { id: uuidv4(), name: "Caption", type: "caption", zIndex: 50, startTime: 0, duration: 0, visuals: { kind: "caption" } },
      ];
    case "simulation_3d":
      return [
        { id: uuidv4(), name: "Background", type: "background", zIndex: 0, startTime: 0, duration: 0, visuals: { kind: "solid", color: "#050505" } },
        { id: uuidv4(), name: "Content", type: "content", zIndex: 10, startTime: 0, duration: 0, visuals: { kind: "text", text: "3D Simulation", align: "center", size: "lg", style: "heading" } },
        { id: uuidv4(), name: "Caption", type: "caption", zIndex: 50, startTime: 0, duration: 0, visuals: { kind: "caption" } },
      ];
  }
}
