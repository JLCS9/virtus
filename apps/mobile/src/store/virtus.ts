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
  /** Id en el servidor tras sincronizar. */
  remoteId?: string | null;
  /** El tipo viene del test que hizo la propia persona por invitación (sustituye al estimado). */
  confirmed?: boolean;
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
  /** Duración del ciclo en semanas. */
  cycleWeeks: number;
  /** Analítica de uso (opt-in, nunca incluye el diario). */
  analytics: boolean;
}

export interface Cycle {
  virtue: WorkVirtue;
  startedAt: string;
}

export interface ClosedCycle extends Cycle {
  closedAt: string;
  characterTakenAt: string | null;
}

export interface LocalInvite {
  kind: 'temperament' | 'character_view';
  collaboratorId: string | null;
  createdAt: string;
}

export interface CharacterResult {
  takenAt: string;
  testVersion: string;
  self: Record<Virtue, number>;
  /** Aspecto pasivo y activo de cada virtud (test oficial). */
  facets?: Record<Virtue, { passive: number; active: number }>;
  others: Record<Virtue, number>[];
}

export interface HeartRecord {
  takenAt: string;
  testVersion: string;
  pct: Record<string, number>;
  stage: Record<string, 'none' | 'stage1' | 'stage2'>;
  verdict: 'balanced' | 'has_stages';
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
  heart: HeartRecord[];
  /** Última sincronización correcta con el servidor. */
  syncedAt: string | null;
  cycleHistory: ClosedCycle[];
  invites: LocalInvite[];
  /** El usuario pospuso la confirmación del temperamento. */
  temperamentConfirmDismissedAt: string | null;
  /** Invitaciones y miradas ya incorporadas desde el servidor. */
  processedRemote: string[];

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
  addHeart: (r: HeartRecord) => void;
  markSynced: (at: string) => void;
  closeCycle: (next: WorkVirtue) => void;
  addOthersView: (view: Record<Virtue, number>) => void;
  addInvite: (i: LocalInvite) => void;
  dismissTemperamentConfirm: () => void;
  markProcessed: (ids: string[]) => void;
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
  cycleWeeks: 4,
  analytics: false,
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
  heart: [],
  syncedAt: null,
  cycleHistory: [],
  invites: [],
  temperamentConfirmDismissedAt: null,
  processedRemote: [],
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
      addHeart: (r) => set((s) => ({ heart: [...s.heart, r] })),
      markSynced: (syncedAt) => set({ syncedAt }),
      closeCycle: (next) =>
        set((s) => {
          const now = new Date().toISOString();
          const last = s.character[s.character.length - 1];
          const closed: ClosedCycle[] = s.cycle
            ? [
                ...s.cycleHistory,
                {
                  ...s.cycle,
                  closedAt: now,
                  characterTakenAt: last && last.takenAt >= s.cycle.startedAt ? last.takenAt : null,
                },
              ]
            : s.cycleHistory;
          return { cycleHistory: closed, cycle: { virtue: next, startedAt: now } };
        }),
      addOthersView: (view) =>
        set((s) => {
          if (s.character.length === 0) return {};
          const last = s.character[s.character.length - 1];
          return { character: [...s.character.slice(0, -1), { ...last, others: [...last.others, view] }] };
        }),
      addInvite: (i) => set((s) => ({ invites: [...s.invites, i] })),
      dismissTemperamentConfirm: () => set({ temperamentConfirmDismissedAt: new Date().toISOString() }),
      markProcessed: (ids) => set((s) => ({ processedRemote: [...new Set([...s.processedRemote, ...ids])] })),
      reset: () => set({ ...initial }),
    }),
    {
      name: 'virtus-v1',
      version: 3,
      storage: createJSONStorage(() => AsyncStorage),
      // v1 → v2: nuevos campos del plan y del ciclo.
      migrate: (persisted, version) => {
        const p = persisted as Partial<VirtusState>;
        if (version < 2) {
          p.plan = { ...defaultPlan, ...(p.plan ?? {}) };
          p.cycleHistory ??= [];
          p.invites ??= [];
          p.temperamentConfirmDismissedAt ??= null;
          p.processedRemote ??= [];
        }
        if (version < 3) {
          // El test de temperamento pasa al motor oficial: se conservan los resultados antiguos como historial.
          p.heart ??= [];
          const fix = (r: TemperamentResult) => ({ ...r, isPure: r.secondary === null, secondaryStrength: null }) as TemperamentResult;
          if (p.temperament) p.temperament = fix(p.temperament);
          p.temperamentHistory = (p.temperamentHistory ?? []).map(fix);
        }
        return p as VirtusState;
      },
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
