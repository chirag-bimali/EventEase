import { useEffect, useState } from "react";
import { Edit, Trash2 } from "lucide-react";
import type { TicketGroup, TicketGroupAvailability } from "../types/ticketGroup.types";
import { ticketGroupService } from "../services/ticketGroup.service";
import { useAuth } from "../hooks/useAuth";

interface TicketGroupCardProps {
  ticketGroup: TicketGroup;
  onEdit: (ticketGroup: TicketGroup) => void;
  onDelete: (id: number) => void;
}

export const TicketGroupCard = ({
  ticketGroup,
  onEdit,
  onDelete,
}: TicketGroupCardProps) => {
  const { role } = useAuth();
  const [availability, setAvailability] = useState<TicketGroupAvailability | null>(null);
  const [loading, setLoading] = useState(true);

  // roleId 1 is typically admin
  const isAdmin = role === 1;

  useEffect(() => {
    const fetchAvailability = async () => {
      try {
        setLoading(true);
        const data = await ticketGroupService.getTicketGroupAvailability(ticketGroup.id);
        setAvailability(data);
      } catch (err) {
        console.error("Failed to fetch availability:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchAvailability();
  }, [ticketGroup.id]);

  const getAvailabilityText = () => {
    if (loading) return "LOADING...";
    if (!availability) return "UNAVAILABLE";

    if (availability.available === -1) {
      return "UNLIMITED";
    }
    if (availability.available === 0) {
      return "SOLD OUT";
    }
    return `AVAILABLE: ${availability.available} SEATS`;
  };

  return (
    <div className="bg-white rounded-lg p-4 mb-4 shadow-sm hover:shadow-md transition">
      <div className="flex justify-between items-start mb-3">
        <div className="flex-1">
          <h3 className="font-semibold text-gray-800">{ticketGroup.name}</h3>
          <p className="text-xs text-gray-500 uppercase tracking-wide">
            {getAvailabilityText()}
          </p>
        </div>
        {isAdmin && (
          <div className="flex gap-2">
            <button
              onClick={() => onEdit(ticketGroup)}
              className="p-2 hover:bg-gray-100 rounded transition"
              title="Edit"
            >
              <Edit size={18} className="text-gray-600" />
            </button>
            <button
              onClick={() => onDelete(ticketGroup.id)}
              className="p-2 hover:bg-red-100 rounded transition"
              title="Delete"
            >
              <Trash2 size={18} className="text-red-600" />
            </button>
          </div>
        )}
      </div>
      <p className="text-lg font-bold text-gray-900">
        $ {typeof ticketGroup.price === "string" ? parseInt(ticketGroup.price) : ticketGroup.price}
      </p>
    </div>
  );
};
