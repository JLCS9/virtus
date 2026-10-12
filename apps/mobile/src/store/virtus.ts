/**
 * Estado local de Virtus (offline-first). Todo vive en el dispositivo; la sincronización
 * con el servidor (M3) excluirá siempre `collaborators[].estimated`.
 */
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useEffect, useState } from 'react';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

import type {
  Collaborator,
  DayRecord,
  ExamEntry,
  Locale,
  Rhythm,
  Role,
  TemperamentResult,
  TypeCode,
  Virtue,
  WorkVirtue,
} from '@virtus/method';

export interface RoleBox {
  role: Role;
  detail: string;
}

export interface CollaboratorBox extends Collaborator {
  /** Temperamento estimado de un tercero: SOLO en el dispositivo, nunca se sincroniza. */
  estimated: TypeCode | null;
  invitedAt: string | null;
}

export interface Habit {
  id: string;
  label: string;
  reminder: string | null;
}

export interface Plan {
  morningTime: string;
  morningMinutes: 2 | 5;
  eveningTime: string;
  examFormat: 'breve' | 'completo';
  habits: Habit[];
  rhythm: Rhythm;
  spiritual: boolean;
  notifications: boolean;
}

export interface Cycle {
  virtue: WorkVirtue;
  startedAt: string;
}

export interface CharacterResult {
  takenAt: string;
  testVersion: string;
  self: Record<Virtue, number>;
  others: Record<Virtue, number>[];
}

export interface VirtusState {
  locale: Locale;
  onboardedAt: string | null;
  temperament: TemperamentResult | null;
  temperamentHistory: TemperamentResult[];
  roles: RoleBox[];
  mission: string;
  missionNotes: { historia: string; talento: string; desafio: string };
  collaborators: CollaboratorBox[];
  plan: Plan;
  cycle: Cycle | null;
  records: Record<string, DayRecord>;
  recentChallenges: string[];
  character: CharacterResult[];

  setTemperament: (r: TemperamentResult) => void;
  setRoles: (roles: RoleBox[]) => void;
  setMission: (mission: string, notes?: Partial<VirtusState['missionNotes']>) => void;
  setPlan: (plan: Partial<Plan>) => void;
  setCycle: (virtue: WorkVirtue) => void;
  completeOnboarding: () => void;
  upsertCollaborator: (c: CollaboratorBox) => void;
  removeCollaborator: (id: string) => void;
  setChallenge: (date: string, challenge: NonNullable<DayRecord['challenge']>) => void;
  acceptChallenge: (date: string) => void;
  saveExam: (date: string, exam: ExamEntry) => void;
  toggleHabit: (date: string, habitId: string) => void;
  addCharacter: (r: CharacterResult) => void;
  reset: () => void;
}

export const defaultPlan: Plan = {
  morningTime: '07:30',
  morningMinutes: 2,
  eveningTime: '21:30',
  examFormat: 'breve',
  habits: [],
  rhythm: [false, true, true, true, true, true, true],
  spiritual: false,
  notifications: true,
};

const initial = {
  locale: 'es' as Locale,
  onboardedAt: null,
  temperament: null,
  temperamentHistory: [],
  roles: [],
  mission: '',
  missionNotes: { historia: '', talento: '', desafio: '' },
  collaborators: [],
  plan: defaultPlan,
  cycle: null,
  records: {},
  recentChallenges: [],
  character: [],
};

const emptyDay = (date: string): DayRecord => ({ date, habitsDone: [] });

export const useVirtus = create<VirtusState>()(
  persist(
    (set) => ({
      ...initial,
      setTemperament: (r) =>
        set((s) => ({
          temperament: r,
          temperamentHistory: [...s.temperamentHistory, r],
          cycle: s.cycle ?? { virtue: r.challengeVirtue, startedAt: new Date().toISOString() },
        })),
      setRoles: (roles) => set({ roles }),
      setMission: (mission, notes) => set((s) => ({ mission, missionNotes: { ...s.missionNotes, ...notes } })),
      setPlan: (plan) => set((s) => ({ plan: { ...s.plan, ...plan } })),
      setCycle: (virtue) => set({ cycle: { virtue, startedAt: new Date().toISOString() } }),
      completeOnboarding: () => set({ onboardedAt: new Date().toISOString() }),
      upsertCollaborator: (c) =>
        set((s) => ({
          collaborators: s.collaborators.some((x) => x.id === c.id)
            ? s.collaborators.map((x) => (x.id === c.id ? c : x))
            : [...s.collaborators, c],
        })),
      removeCollaborator: (id) => set((s) => ({ collaborators: s.collaborators.filter((c) => c.id !== id) })),
      setChallenge: (date, challenge) =>
        set((s) => ({
          records: { ...s.records, [date]: { ...(s.records[date] ?? emptyDay(date)), challenge } },
          recentChallenges: [challenge.baseId, ...s.recentChallenges.filter((id) => id !== challenge.baseId)].slice(0, 14),
        })),
      acceptChallenge: (date) =>
        set((s) => {
          const r = s.records[date];
          if (!r?.challenge) return {};
          return { records: { ...s.records, [date]: { ...r, challenge: { ...r.challenge, acceptedAt: new Date().toISOString() } } } };
        }),
      saveExam: (date, exam) =>
        set((s) => ({ records: { ...s.records, [date]: { ...(s.records[date] ?? emptyDay(date)), exam } } })),
      toggleHabit: (date, habitId) =>
        set((s) => {
          const r = s.records[date] ?? emptyDay(date);
          const done = r.habitsDone.includes(habitId) ? r.habitsDone.filter((h) => h !== habitId) : [...r.habitsDone, habitId];
          return { records: { ...s.records, [date]: { ...r, habitsDone: done } } };
        }),
      addCharacter: (r) => set((s) => ({ character: [...s.character, r] })),
      reset: () => set({ ...initial }),
    }),
    {
      name: 'virtus-v1',
      version: 1,
      storage: createJSONStorage(() => AsyncStorage),
    },
  ),
);

/** Espera a que el estado persistido se haya cargado (para no redirigir antes de tiempo). */
export function useHydrated(): boolean {
  const [hydrated, setHydrated] = useState(() => useVirtus.persist.hasHydrated());
  useEffect(() => {
    const unsub = useVirtus.persist.onFinishHydration(() => setHydrated(true));
    if (useVirtus.persist.hasHydrated()) setHydrated(true);
    return unsub;
  }, []);
  return hydrated;
}
