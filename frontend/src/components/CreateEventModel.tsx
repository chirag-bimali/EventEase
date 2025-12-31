import { useState } from "react";
import { eventService } from "../services/event.service";
import type { CreateEventDTO, Event } from "../types/event.types";
import { getToken } from "../services/auth.service";
import axios from "axios";

type Props = {
  onClose: () => void;
  onCreated?: (event: Event) => void;
};

const fieldLabel =
  "text-[10px] font-semibold uppercase tracking-wider text-purple-700";
const inputBase =
  "w-full border-b border-purple-400 bg-transparent px-0 py-2 text-sm focus:border-purple-600 focus:outline-none";

export const CreateEventModel = ({ onClose, onCreated }: Props) => {
  const [form, setForm] = useState<CreateEventDTO>({
    name: "",
    description: "",
    startTime: "",
    endTime: "",
    imageUrl: "",
    venue: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleChange = (field: keyof CreateEventDTO, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const startTime = form.startTime
        ? new Date(form.startTime).toISOString()
        : "";
      const endTime = form.endTime ? new Date(form.endTime).toISOString() : "";

      const payload: CreateEventDTO = {
        ...form,
        startTime,
        endTime,
        imageUrl: form.imageUrl?.trim() || undefined,
      };
      const token = getToken();
      if (token === null) {
        throw new Error("User is not authenticated");
      }
      const created = await eventService.createEvent(payload);
      onCreated?.(created);
      onClose();
    } catch (err: unknown) {
      if (axios.isAxiosError(err)) {
        const message =
          err.response?.data?.message ||
          err.response?.statusText ||
          err.message;
        setError(message);
        return;
      }
      const message =
        err instanceof Error ? err.message : "Failed to create event";
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/50 px-4 py-10">
      <div className="relative w-full max-w-xl rounded-md bg-white shadow-xl">
        <button
          onClick={onClose}
          className="absolute right-3 top-3 text-sm font-semibold text-purple-700 hover:text-purple-900"
          aria-label="Close"
        >
          ×
        </button>

        <form onSubmit={handleSubmit} className="space-y-4 p-8">
          <h2 className="text-lg font-semibold uppercase tracking-wider text-gray-800">
            New Event
          </h2>

          <div className="space-y-1">
            <label className={fieldLabel}>Event Name</label>
            <input
              type="text"
              value={form.name}
              onChange={(e) => handleChange("name", e.target.value)}
              className={inputBase}
              placeholder="Enter event name"
              required
            />
          </div>

          <div className="space-y-1">
            <label className={fieldLabel}>Description</label>
            <textarea
              value={form.description}
              onChange={(e) => handleChange("description", e.target.value)}
              className={`${inputBase} min-h-20 resize-none`}
              placeholder="Add a short description"
              required
            />
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-1">
              <label className={fieldLabel}>Start Time</label>
              <input
                type="datetime-local"
                value={form.startTime}
                onChange={(e) => handleChange("startTime", e.target.value)}
                className={inputBase}
                required
              />
            </div>

            <div className="space-y-1">
              <label className={fieldLabel}>End Time</label>
              <input
                type="datetime-local"
                value={form.endTime}
                onChange={(e) => handleChange("endTime", e.target.value)}
                className={inputBase}
                required
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className={fieldLabel}>Image</label>
            <input
              type="url"
              value={form.imageUrl || ""}
              onChange={(e) => handleChange("imageUrl", e.target.value)}
              className={inputBase}
              placeholder="Paste image URL"
            />
          </div>

          <div className="space-y-1">
            <label className={fieldLabel}>Venue</label>
            <input
              type="text"
              value={form.venue}
              onChange={(e) => handleChange("venue", e.target.value)}
              className={inputBase}
              placeholder="Location"
              required
            />
          </div>

          {error && (
            <p className="text-sm text-red-600" role="alert">
              {error}
            </p>
          )}

          <div className="pt-2">
            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-sm bg-purple-200 py-3 text-sm font-semibold uppercase text-purple-800 transition hover:bg-purple-300 disabled:opacity-60"
            >
              {loading ? "Creating..." : "Create"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateEventModel;
