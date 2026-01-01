import { useEffect, useState } from "react";
import type {
  EventWithRelations,
  UpdateEventDTO,
  EventStatus,
} from "../types/event.types";
import { eventService } from "../services/event.service";
import { getToken } from "../services/auth.service";
import axios from "axios";
import { format, parseISO } from "date-fns";

interface EventEditModalProps {
  event: EventWithRelations;
  isOpen: boolean;
  onClose: () => void;
  onUpdated?: (event: EventWithRelations) => void;
}

interface EditForm {
  name: string;
  description: string;
  venue: string;
  startTime: string;
  endTime: string;
  imageUrl?: string;
  status: EventStatus;
}

export default function EventEditModal({
  event,
  isOpen,
  onClose,
  onUpdated,
}: EventEditModalProps) {
  const [form, setForm] = useState<EditForm>(() => ({
    name: event.name,
    description: event.description,
    venue: event.venue,
    startTime: event.startTime
      ? format(parseISO(event.startTime), "yyyy-MM-dd'T'HH:mm")
      : "",
    endTime: event.endTime
      ? format(parseISO(event.endTime), "yyyy-MM-dd'T'HH:mm")
      : "",
    imageUrl: event.imageUrl || undefined,
    status: event.status,
  }));

  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(
    event.imageUrl || null
  );
  const [uploadingImage, setUploadingImage] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // Reset form when event changes
  useEffect(() => {
    // const startTime = format(
    //   parseISO(event.startTime),
    //   "yyyy-MM-dd'T'HH:mm"
    // );
    // const endTime = format(
    //   parseISO(event.endTime),
    //   "yyyy-MM-dd'T'HH:mm"
    // );
    setForm({
      name: event.name,
      description: event.description,
      venue: event.venue,
      startTime: event.startTime
        ? format(parseISO(event.startTime), "yyyy-MM-dd'T'HH:mm")
        : "",
      endTime: event.endTime
        ? format(parseISO(event.endTime), "yyyy-MM-dd'T'HH:mm")
        : "",
      imageUrl: event.imageUrl || undefined,
      status: event.status,
    });
    setImagePreview(event.imageUrl || null);
    setSelectedImage(null);
    setError(null);
  }, [event]);

  const handleChange = (field: keyof EditForm, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith("image/")) {
      setError("Please select an image file");
      return;
    }

    // Validate file size (5MB)
    if (file.size > 5 * 1024 * 1024) {
      setError("Image must be less than 5MB");
      return;
    }

    setSelectedImage(file);
    setError(null);

    // Create preview
    const reader = new FileReader();
    reader.onloadend = () => {
      setImagePreview(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const uploadImage = async () => {
    if (!selectedImage) return;

    setUploadingImage(true);
    setError(null);

    try {
      const token = getToken();
      if (!token) {
        throw new Error("User is not authenticated");
      }

      const uploadResult = await eventService.uploadEventImage(selectedImage);
      setForm((prev) => ({ ...prev, imageUrl: uploadResult.imageUrl }));
      setSelectedImage(null);
    } catch (err: unknown) {
      if (axios.isAxiosError(err)) {
        const message = err.response?.data?.message || err.message;
        setError(message);
        return;
      }
      const message =
        err instanceof Error ? err.message : "Failed to upload image";
      setError(message);
    } finally {
      setUploadingImage(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const payload: UpdateEventDTO = {
        name: form.name,
        description: form.description,
        venue: form.venue,
        startTime: form.startTime
          ? new Date(form.startTime).toISOString()
          : undefined,
        endTime: form.endTime
          ? new Date(form.endTime).toISOString()
          : undefined,
        imageUrl: form.imageUrl?.trim() || undefined,
        status: form.status,
      };
      const token = getToken();
      if (token === null) {
        throw new Error("User is not authenticated");
      }
      const updated = await eventService.updateEvent(event.id, payload);
      onUpdated?.(updated as EventWithRelations);
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
        err instanceof Error ? err.message : "Failed to update event";
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;
  
  const fieldLabel =
    "text-sm font-medium text-gray-700 border-b-2 border-purple-500 inline-block pb-1";
  const inputBase =
    "w-full px-4 py-2 rounded-md border border-gray-300 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent bg-white shadow-sm";

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex justify-between items-center">
          <h2 className="text-2xl font-bold text-gray-900">Edit Event</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <svg
              className="w-6 h-6"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          <div className="space-y-1">
            <label className={fieldLabel}>Name</label>
            <input
              type="text"
              value={form.name}
              onChange={(e) => handleChange("name", e.target.value)}
              className={inputBase}
              placeholder="Event name"
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
              <label className={fieldLabel}>Start Time (Optional)</label>
              <input
                type="datetime-local"
                value={form.startTime}
                onChange={(e) => handleChange("startTime", e.target.value)}
                className={inputBase}
              />
            </div>

            <div className="space-y-1">
              <label className={fieldLabel}>End Time (Optional)</label>
              <input
                type="datetime-local"
                value={form.endTime}
                onChange={(e) => handleChange("endTime", e.target.value)}
                className={inputBase}
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className={fieldLabel}>Image (Optional)</label>
            <input
              type="file"
              accept="image/*"
              onChange={handleImageSelect}
              className={inputBase}
            />
            {imagePreview && (
              <div className="mt-2">
                <img
                  src={imagePreview}
                  alt="Preview"
                  className="h-32 w-full object-cover rounded border border-gray-300"
                />
              </div>
            )}
            {selectedImage && !form.imageUrl && (
              <button
                type="button"
                onClick={uploadImage}
                disabled={uploadingImage}
                className="mt-2 px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-700 disabled:opacity-50"
              >
                {uploadingImage ? "Uploading..." : "Upload Image"}
              </button>
            )}
            {form.imageUrl && (
              <p className="text-sm text-green-600 mt-1">✓ Image uploaded</p>
            )}
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

          <div className="space-y-1">
            <label className={fieldLabel}>Status</label>
            <select
              value={form.status}
              onChange={(e) =>
                handleChange("status", e.target.value as EventStatus)
              }
              className={inputBase}
              required
            >
              <option value="DRAFT">DRAFT</option>
              <option value="PUBLISHED">PUBLISHED</option>
              <option value="CANCELLED">CANCELLED</option>
              <option value="SOLD_OUT">SOLD OUT</option>
            </select>
          </div>

          {error && (
            <p className="text-sm text-red-600" role="alert">
              {error}
            </p>
          )}

          <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-2 text-sm font-medium text-white bg-purple-600 rounded-lg hover:bg-purple-700 disabled:opacity-50 transition-colors"
            >
              {loading ? "Updating..." : "Update Event"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
