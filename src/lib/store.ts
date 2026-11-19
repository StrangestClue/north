import { create } from "zustand";
import { persist } from "zustand/middleware";
import { v4 as uuidv4 } from "uuid";
import type {
  Project,
  Scene,
  Layer,
  BackgroundMusic,
  MusicTrack,
  SceneVisuals,
  SceneType,
} from "@/types/project";
import type { VideoTemplate } from "@/types/template";
import { DEFAULT_TEMPLATE, BUILT_IN_TEMPLATES } from "@/types/template";
import { visualsToLayers, getDefaultLayersForSceneType } from "./layer-utils";

interface NorthStore {
  projects: Project[];
  musicTracks: MusicTrack[];
  customTemplates: VideoTemplate[];
  currentProjectId: string | null;
  currentSceneId: string | null;
  currentLayerId: string | null;

  // Projects
  createProject: (title: string, opts?: { musicTrackId?: string; selectedModel?: string; templateId?: string }) => string;
  deleteProject: (id: string) => void;
  setCurrentProject: (id: string | null) => void;
  setCurrentScene: (id: string | null) => void;
  setCurrentLayer: (id: string | null) => void;
  updateProject: (id: string, updates: Partial<Project>) => void;

  // Scenes
  addScene: (projectId: string, scene: Omit<Scene, "id" | "order">) => void;
  updateScene: (projectId: string, sceneId: string, updates: Partial<Scene>) => void;
  deleteScene: (projectId: string, sceneId: string) => void;
  reorderScenes: (projectId: string, sceneIds: string[]) => void;

  // Layers
  addLayer: (projectId: string, sceneId: string, layer: Omit<Layer, "id">) => void;
  updateLayer: (projectId: string, sceneId: string, layerId: string, updates: Partial<Layer>) => void;
  deleteLayer: (projectId: string, sceneId: string, layerId: string) => void;
  reorderLayers: (projectId: string, sceneId: string, layerIds: string[]) => void;

  // Music
  setBackgroundMusic: (projectId: string, music: BackgroundMusic | null) => void;
  addMusicTrack: (track: MusicTrack) => void;
  removeMusicTrack: (id: string) => void;

  // Templates
  createTemplate: (template: Omit<VideoTemplate, "id">) => string;
  updateTemplate: (id: string, updates: Partial<VideoTemplate>) => void;
  deleteTemplate: (id: string) => void;
  getTemplate: (id: string) => VideoTemplate | undefined;
  getAllTemplates: () => VideoTemplate[];

  // Getters
  getProject: (id: string) => Project | undefined;
  getScene: (projectId: string, sceneId: string) => Scene | undefined;
  getMusicTrack: (id: string) => MusicTrack | undefined;
}

// ─── MIGRATION ─────────────────────────────────────────────────

function migrateProject(project: Project): Project {
  let migrated = { ...project };

  // Migrate theme → templateId
  if (!("templateId" in migrated) || migrated.templateId === undefined) {
    migrated = { ...migrated, templateId: DEFAULT_TEMPLATE.id };
    const { theme: _theme, ...rest } = migrated as Project & { theme?: string };
    migrated = rest as Project;
  }

  // Migrate scenes without layers
  if (migrated.scenes.some((s) => !s.layers || s.layers.length === 0)) {
    migrated = {
      ...migrated,
      scenes: migrated.scenes.map((scene) => {
        if (scene.layers && scene.layers.length > 0) return scene;
        return {
          ...scene,
          layers: visualsToLayers(scene.type, scene.visuals),
        };
      }),
    };
  }

  return migrated;
}

// ─── STORE ─────────────────────────────────────────────────────

export const useStore = create<NorthStore>()(
  persist(
    (set, get) => ({
      projects: [],
      musicTracks: [],
      customTemplates: [],
      currentProjectId: null,
      currentSceneId: null,
      currentLayerId: null,

      createProject: (title, opts = {}) => {
        const { musicTrackId, selectedModel, templateId } = opts;
        const id = uuidv4();
        const now = new Date().toISOString();
        const project: Project = {
          id,
          title,
          createdAt: now,
          updatedAt: now,
          scenes: [],
          status: "draft",
          templateId: templateId || DEFAULT_TEMPLATE.id,
          backgroundMusic: musicTrackId
            ? {
                trackId: musicTrackId,
                volume: 0.15,
                ducking: true,
                duckingRatio: 0.1,
                normalRatio: 0.3,
              }
            : null,
          selectedModel: selectedModel || null,
        };
        set((state) => ({
          projects: [...state.projects, project],
          currentProjectId: id,
        }));
        return id;
      },

      deleteProject: (id) => {
        set((state) => ({
          projects: state.projects.filter((p) => p.id !== id),
          currentProjectId:
            state.currentProjectId === id ? null : state.currentProjectId,
          currentSceneId:
            state.currentProjectId === id ? null : state.currentSceneId,
        }));
      },

      setCurrentProject: (id) => {
        set({ currentProjectId: id, currentSceneId: null });
      },

      setCurrentScene: (id) => {
        set({ currentSceneId: id, currentLayerId: null });
      },

      setCurrentLayer: (id) => {
        set({ currentLayerId: id });
      },

      updateProject: (id, updates) => {
        set((state) => ({
          projects: state.projects.map((p) =>
            p.id === id
              ? { ...p, ...updates, updatedAt: new Date().toISOString() }
              : p
          ),
        }));
      },

      addScene: (projectId, scene) => {
        const id = uuidv4();
        set((state) => ({
          projects: state.projects.map((p) => {
            if (p.id !== projectId) return p;
            const order = p.scenes.length;
            // Auto-populate layers if not provided
            const layers = scene.layers?.length
              ? scene.layers
              : getDefaultLayersForSceneType(scene.type);
            return {
              ...p,
              scenes: [...p.scenes, { ...scene, id, order, layers }],
              updatedAt: new Date().toISOString(),
            };
          }),
        }));
      },

      updateScene: (projectId, sceneId, updates) => {
        set((state) => ({
          projects: state.projects.map((p) => {
            if (p.id !== projectId) return p;
            return {
              ...p,
              scenes: p.scenes.map((s) =>
                s.id === sceneId ? { ...s, ...updates } : s
              ),
              updatedAt: new Date().toISOString(),
            };
          }),
        }));
      },

      deleteScene: (projectId, sceneId) => {
        set((state) => ({
          projects: state.projects.map((p) => {
            if (p.id !== projectId) return p;
            const scenes = p.scenes
              .filter((s) => s.id !== sceneId)
              .map((s, i) => ({ ...s, order: i }));
            return {
              ...p,
              scenes,
              updatedAt: new Date().toISOString(),
            };
          }),
          currentSceneId:
            state.currentSceneId === sceneId ? null : state.currentSceneId,
        }));
      },

      reorderScenes: (projectId, sceneIds) => {
        set((state) => ({
          projects: state.projects.map((p) => {
            if (p.id !== projectId) return p;
            const sceneMap = new Map(p.scenes.map((s) => [s.id, s]));
            const scenes = sceneIds
              .map((id, order) => {
                const scene = sceneMap.get(id);
                return scene ? { ...scene, order } : null;
              })
              .filter(Boolean) as Scene[];
            return {
              ...p,
              scenes,
              updatedAt: new Date().toISOString(),
            };
          }),
        }));
      },

      // ─── LAYER CRUD ──────────────────────────────────────────

      addLayer: (projectId, sceneId, layer) => {
        const id = uuidv4();
        set((state) => ({
          projects: state.projects.map((p) => {
            if (p.id !== projectId) return p;
            return {
              ...p,
              scenes: p.scenes.map((s) => {
                if (s.id !== sceneId) return s;
                return {
                  ...s,
                  layers: [...s.layers, { ...layer, id }],
                };
              }),
              updatedAt: new Date().toISOString(),
            };
          }),
        }));
      },

      updateLayer: (projectId, sceneId, layerId, updates) => {
        set((state) => ({
          projects: state.projects.map((p) => {
            if (p.id !== projectId) return p;
            return {
              ...p,
              scenes: p.scenes.map((s) => {
                if (s.id !== sceneId) return s;
                return {
                  ...s,
                  layers: s.layers.map((l) =>
                    l.id === layerId ? { ...l, ...updates } : l
                  ),
                };
              }),
              updatedAt: new Date().toISOString(),
            };
          }),
        }));
      },

      deleteLayer: (projectId, sceneId, layerId) => {
        set((state) => ({
          projects: state.projects.map((p) => {
            if (p.id !== projectId) return p;
            return {
              ...p,
              scenes: p.scenes.map((s) => {
                if (s.id !== sceneId) return s;
                return {
                  ...s,
                  layers: s.layers.filter((l) => l.id !== layerId),
                };
              }),
              updatedAt: new Date().toISOString(),
            };
          }),
        }));
      },

      reorderLayers: (projectId, sceneId, layerIds) => {
        set((state) => ({
          projects: state.projects.map((p) => {
            if (p.id !== projectId) return p;
            return {
              ...p,
              scenes: p.scenes.map((s) => {
                if (s.id !== sceneId) return s;
                const layerMap = new Map(s.layers.map((l) => [l.id, l]));
                const layers = layerIds
                  .map((id, zIndex) => {
                    const layer = layerMap.get(id);
                    return layer ? { ...layer, zIndex: zIndex * 10 } : null;
                  })
                  .filter(Boolean) as Layer[];
                return { ...s, layers };
              }),
              updatedAt: new Date().toISOString(),
            };
          }),
        }));
      },

      // ─── MUSIC ───────────────────────────────────────────────

      setBackgroundMusic: (projectId, music) => {
        set((state) => ({
          projects: state.projects.map((p) =>
            p.id === projectId
              ? {
                  ...p,
                  backgroundMusic: music,
                  updatedAt: new Date().toISOString(),
                }
              : p
          ),
        }));
      },

      addMusicTrack: (track) => {
        set((state) => ({
          musicTracks: [...state.musicTracks, track],
        }));
      },

      removeMusicTrack: (id) => {
        set((state) => ({
          musicTracks: state.musicTracks.filter((t) => t.id !== id),
        }));
      },

      // ─── TEMPLATES ───────────────────────────────────────────

      createTemplate: (template) => {
        const id = uuidv4();
        set((state) => ({
          customTemplates: [...state.customTemplates, { ...template, id }],
        }));
        return id;
      },

      updateTemplate: (id, updates) => {
        set((state) => ({
          customTemplates: state.customTemplates.map((t) =>
            t.id === id ? { ...t, ...updates } : t
          ),
        }));
      },

      deleteTemplate: (id) => {
        set((state) => ({
          customTemplates: state.customTemplates.filter((t) => t.id !== id),
        }));
      },

      getTemplate: (id) => {
        const builtIn = BUILT_IN_TEMPLATES.find((t) => t.id === id);
        if (builtIn) return builtIn;
        return get().customTemplates.find((t) => t.id === id);
      },

      getAllTemplates: () => {
        return [...BUILT_IN_TEMPLATES, ...get().customTemplates];
      },

      // ─── GETTERS ─────────────────────────────────────────────

      getProject: (id) => {
        return get().projects.find((p) => p.id === id);
      },

      getScene: (projectId, sceneId) => {
        return get()
          .projects.find((p) => p.id === projectId)
          ?.scenes.find((s) => s.id === sceneId);
      },

      getMusicTrack: (id) => {
        return get().musicTracks.find((t) => t.id === id);
      },
    }),
    {
      name: "north-store-v2",
      version: 2,
      migrate: (persistedState: unknown, version: number) => {
        if (version < 2) {
          const state = persistedState as { projects?: Project[] };
          if (state.projects) {
            state.projects = state.projects.map(migrateProject);
          }
        }
        return persistedState as NorthStore;
      },
    }
  )
);
