import puppeteer from "puppeteer";
import { mkdir } from "fs/promises";
import path from "path";
import type { Scene, Layer, TransitionType, SceneType } from "@/types/project";
import type { VideoTemplate, DesignTokens, ComponentStyles } from "@/types/template";
import type { WordTiming } from "./tts-engine";

export interface RenderResult {
  framesDir: string;
  frameCount: number;
}

export interface LayerRenderResult {
  layerId: string;
  framesDir: string;
  frameCount: number;
  zIndex: number;
  isTransparent: boolean;
}

// ─── CSS VARIABLE GENERATION ───────────────────────────────────

function generateCSSVariables(tokens: DesignTokens): string {
  const { colors, typography, spacing, motion } = tokens;
  return `
    :root {
      /* Colors */
      --color-bg: ${colors.background};
      --color-surface: ${colors.surface};
      --color-surface-elevated: ${colors.surfaceElevated};
      --color-text-primary: ${colors.textPrimary};
      --color-text-secondary: ${colors.textSecondary};
      --color-text-muted: ${colors.textMuted};
      --color-accent: ${colors.accent};
      --color-accent-muted: ${colors.accentMuted};
      --color-border: ${colors.border};
      --color-caption-bg: ${colors.captionBg};
      --color-code-bg: ${colors.codeBg};
      --color-code-surface: ${colors.codeSurface};

      /* Typography */
      --font-heading: ${typography.headingFont};
      --font-body: ${typography.bodyFont};
      --font-mono: ${typography.monoFont};
      --font-caption: ${typography.captionFont};
      --size-h1: ${typography.sizes.h1};
      --size-h2: ${typography.sizes.h2};
      --size-h3: ${typography.sizes.h3};
      --size-body: ${typography.sizes.body};
      --size-caption: ${typography.sizes.caption};
      --size-small: ${typography.sizes.small};
      --size-code: ${typography.sizes.code};
      --weight-heading: ${typography.weights.heading};
      --weight-body: ${typography.weights.body};
      --weight-caption: ${typography.weights.caption};
      --weight-mono: ${typography.weights.mono};
      --leading-tight: ${typography.lineHeights.tight};
      --leading-normal: ${typography.lineHeights.normal};
      --leading-relaxed: ${typography.lineHeights.relaxed};
      --tracking-tight: ${typography.letterSpacing.tight};
      --tracking-normal: ${typography.letterSpacing.normal};
      --tracking-wide: ${typography.letterSpacing.wide};

      /* Spacing */
      --pad-x: ${spacing.scenePaddingX};
      --pad-y: ${spacing.scenePaddingY};
      --gap: ${spacing.elementGap};
      --radius: ${spacing.borderRadius};
      --radius-lg: ${spacing.borderRadiusLarge};

      /* Motion */
      --motion-duration: ${motion.defaultDuration}s;
      --motion-easing: ${motion.easing};
      --motion-entrance-delay: ${motion.entranceDelay}s;
      --motion-stagger: ${motion.staggerDelay}s;
    }
  `;
}

function generateBaseStyles(tokens: DesignTokens, captionStyleConfig: VideoTemplate["captionStyle"], wordTimingsJson: string): string {
  const cssVars = generateCSSVariables(tokens);
  const cs = captionStyleConfig;

  const bgGradient = cs.background === "gradient"
    ? "linear-gradient(to top, rgba(0,0,0,0.9) 0%, rgba(0,0,0,0.6) 50%, transparent 100%)"
    : cs.background === "solid"
      ? "var(--color-caption-bg)"
      : "transparent";

  return `
    <style>
      ${cssVars}
      * { margin: 0; padding: 0; box-sizing: border-box; }
      body {
        width: 1920px;
        height: 1080px;
        font-family: var(--font-body);
        -webkit-font-smoothing: antialiased;
        -moz-osx-font-smoothing: grayscale;
        text-rendering: optimizeLegibility;
        background: var(--color-bg);
        color: var(--color-text-primary);
        overflow: hidden;
        position: relative;
      }
      body::before {
        content: '';
        position: absolute;
        top: -50%; left: -50%;
        width: 200%; height: 200%;
        background: radial-gradient(ellipse at 30% 20%, rgba(63,63,70,0.15) 0%, transparent 50%),
                    radial-gradient(ellipse at 70% 80%, rgba(39,39,42,0.1) 0%, transparent 50%);
        z-index: 0;
        pointer-events: none;
      }
      .scene-wrapper {
        width: 100%; height: 100%;
        display: flex; flex-direction: column;
        align-items: center; justify-content: center;
        padding: var(--pad-y) var(--pad-x);
        position: relative;
        z-index: 1;
      }

      @keyframes fadeIn {
        from { opacity: 0; } to { opacity: 1; }
      }
      @keyframes fadeInUp {
        from { opacity: 0; transform: translateY(40px); } to { opacity: 1; transform: translateY(0); }
      }
      @keyframes fadeInScale {
        from { opacity: 0; transform: scale(0.95); } to { opacity: 1; transform: scale(1); }
      }
      @keyframes slideInLeft {
        from { opacity: 0; transform: translateX(-60px); } to { opacity: 1; transform: translateX(0); }
      }
      @keyframes slideInRight {
        from { opacity: 0; transform: translateX(60px); } to { opacity: 1; transform: translateX(0); }
      }
      @keyframes gradientShift {
        0% { background-position: 0% 50%; }
        50% { background-position: 100% 50%; }
        100% { background-position: 0% 50%; }
      }

      .anim-fade-in { animation: fadeIn var(--motion-duration) var(--motion-easing) forwards; }
      .anim-fade-in-up { animation: fadeInUp calc(var(--motion-duration) * 0.875) var(--motion-easing) forwards; }
      .anim-fade-in-scale { animation: fadeInScale calc(var(--motion-duration) * 0.75) var(--motion-easing) forwards; }
      .anim-slide-left { animation: slideInLeft calc(var(--motion-duration) * 0.875) var(--motion-easing) forwards; }
      .anim-slide-right { animation: slideInRight calc(var(--motion-duration) * 0.875) var(--motion-easing) forwards; }

      .caption-overlay {
        position: absolute;
        ${cs.position === "top" ? "top: 0;" : cs.position === "bottom" ? "bottom: 0;" : "bottom: 0;"}
        left: 0; width: 100%;
        padding: ${cs.padding};
        background: ${bgGradient};
        text-align: center;
        z-index: 50;
      }
      .caption-sentence {
        font-size: var(--size-caption);
        font-weight: var(--weight-caption);
        color: rgba(255,255,255,0.45);
        line-height: var(--leading-normal);
        letter-spacing: var(--tracking-normal);
        max-width: ${cs.maxWidth};
        margin: 0 auto;
      }
      .caption-word {
        transition: color 0.08s ease, text-shadow 0.08s ease;
        padding: 0 ${cs.wordSpacing || "3px"};
      }
      .caption-word.current {
        color: #ffffff;
        font-weight: 600;
        text-shadow: 0 0 24px rgba(255,255,255,0.5), 0 0 48px rgba(255,255,255,0.2);
      }
      .caption-word.past { color: rgba(255,255,255,0.75); }
      .caption-word.future { color: rgba(255,255,255,0.3); }

      .mermaid { display: flex; justify-content: center; align-items: center; }
      .mermaid svg { max-width: 1500px; max-height: 750px; }

      .stock-bg { position: absolute; top: 0; left: 0; width: 100%; height: 100%; object-fit: cover; z-index: 1; }
      .stock-overlay { position: absolute; top: 0; left: 0; width: 100%; height: 100%; background: linear-gradient(to bottom, rgba(0,0,0,0.3) 0%, rgba(0,0,0,0.75) 100%); z-index: 2; }

      .hljs { background: transparent !important; }
      pre code.hljs { padding: 0; font-size: var(--size-code); line-height: var(--leading-relaxed); }

      .animated-bg {
        position: absolute; top: 0; left: 0; width: 100%; height: 100%;
        background: linear-gradient(135deg, #0a0a0a 0%, #18181b 25%, #27272a 50%, #18181b 75%, #0a0a0a 100%);
        background-size: 400% 400%;
        animation: gradientShift 15s ease infinite;
        z-index: 1;
      }
      .noise-overlay {
        position: absolute; top: 0; left: 0; width: 100%; height: 100%;
        opacity: 0.03;
        background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E");
        z-index: 2;
      }
    </style>
    ${generateCaptionScript(wordTimingsJson)}
  `;
}

function generateCaptionScript(wordTimingsJson: string): string {
  return `
    <script>
      window.__wordTimings = ${wordTimingsJson};
      window.__currentTime = 0;
      window.__updateCaptions = function(time) {
        window.__currentTime = time;
        const container = document.getElementById('caption-overlay');
        if (!container || !window.__wordTimings || window.__wordTimings.length === 0) return;
        container.style.display = 'block';
        const timings = window.__wordTimings;
        let html = '';
        for (let i = 0; i < timings.length; i++) {
          const w = timings[i];
          let cls = 'caption-word';
          if (time >= w.start && time < w.end) { cls += ' current'; }
          else if (time >= w.end) { cls += ' past'; }
          else { cls += ' future'; }
          html += '<span class="' + cls + '">' + w.word + '</span> ';
        }
        container.innerHTML = '<div class="caption-sentence">' + html.trim() + '</div>';
      };
    </script>
  `;
}

function getTransitionClass(transition: TransitionType): string {
  switch (transition) {
    case "fade_from_black": return "anim-fade-in";
    case "crossfade": return "anim-fade-in";
    case "slide_left": return "anim-slide-left";
    case "slide_right": return "anim-slide-right";
    default: return "anim-fade-in";
  }
}

function escapeHtml(text: string): string {
  if (!text) return "";
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

// ─── SCENE GENERATORS ──────────────────────────────────────────

function generateTitleCard(scene: Scene, cs: ComponentStyles, transitionClass: string): string {
  const style = cs.title_card;
  const visuals = scene.visuals as { title?: string; subtitle?: string };
  const accentLine = style.showAccentLine
    ? `<div style="width: ${style.accentLineWidth}; height: ${style.accentLineHeight}; background: linear-gradient(90deg, var(--color-text-primary) 0%, var(--color-text-muted) 100%); border-radius: 2px; margin-bottom: var(--gap);"></div>`
    : "";
  const align = style.titleAlign === "center" ? "center" : "left";

  return `
    <div class="scene-wrapper ${transitionClass}" style="opacity: 0; animation-delay: var(--motion-entrance-delay); text-align: ${align};">
      ${accentLine}
      <h1 style="font-size: var(--size-h1); font-weight: var(--weight-heading); letter-spacing: var(--tracking-tight); line-height: var(--leading-tight); margin-bottom: calc(var(--gap) * 0.75);">
        ${escapeHtml(visuals.title || "Title")}
      </h1>
      ${visuals.subtitle ? `<p style="font-size: var(--size-h3); color: var(--color-text-secondary); font-weight: var(--weight-body); letter-spacing: var(--tracking-normal);">${escapeHtml(visuals.subtitle)}</p>` : ""}
    </div>
    <div id="caption-overlay" class="caption-overlay" style="display: none;"></div>
  `;
}

function generateTextOverlay(scene: Scene, cs: ComponentStyles, transitionClass: string): string {
  const style = cs.text_overlay;
  const visuals = scene.visuals as { text?: string };
  const accentLine = style.showAccentLine
    ? `<div style="width: 80px; height: 4px; background: linear-gradient(90deg, var(--color-text-primary) 0%, var(--color-text-muted) 100%); border-radius: 2px; margin-bottom: var(--gap);"></div>`
    : "";

  return `
    <div class="scene-wrapper ${transitionClass}" style="opacity: 0; animation-delay: var(--motion-entrance-delay); align-items: ${style.textAlign === "center" ? "center" : "flex-start"};">
      <div style="max-width: ${style.maxWidth};">
        ${accentLine}
        <p style="font-size: var(--size-h2); font-weight: var(--weight-heading); text-align: ${style.textAlign}; line-height: var(--leading-normal); letter-spacing: var(--tracking-tight);">
          ${escapeHtml(visuals.text || "Text")}
        </p>
      </div>
    </div>
    <div id="caption-overlay" class="caption-overlay" style="display: none;"></div>
  `;
}

function generateCarousel(scene: Scene, cs: ComponentStyles, transitionClass: string): string {
  const style = cs.carousel;
  const visuals = scene.visuals as { slides?: Array<{ title: string; bullets: string[] }> };
  const slide = visuals.slides?.[0];

  const bullets = (slide?.bullets || []).map((bullet: string, i: number) => {
    const bulletColor = style.bulletColor === "accent" ? "var(--color-accent)" : style.bulletColor === "primary" ? "var(--color-text-primary)" : "var(--color-text-muted)";
    const bulletShape = style.bulletStyle === "dot"
      ? `<span style="width: 8px; height: 8px; background: ${bulletColor}; border-radius: 50%; margin-top: 14px; flex-shrink: 0;"></span>`
      : `<span style="width: 12px; height: 2px; background: ${bulletColor}; margin-top: 18px; flex-shrink: 0;"></span>`;
    return `
      <li class="anim-fade-in-up" style="opacity: 0; animation-delay: calc(var(--motion-entrance-delay) + ${i + 1} * var(--motion-stagger)); font-size: var(--size-body); margin-bottom: ${style.itemSpacing}; display: flex; align-items: flex-start; gap: 20px; line-height: var(--leading-relaxed);">
        ${bulletShape}
        <span style="color: var(--color-text-secondary);">${escapeHtml(bullet)}</span>
      </li>
    `;
  }).join("");

  const align = style.titleAlign === "center" ? "center" : "left";

  return `
    <div class="scene-wrapper ${transitionClass}" style="opacity: 0; animation-delay: var(--motion-entrance-delay); align-items: ${align === "center" ? "center" : "flex-start"}; text-align: ${align};">
      <div style="width: 80px; height: 4px; background: linear-gradient(90deg, var(--color-text-primary) 0%, var(--color-text-muted) 100%); border-radius: 2px; margin-bottom: calc(var(--gap) * 1.125);"></div>
      <h2 style="font-size: var(--size-h2); font-weight: var(--weight-heading); margin-bottom: calc(var(--gap) * 1.25); opacity: 0; animation: fadeInUp calc(var(--motion-duration) * 0.75) var(--motion-easing) forwards; animation-delay: var(--motion-entrance-delay); letter-spacing: var(--tracking-tight);">${escapeHtml(slide?.title || "")}</h2>
      <ul style="list-style: none; width: 100%; max-width: 1200px;">
        ${bullets}
      </ul>
    </div>
    <div id="caption-overlay" class="caption-overlay" style="display: none;"></div>
  `;
}

function generateDiagram(scene: Scene, cs: ComponentStyles, transitionClass: string): string {
  const style = cs.diagram;
  const visuals = scene.visuals as { source?: string };
  const source = escapeHtml(visuals.source || "graph LR\n    A[Input] --> B[Process]\n    B --> C[Output]");
  const bg = style.background === "surface" ? "var(--color-surface)" : style.background === "solid" ? "var(--color-bg)" : "transparent";
  const border = style.border ? "border: 1px solid var(--color-border);" : "";

  return `
    <div class="scene-wrapper ${transitionClass}" style="opacity: 0; animation-delay: var(--motion-entrance-delay); background: ${bg}; ${border} border-radius: var(--radius-lg); padding: ${style.padding};">
      <div class="mermaid" style="transform: scale(${style.scale});">
${source}
      </div>
    </div>
    <div id="caption-overlay" class="caption-overlay" style="display: none;"></div>
  `;
}

function generateCode(scene: Scene, cs: ComponentStyles, transitionClass: string): string {
  const style = cs.code_walkthrough;
  const visuals = scene.visuals as { language?: string; source?: string };
  const code = escapeHtml(visuals.source || "// No code");
  const lang = (visuals.language || "plaintext").replace(/python3?/i, "python").replace(/js|javascript/i, "javascript").replace(/ts|typescript/i, "typescript").replace(/bash|shell|zsh/i, "bash");

  const windowControls = style.showWindowControls
    ? `<div style="background: var(--color-code-surface); padding: 16px 24px; border-bottom: 1px solid var(--color-border); display: flex; gap: 8px; align-items: center;">
        <span style="width: 12px; height: 12px; border-radius: 50%; background: #ef4444;"></span>
        <span style="width: 12px; height: 12px; border-radius: 50%; background: #f59e0b;"></span>
        <span style="width: 12px; height: 12px; border-radius: 50%; background: #22c55e;"></span>
        <span style="margin-left: 12px; color: var(--color-text-muted); font-size: var(--size-small); font-family: var(--font-mono);">${visuals.language || "code"}</span>
      </div>`
    : "";

  return `
    <div class="scene-wrapper ${transitionClass}" style="opacity: 0; animation-delay: var(--motion-entrance-delay); padding: 60px 100px;">
      <div style="width: 100%; max-width: 1400px; background: var(--color-code-bg); border: 1px solid var(--color-border); border-radius: ${style.borderRadius}; overflow: hidden; box-shadow: 0 25px 50px -12px rgba(0,0,0,0.5);">
        ${windowControls}
        <pre style="font-family: var(--font-mono); white-space: pre-wrap; padding: ${style.padding}; margin: 0;"><code class="language-${lang}">${code}</code></pre>
      </div>
    </div>
    <div id="caption-overlay" class="caption-overlay" style="display: none;"></div>
  `;
}

function generateStockFootage(scene: Scene, cs: ComponentStyles, transitionClass: string): string {
  const style = cs.stock_footage;
  const visuals = scene.visuals as { mediaUrl?: string; mediaType?: string; overlay_text?: string };
  const textShadow = style.textShadow ? "text-shadow: 0 4px 30px rgba(0,0,0,0.8);" : "";

  if (!visuals.mediaUrl) {
    return `
      <div class="animated-bg"></div>
      <div class="noise-overlay"></div>
      <div class="scene-wrapper ${transitionClass}" style="opacity: 0; animation-delay: var(--motion-entrance-delay); position: relative; z-index: 10;">
        ${visuals.overlay_text ? `<p style="font-size: var(--size-h2); font-weight: var(--weight-heading); text-align: center; ${textShadow} letter-spacing: var(--tracking-tight); line-height: var(--leading-tight); max-width: 1200px;">${escapeHtml(visuals.overlay_text)}</p>` : ""}
      </div>
      <div id="caption-overlay" class="caption-overlay" style="display: none; z-index: 20;"></div>
    `;
  }

  const mediaElement = visuals.mediaType === "video"
    ? `<video class="stock-bg" src="${visuals.mediaUrl}" autoplay muted loop playsinline></video>`
    : `<img class="stock-bg" src="${visuals.mediaUrl}" alt="">`;

  const gradient = style.overlayGradient === "bottom"
    ? "linear-gradient(to bottom, rgba(0,0,0,0.3) 0%, rgba(0,0,0,0.75) 100%)"
    : style.overlayGradient === "full"
      ? `rgba(0,0,0,${style.overlayOpacity})`
      : "transparent";

  return `
    ${mediaElement}
    <div style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; background: ${gradient}; z-index: 2;"></div>
    <div class="scene-wrapper ${transitionClass}" style="opacity: 0; animation-delay: var(--motion-entrance-delay); position: relative; z-index: 10;">
      ${visuals.overlay_text ? `<p style="font-size: var(--size-h2); font-weight: var(--weight-heading); text-align: center; ${textShadow} letter-spacing: var(--tracking-tight); line-height: var(--leading-tight); max-width: 1200px;">${escapeHtml(visuals.overlay_text)}</p>` : ""}
    </div>
    <div id="caption-overlay" class="caption-overlay" style="display: none; z-index: 20;"></div>
  `;
}

function generateSceneHTML(scene: Scene, template: VideoTemplate): string {
  const cs = template.componentStyles;
  const transitionClass = getTransitionClass(scene.transition_in || template.defaultTransitions.in);

  switch (scene.type) {
    case "title_card": return generateTitleCard(scene, cs, transitionClass);
    case "carousel": return generateCarousel(scene, cs, transitionClass);
    case "diagram": return generateDiagram(scene, cs, transitionClass);
    case "code_walkthrough": return generateCode(scene, cs, transitionClass);
    case "stock_footage": return generateStockFootage(scene, cs, transitionClass);
    case "text_overlay": return generateTextOverlay(scene, cs, transitionClass);
    default: return generateTextOverlay(scene, cs, transitionClass);
  }
}

// ─── MERMAID HEAD ──────────────────────────────────────────────

function getMermaidHead(): string {
  return `
    <script src="https://cdn.jsdelivr.net/npm/mermaid@10/dist/mermaid.min.js"></script>
    <script>
      mermaid.initialize({
        startOnLoad: true,
        theme: 'dark',
        themeVariables: {
          primaryColor: '#27272a',
          primaryTextColor: '#fafafa',
          primaryBorderColor: '#52525b',
          lineColor: '#a1a1aa',
          secondaryColor: '#18181b',
          tertiaryColor: '#09090b',
          fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", sans-serif',
          fontSize: '18px'
        }
      });
    </script>
  `;
}

function getHighlightHead(): string {
  return `
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/highlight.js/11.9.0/styles/atom-one-dark.min.css">
    <script src="https://cdnjs.cloudflare.com/ajax/libs/highlight.js/11.9.0/highlight.min.js"></script>
    <script src="https://cdnjs.cloudflare.com/ajax/libs/highlight.js/11.9.0/languages/python.min.js"></script>
    <script src="https://cdnjs.cloudflare.com/ajax/libs/highlight.js/11.9.0/languages/javascript.min.js"></script>
    <script src="https://cdnjs.cloudflare.com/ajax/libs/highlight.js/11.9.0/languages/typescript.min.js"></script>
    <script src="https://cdnjs.cloudflare.com/ajax/libs/highlight.js/11.9.0/languages/bash.min.js"></script>
    <script>hljs.highlightAll();</script>
  `;
}

// ─── MAIN RENDER FUNCTIONS ─────────────────────────────────────

export async function renderScene(
  scene: Scene,
  duration: number,
  outputDir: string,
  wordTimings: WordTiming[] = [],
  template?: VideoTemplate
): Promise<RenderResult> {
  const tmpl = template || (await import("@/types/template")).DEFAULT_TEMPLATE;
  const framesDir = path.join(outputDir, "frames");
  await mkdir(framesDir, { recursive: true });

  console.log(`[Renderer] Rendering scene "${scene.type}" with duration ${duration}s (template: ${tmpl.name})`);

  const browser = await puppeteer.launch({
    headless: true,
    args: ["--no-sandbox", "--disable-setuid-sandbox"],
  });

  try {
    const page = await browser.newPage();
    await page.setViewport({ width: 1920, height: 1080 });

    const html = generateSceneDocument(scene, tmpl, wordTimings);
    await page.setContent(html, { waitUntil: "load" });

    // Wait for mermaid
    if (scene.type === "diagram") {
      try {
        await page.waitForFunction(() => document.querySelectorAll(".mermaid svg").length > 0, { timeout: 15000 });
        await new Promise((r) => setTimeout(r, 800));
        const hasError = await page.evaluate(() => {
          const el = document.querySelector(".mermaid");
          return el?.textContent?.includes("Syntax error") || el?.querySelector("svg") === null;
        });
        if (hasError) {
          await page.evaluate(() => {
            const el = document.querySelector(".mermaid");
            if (el) el.innerHTML = '<div style="color: #ef4444; font-size: 24px; text-align: center; padding: 40px;">Diagram rendering failed</div>';
          });
        }
      } catch {
        await page.evaluate(() => {
          const el = document.querySelector(".mermaid");
          if (el) el.innerHTML = '<div style="color: #a1a1aa; font-size: 24px; text-align: center; padding: 40px;">Loading diagram...</div>';
        });
      }
    }

    const fps = 30;
    const frameCount = Math.ceil(duration * fps);
    console.log(`[Renderer] Generating ${frameCount} frames at ${fps}fps`);

    for (let i = 0; i < frameCount; i++) {
      const currentTime = i / fps;
      await page.evaluate((time: number) => {
        const win = window as typeof window & { __currentTime?: number; __updateCaptions?: (t: number) => void };
        win.__currentTime = time;
        if (win.__updateCaptions) win.__updateCaptions(time);
      }, currentTime);

      const framePath = path.join(framesDir, `frame-${String(i).padStart(5, "0")}.png`);
      await page.screenshot({ path: framePath, type: "png" });

      if (i % 5 === 0) await new Promise((r) => setTimeout(r, 10));
    }

    console.log(`[Renderer] Scene rendered successfully to ${framesDir}`);
    return { framesDir, frameCount };
  } finally {
    await browser.close();
  }
}

function generateSceneDocument(scene: Scene, template: VideoTemplate, wordTimings: WordTiming[]): string {
  const baseStyles = generateBaseStyles(template.tokens, template.captionStyle, JSON.stringify(wordTimings));
  const sceneContent = generateSceneHTML(scene, template);
  const transitionClass = getTransitionClass(scene.transition_in || template.defaultTransitions.in);

  const extraHead = scene.type === "diagram" ? getMermaidHead()
    : scene.type === "code_walkthrough" ? getHighlightHead()
    : "";

  return `<!DOCTYPE html>
<html>
  <head>${baseStyles}${extraHead}</head>
  <body>${sceneContent}</body>
</html>`;
}

// ─── LAYER RENDERING (PHASE 3) ─────────────────────────────────

export async function renderLayer(
  layer: Layer,
  sceneDuration: number,
  sceneType: SceneType,
  template: VideoTemplate,
  outputDir: string,
  wordTimings: WordTiming[] = []
): Promise<LayerRenderResult> {
  const framesDir = path.join(outputDir, `layer-${layer.id}`);
  await mkdir(framesDir, { recursive: true });

  const isTransparent = layer.type !== "background";
  console.log(`[LayerRenderer] Rendering layer "${layer.name}" (${layer.type}) transparent=${isTransparent}`);

  const browser = await puppeteer.launch({
    headless: true,
    args: ["--no-sandbox", "--disable-setuid-sandbox"],
  });

  try {
    const page = await browser.newPage();
    await page.setViewport({ width: 1920, height: 1080 });

    const html = generateLayerDocument(layer, sceneType, template, wordTimings);
    await page.setContent(html, { waitUntil: "load" });

    // Mermaid wait for diagram layers
    if (layer.visuals.kind === "diagram") {
      try {
        await page.waitForFunction(() => document.querySelectorAll(".mermaid svg").length > 0, { timeout: 15000 });
        await new Promise((r) => setTimeout(r, 800));
      } catch {}
    }

    const fps = 30;
    const frameCount = Math.ceil(sceneDuration * fps);

    for (let i = 0; i < frameCount; i++) {
      const currentTime = i / fps;

      // Update captions for caption layers
      if (layer.visuals.kind === "caption") {
        await page.evaluate((time: number) => {
          const win = window as typeof window & { __currentTime?: number; __updateCaptions?: (t: number) => void };
          win.__currentTime = time;
          if (win.__updateCaptions) win.__updateCaptions(time);
        }, currentTime);
      }

      const framePath = path.join(framesDir, `frame-${String(i).padStart(5, "0")}.png`);
      await page.screenshot({
        path: framePath,
        type: "png",
        omitBackground: isTransparent,
      });

      if (i % 5 === 0) await new Promise((r) => setTimeout(r, 10));
    }

    return { layerId: layer.id, framesDir, frameCount, zIndex: layer.zIndex, isTransparent };
  } finally {
    await browser.close();
  }
}

function generateMinimalBaseStyles(): string {
  return `
    <style>
      * { margin: 0; padding: 0; box-sizing: border-box; }
      body { width: 1920px; height: 1080px; background: transparent; overflow: hidden; position: relative; }
      .mermaid { display: flex; justify-content: center; align-items: center; }
      .mermaid svg { max-width: 1500px; max-height: 750px; }
      .hljs { background: transparent !important; }
      pre code.hljs { padding: 0; }
    </style>
  `;
}

function generateLayerDocument(layer: Layer, sceneType: SceneType, template: VideoTemplate, wordTimings: WordTiming[]): string {
  const isBackground = layer.type === "background";

  if (isBackground) {
    // Background layers render exactly like a full scene
    const baseStyles = generateBaseStyles(template.tokens, template.captionStyle, JSON.stringify(wordTimings));
    const content = generateLayerHTML(layer, sceneType, template);
    return `<!DOCTYPE html>
<html>
  <head>${baseStyles}</head>
  <body>${content}</body>
</html>`;
  }

  // Transparent layers: minimal CSS + only the content
  const minimalStyles = generateMinimalBaseStyles();
  const content = generateLayerHTML(layer, sceneType, template);

  const extraHead = layer.visuals.kind === "diagram" ? getMermaidHead()
    : layer.visuals.kind === "code" ? getHighlightHead()
    : "";

  const captionScript = layer.visuals.kind === "caption" ? generateCaptionScript(JSON.stringify(wordTimings)) : "";

  return `<!DOCTYPE html>
<html>
  <head>${minimalStyles}${extraHead}</head>
  <body style="background: transparent;">${content}${captionScript}</body>
</html>`;
}

function generateLayerHTML(layer: Layer, sceneType: SceneType, template: VideoTemplate): string {
  const cs = template.componentStyles;
  const v = layer.visuals;

  switch (v.kind) {
    case "solid":
      return `<div style="position: absolute; inset: 0; background: ${v.color};"></div>`;

    case "gradient":
      return `<div style="position: absolute; inset: 0; background: linear-gradient(${v.angle}deg, ${v.from}, ${v.to});"></div>`;

    case "text": {
      const align = v.align === "center" ? "center" : v.align === "right" ? "right" : "left";
      const size = v.size === "xl" ? template.tokens.typography.sizes.h1 : v.size === "lg" ? template.tokens.typography.sizes.h2 : v.size === "md" ? template.tokens.typography.sizes.h3 : template.tokens.typography.sizes.body;
      const weight = v.style === "heading" ? template.tokens.typography.weights.heading : template.tokens.typography.weights.body;
      const font = template.tokens.typography.headingFont;
      const color = template.tokens.colors.textPrimary;
      const padX = template.tokens.spacing.scenePaddingX;
      const padY = template.tokens.spacing.scenePaddingY;
      return `
        <div style="position: absolute; inset: 0; display: flex; flex-direction: column; align-items: ${align === "center" ? "center" : "flex-start"}; justify-content: center; padding: ${padY} ${padX}; text-align: ${align};">
          <p style="font-family: ${font}; font-size: ${size}; font-weight: ${weight}; line-height: ${template.tokens.typography.lineHeights.normal}; letter-spacing: ${template.tokens.typography.letterSpacing.tight}; color: ${color};">
            ${escapeHtml(v.text)}
          </p>
        </div>`;
    }

    case "image":
      return `<img src="${v.src}" style="position: absolute; inset: 0; width: 100%; height: 100%; object-fit: ${v.objectFit};" alt="">`;

    case "video":
      return `<video src="${v.src}" autoplay muted ${v.loop ? "loop" : ""} playsinline style="position: absolute; inset: 0; width: 100%; height: 100%; object-fit: cover;"></video>`;

    case "code": {
      // For code layers, render without scene-wrapper padding
      const codeHTML = generateCode({ type: "code_walkthrough", visuals: { engine: "code_highlight", language: v.language, source: v.source } } as Scene, cs, "anim-fade-in");
      // Strip the outer scene-wrapper and just keep the code block
      return codeHTML.replace(/<div class="scene-wrapper[^>]*>/, '<div style="position: absolute; inset: 0; display: flex; align-items: center; justify-content: center; padding: 60px 100px;">');
    }

    case "diagram": {
      const diagramHTML = generateDiagram({ type: "diagram", visuals: { engine: "mermaid", source: v.source } } as Scene, cs, "anim-fade-in");
      return diagramHTML.replace(/<div class="scene-wrapper[^>]*>/, '<div style="position: absolute; inset: 0; display: flex; align-items: center; justify-content: center; padding: 40px;">');
    }

    case "carousel": {
      const carouselHTML = generateCarousel({ type: "carousel", visuals: { slides: v.slides } } as Scene, cs, "anim-fade-in");
      return carouselHTML.replace(/<div class="scene-wrapper[^>]*>/, '<div style="position: absolute; inset: 0; display: flex; flex-direction: column; align-items: flex-start; justify-content: center; padding: 100px 140px; text-align: left;">');
    }

    case "shape": {
      const shapeStyle = v.shape === "circle"
        ? `border-radius: 50%; width: ${v.width || 100}px; height: ${v.height || 100}px;`
        : v.shape === "line"
          ? `width: ${v.width || 80}px; height: ${v.height || 4}px; border-radius: 2px;`
          : `width: ${v.width || 100}px; height: ${v.height || 100}px; border-radius: ${template.tokens.spacing.borderRadius};`;
      return `<div style="position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); ${shapeStyle} background: ${v.color}; opacity: ${v.opacity};"></div>`;
    }

    case "caption": {
      const csCfg = template.captionStyle;
      const bg = csCfg.background === "gradient"
        ? "linear-gradient(to top, rgba(0,0,0,0.9) 0%, rgba(0,0,0,0.6) 50%, transparent 100%)"
        : csCfg.background === "solid" ? template.tokens.colors.captionBg : "transparent";
      return `
        <div id="caption-overlay" style="position: absolute; ${csCfg.position === "top" ? "top: 0;" : "bottom: 0;"} left: 0; width: 100%; padding: ${csCfg.padding}; background: ${bg}; text-align: center; z-index: 50;">
          <div style="font-family: ${template.tokens.typography.captionFont}; font-size: ${csCfg.fontSize}; font-weight: ${template.tokens.typography.weights.caption}; color: rgba(255,255,255,0.45); line-height: ${template.tokens.typography.lineHeights.normal}; letter-spacing: ${template.tokens.typography.letterSpacing.normal}; max-width: ${csCfg.maxWidth}; margin: 0 auto;">
          </div>
        </div>`;
    }

    default:
      return `<div style="position: absolute; inset: 0;"></div>`;
  }
}
