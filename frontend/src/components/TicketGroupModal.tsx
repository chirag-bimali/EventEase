import { useMemo, useState } from "react";
import type {
  TicketGroup,
  CreateTicketGroupDTO,
  UpdateTicketGroupDTO,
  SeatType,
  SeatingConfig,
} from "../types/ticketGroup.types";
import axios from "axios";

interface TicketGroupModalProps {
  isOpen: boolean;
  ticketGroup?: TicketGroup;
  eventId: number;
  onClose: () => void;
  onSubmit: (
    data: CreateTicketGroupDTO | UpdateTicketGroupDTO,
    isUpdate?: boolean,
    id?: number
  ) => Promise<void>;
  loading?: boolean;
}

export const TicketGroupModal = ({
  isOpen,
  ticketGroup,
  eventId,
  onClose,
  onSubmit,
  loading = false,
}: TicketGroupModalProps) => {
  // Normalize seating config from possible string payloads
  const initialSeatingConfig: SeatingConfig[] = useMemo(() => {
    if (!ticketGroup?.seatingConfig) return [];
    if (Array.isArray(ticketGroup.seatingConfig))
      return ticketGroup.seatingConfig as SeatingConfig[];
    try {
      const parsed = JSON.parse(ticketGroup.seatingConfig as string);
      return Array.isArray(parsed) ? (parsed as SeatingConfig[]) : [];
    } catch {
      return [];
    }
  }, [ticketGroup?.seatingConfig]);

  const [formData, setFormData] = useState(() => ({
    name: ticketGroup?.name || "",
    description: ticketGroup?.description || "",
    price: ticketGroup?.price !== undefined ? ticketGroup.price : "",
    seatType: (ticketGroup?.seatType || "GENERAL") as SeatType,
    quantity: ticketGroup?.quantity !== undefined ? ticketGroup.quantity : "",
    prefixFormat: ticketGroup?.prefixFormat || "",
  }));
  const [seatingRows, setSeatingRows] =
    useState<SeatingConfig[]>(initialSeatingConfig);
  const [error, setError] = useState<string | null>(null);

  const totalSeats = useMemo(
    () => seatingRows.reduce((sum, row) => sum + (Number(row.columns) || 0), 0),
    [seatingRows]
  );

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >
  ) => {
    const { name, value } = e.target;
    if (name === "seatType") {
      const nextType = value as SeatType;
      setSeatingRows([]);
      setFormData((prev) => ({
        ...prev,
        seatType: nextType,
        prefixFormat: nextType === "SEAT" ? "" : prev.prefixFormat,
      }));
    } else {
      setFormData((prev) => ({
        ...prev,
        [name]: value,
      }));
    }
    setError(null);
  };

  const addRow = () => {
    setSeatingRows((prev) => [...prev, { row: "", columns: 1 }]);
  };

  const updateRow = (
    index: number,
    key: keyof SeatingConfig,
    value: string | number
  ) => {
    setSeatingRows((prev) =>
      prev.map((row, i) => (i === index ? { ...row, [key]: value } : row))
    );
  };

  const removeRow = (index: number) => {
    setSeatingRows((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      // Validation
      const quantityNumber = Number(formData.quantity);
      if (isNaN(quantityNumber) || quantityNumber < 0) {
        setError("Quantity must be a non-negative number");
        return;
      }
      const price = Number(formData.price);
      if (isNaN(price) || price < 0) {
        setError("Price must be a valid number greater than or equal to 0");
        return;
      }
      if (!formData.name.trim()) {
        setError("Ticket group name is required");
        return;
      }

      if (formData.seatType === "SEAT") {
        if (!seatingRows.length) {
          setError("Add at least one row for seating configuration");
          return;
        }
        const seen = new Set<string>();
        for (const row of seatingRows) {
          const rowName = row.row.trim();
          const cols = Number(row.columns);
          if (!rowName) {
            setError("Each row must have a name");
            return;
          }
          if (seen.has(rowName)) {
            setError("Row names must be unique");
            return;
          }
          seen.add(rowName);
          if (isNaN(cols) || cols <= 0) {
            setError("Columns must be greater than 0 for each row");
            return;
          }
        }
      }

      if (formData.seatType === "QUEUE" || formData.seatType === "GENERAL") {
        if (!formData.prefixFormat?.trim()) {
          setError("Prefix format is required for QUEUE and GENERAL types");
          return;
        }
      }

      const seatingConfigPayload =
        formData.seatType === "SEAT" ? seatingRows : undefined;
      const prefixPayload =
        formData.seatType !== "SEAT" ? formData.prefixFormat : undefined; // Changed condition
      const basePayload = {
        name: formData.name,
        description: formData.description,
        price: price,
        quantity: quantityNumber,
        prefixFormat: prefixPayload,
        seatingConfig: seatingConfigPayload,
        seatType: formData.seatType as SeatType,
      };

      if (ticketGroup) {
        // Update
        const updateData: UpdateTicketGroupDTO = basePayload;
        await onSubmit(updateData, true, ticketGroup.id);
      } else {
        // Create
        const createData: CreateTicketGroupDTO = {
          eventId,
          ...basePayload,
        };
        await onSubmit(createData);
      }
      setFormData({
        name: "",
        description: "",
        price: "",
        seatType: "GENERAL",
        quantity: "",
        prefixFormat: "",
      });
      setSeatingRows([]);
      setError(null);

      onClose();
    } catch (err) {
      if (axios.isAxiosError(err) && err.response) {
        setError(
          (err.response.data as { message?: string }).message ||
            "An error occurred"
        );
        return;
      }
      setError(err instanceof Error ? err.message : "An error occurred");
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-xl max-h-3/4 overflow-y-auto">
        <h2 className="text-xl font-semibold mb-4">
          {ticketGroup ? "Edit Ticket Group" : "Add Ticket Group"}
        </h2>

        {error && (
          <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="e.g., Standard, VIP"
            />
          </div>

          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Description
            </label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="e.g., Limited availability"
              rows={3}
            />
          </div>

          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Price <span className="text-red-500">*</span>
            </label>
            <input
              type="number"
              name="price"
              value={formData.price}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="0.00"
              step="0.01"
              min="0"
            />
          </div>

          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Seat Type
            </label>
            <select
              name="seatType"
              value={formData.seatType}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="GENERAL">General</option>
              <option value="QUEUE">Queue</option>
              <option value="SEAT">Seat</option>
            </select>
          </div>

          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Quantity
            </label>
            <input
              type="number"
              name="quantity"
              value={formData.quantity}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="e.g., 100"
              min="0"
            />
          </div>

          {(formData.seatType === "QUEUE" ||
            formData.seatType === "GENERAL") && (
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Prefix Format (for Queue)
              </label>
              <input
                type="text"
                name="prefixFormat"
                value={formData.prefixFormat}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="e.g., B (for B1, B2, B3...)"
                maxLength={5}
              />
            </div>
          )}

          {formData.seatType === "SEAT" && (
            <div className="mb-6">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-medium text-gray-700">
                  Seating Configuration
                </h3>
                <button
                  type="button"
                  onClick={addRow}
                  className="text-sm text-purple-700 hover:text-purple-900"
                >
                  + Add Row
                </button>
              </div>

              <div className="space-y-3">
                {seatingRows.map((row, index) => (
                  <div
                    key={`${index}-${row.row}`}
                    className="flex items-end gap-3 border-b border-purple-200 pb-3"
                  >
                    <div className="flex-1">
                      <label className="block text-xs font-medium text-gray-600 mb-1">
                        Row Name
                      </label>
                      <input
                        type="text"
                        value={row.row}
                        onChange={(e) =>
                          updateRow(index, "row", e.target.value)
                        }
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                        placeholder="e.g., A"
                      />
                    </div>
                    <div className="w-32">
                      <label className="block text-xs font-medium text-gray-600 mb-1">
                        Column Size
                      </label>
                      <input
                        type="number"
                        min={1}
                        value={row.columns}
                        onChange={(e) =>
                          updateRow(index, "columns", Number(e.target.value))
                        }
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                        placeholder="e.g., 10"
                      />
                    </div>
                    <button
                      type="button"
                      onClick={() => removeRow(index)}
                      className="text-red-600 hover:text-red-800 text-sm"
                    >
                      Remove
                    </button>
                  </div>
                ))}
              </div>

              <div className="mt-4 text-sm text-gray-700">
                Total seats: <span className="font-semibold">{totalSeats}</span>
              </div>
            </div>
          )}

          <div className="flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition"
              disabled={loading}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 px-4 py-2 text-white bg-blue-500 rounded-lg hover:bg-blue-600 transition disabled:opacity-50"
              disabled={loading}
            >
              {loading ? "Saving..." : ticketGroup ? "Update" : "Create"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
