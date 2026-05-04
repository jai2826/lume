import { atom } from 'jotai';

// Tracks the platforms the user is currently trying to link
export const linkingStatusAtom = atom<Record<string, 'idle' | 'loading' | 'success' | 'error'>>({
  youtube: 'idle',
  instagram: 'idle',
  x: 'idle',
  tiktok: 'idle',
});

// Controls visibility of UI elements within the onboarding page
export const onboardingStepAtom = atom<number>(1);