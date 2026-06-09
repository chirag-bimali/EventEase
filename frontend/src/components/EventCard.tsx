import { Link } from "react-router-dom";
import type { Event } from "../types/event.types";
import { format } from "date-fns";

interface EventCardProps {
  event: Event;
}

export const EventCard = ({ event }: EventCardProps) => {
  const startDate = format(new Date(event.startTime), "MMM yyyy h:mm a");
  const endDate = format(new Date(event.endTime), "h:mm a");
  console.log("EventCard rendered for event:", event);

  return (
    <Link to={`/events/${event.id}`} className="block">
      <div className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition">
        <div className="h-56 bg-blue-900">
          {event.imageUrl && (
            <img
              src={event.imageUrl}
              alt={event.name}
              className="w-full h-full object-cover"
            />
          )}
        </div>
        <div className="p-4">
          <div className="flex justify-between gap-6 items-start mb-2 w-full">
            <div className="overflow-hidden">
              <h3 className="font-semibold text-gray-800 text-nowrap overflow-hidden text-ellipsis w-full">
                {event.name}
              </h3>
              <p className="text-xs font-medium text-gray-950/50">
                {startDate} - {endDate}
              </p>
              <p className="text-xs font-medium text-gray-950/50">{event.venue}</p>
            </div>
            <span
              className={`text-xs px-2 py-1 rounded ${
                event.status === "AVAILABLE"
                  ? "bg-green-100 text-green-800"
                  : event.status === "SOLD"
                  ? "bg-red-100 text-red-800"
                  : "bg-blue-100 text-blue-800"
              }`}
            >
              {event.status}
            </span>
          </div>
        </div>
      </div>
    </Link>
  );
};
