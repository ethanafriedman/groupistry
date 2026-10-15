export type FairnessMode =
  | "coverage_first"
  | "balanced"
  | "top_choices"
  | "total_satisfaction";

export type ConstraintKind =
  | "must_be_with"
  | "cannot_be_with"
  | "locked_room";

export interface Labels {
  participant: string;
  participantPlural: string;
  room: string;
  roomPlural: string;
  preference: string;
  preferencePlural: string;
  groupLabel: string;
}

export interface UseCasePreset {
  id: string;
  title: string;
  subtitle: string;
  labels: Labels;
}

export interface UploadPreview {
  upload_id: string;
  filename: string;
  columns: string[];
  row_count: number;
  preview: Record<string, string>[];
}

export interface Preference {
  target_id: string;
  rank: number | null;
}

export interface Participant {
  participant_id: string;
  name: string;
  attributes: Record<string, string>;
  notes: string | null;
  preferences: Preference[];
}

export interface UnresolvedPreference {
  participant_id: string;
  participant_name: string;
  requested_name: string;
  rank: number | null;
  reason: string;
  suggestions: {
    participant_id: string;
    name: string;
    score: number;
  }[];
}

export interface Room {
  room_id: string;
  name: string;
  capacity: number;
  attributes?: Record<string, string>;
}

export interface PlacementConstraint {
  kind: ConstraintKind;
  participant_id: string;
  target_id: string;
}

export interface OptimizeResult {
  status: string;
  assignments: {
    room_id: string;
    room_name: string;
    capacity: number;
    participants: string[];
  }[];
  participant_assignments: Record<string, string>;
  stats: {
    participant_count: number;
    people_with_preferences: number;
    participants_with_a_match: number;
    participants_without_a_match: number;
    coverage_rate: number;
    total_preferences_honored: number;
    top_choices_honored: number;
    mutual_pairs_honored: number;
    room_sizes: Record<string, number>;
    per_person: Record<string, {
      name: string;
      room_id: string;
      matched_preference_ids: string[];
      matched_ranks: (number | null)[];
      preference_count: number;
    }>;
    fairness_mode: string;
  };
  objective_value: number | null;
}
