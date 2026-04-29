import { createStore } from "zustand/vanilla";

export interface UiStoreState {
  theme: "dark" | "light";
  setTheme: (theme: "dark" | "light") => void;
}

export const uiStore = createStore<UiStoreState>()((set) => ({
  theme: "dark",
  setTheme: (theme) => set({ theme }),
}));
