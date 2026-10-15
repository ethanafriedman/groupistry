import axios from "axios";
import type {
  OptimizeResult,
  PlacementConstraint,
  Room,
  UploadPreview,
} from "../types";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL ?? "http://127.0.0.1:8000/api",
});

export async function uploadFile(file: File): Promise<UploadPreview> {
  const data = new FormData();
  data.append("file", file);

  const response = await api.post("/uploads", data, {
    headers: { "Content-Type": "multipart/form-data" },
  });

  return response.data;
}

export async function importUpload(
  uploadId: string,
  mapping: {
    name_column: string;
    preference_columns: string[];
    id_column?: string | null;
    notes_column?: string | null;
    attribute_columns: Record<string, string>;
  },
  ranked: boolean,
) {
  const response = await api.post(
    `/uploads/${uploadId}/import?ranked=${ranked}`,
    mapping,
  );

  return response.data;
}

export async function resolvePreference(
  uploadId: string,
  payload: {
    participant_id: string;
    rank: number | null;
    target_id: string;
  },
) {
  const response = await api.post(
    `/uploads/${uploadId}/resolve-preference`,
    payload,
  );

  return response.data;
}

export async function dismissPreference(
  uploadId: string,
  payload: {
    participant_id: string;
    rank: number | null;
    requested_name: string;
  },
) {
  const response = await api.post(
    `/uploads/${uploadId}/dismiss-preference`,
    payload,
  );

  return response.data;
}

export async function makeEqualRooms(
  uploadId: string,
  roomCapacity: number,
): Promise<Room[]> {
  const response = await api.post(
    `/uploads/${uploadId}/rooms/equal`,
    { room_capacity: roomCapacity },
  );

  return response.data.rooms;
}

export async function optimize(
  uploadId: string,
  payload: {
    settings: {
      event_name: string;
      requests_ranked: boolean;
      fairness_mode: string;
      allow_underfilled_rooms: boolean;
      minimum_room_size: number;
      priorities: Record<string, "off" | "low" | "medium" | "high">;
    };
    rooms: Room[];
    constraints: PlacementConstraint[];
    time_limit_seconds: number;
  },
): Promise<OptimizeResult> {
  const response = await api.post(
    `/uploads/${uploadId}/optimize`,
    payload,
  );

  return response.data;
}

export async function exportAssignments(
  uploadId: string,
  payload: Parameters<typeof optimize>[1],
  fileType: "xlsx" | "csv",
) {
  const response = await api.post(
    `/uploads/${uploadId}/export?file_type=${fileType}`,
    payload,
    { responseType: "blob" },
  );

  const blob = new Blob([response.data]);
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = `assignments.${fileType}`;
  anchor.click();
  URL.revokeObjectURL(url);
}
