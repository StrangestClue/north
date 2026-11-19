import { create } from "zustand";
import { persist } from "zustand/middleware";
import { v4 as uuidv4 } from "uuid";
import type { Provider } from "@/types/provider";

interface ProviderStore {
  providers: Provider[];

  addProvider: (provider: Omit<Provider, "id">) => string;
  updateProvider: (id: string, updates: Partial<Provider>) => void;
  deleteProvider: (id: string) => void;
  setDefault: (id: string) => void;
  getProvider: (id: string) => Provider | undefined;
  getDefaultProvider: () => Provider | undefined;
}

export const useProviderStore = create<ProviderStore>()(
  persist(
    (set, get) => ({
      providers: [],

      addProvider: (provider) => {
        const id = uuidv4();
        set((state) => {
          const providers = provider.isDefault
            ? state.providers.map((p) => ({ ...p, isDefault: false }))
            : state.providers;
          return { providers: [...providers, { ...provider, id }] };
        });
        return id;
      },

      updateProvider: (id, updates) => {
        set((state) => ({
          providers: state.providers.map((p) =>
            p.id === id ? { ...p, ...updates } : p
          ),
        }));
      },

      deleteProvider: (id) => {
        set((state) => ({
          providers: state.providers.filter((p) => p.id !== id),
        }));
      },

      setDefault: (id) => {
        set((state) => ({
          providers: state.providers.map((p) => ({
            ...p,
            isDefault: p.id === id,
          })),
        }));
      },

      getProvider: (id) => {
        return get().providers.find((p) => p.id === id);
      },

      getDefaultProvider: () => {
        return get().providers.find((p) => p.isDefault);
      },
    }),
    {
      name: "north-provider-store",
    }
  )
);
