import type { TicketGroup } from "../types/ticketGroup.types";
import { TicketGroupCard } from "./TicketGroupCard";

interface TicketGroupListProps {
  ticketGroups: TicketGroup[];
  onEdit: (ticketGroup: TicketGroup) => void;
  onDelete: (id: number) => void;
  loading?: boolean;
}

export const TicketGroupList = ({
  ticketGroups,
  onEdit,
  onDelete,
  loading = false,
}: TicketGroupListProps) => {
  if (loading) {
    return (
      <div className="flex justify-center items-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (ticketGroups.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-500">No ticket groups yet</p>
      </div>
    );
  }

  return (
    <div>
      {ticketGroups.map((ticketGroup) => (
        <TicketGroupCard
          key={ticketGroup.id}
          ticketGroup={ticketGroup}
          onEdit={onEdit}
          onDelete={onDelete}
        />
      ))}
    </div>
  );
};
