import { create } from "zustand";

type ProfileTitleColorState = {
    titleColor: string;
    setTitleColor: (color: string) => void;
};

export const useProfileTitleColorStore = create<ProfileTitleColorState>(
    (set) => ({
        titleColor: "#7A8494",
        setTitleColor: (titleColor) => set({ titleColor }),
    }),
);
