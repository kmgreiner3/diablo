import { create } from "zustand";
import { persist } from "zustand/middleware";

interface UserState {
  username: string;
  setUsername: (name: string) => void;
  clear: () => void;
}

export const useUser = create<UserState>()(
  persist(
    (set) => ({
      username: "",
      setUsername: (name) => set({ username: name.trim().slice(0, 20) }),
      clear: () => set({ username: "" }),
    }),
    { name: "quiz.username" }
  )
);
