import { useEvents } from "../../hooks/useEvents";
import type { Event } from "../../types/event.types";
import { EventStatus } from "../../types/event.types";

interface EventSelectorProps {
  onSelect: (event: Event) => void;
}

export const EventSelector = ({ onSelect }: EventSelectorProps) => {
  const { events, loading, error } = useEvents();

  if (loading) {
    return (
      <div className="flex justify-center items-center py-20">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
        <p className="text-red-600 font-medium">{error}</p>
      </div>
    );
  }

  if (events.length === 0) {
    return (
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 text-center">
        <p className="text-yellow-700">No events available. Please create an event first.</p>
      </div>
    );
  }

  return (
    <div>
      <h2 className="text-xl font-semibold text-gray-900 mb-4">SELECT EVENT</h2>
      
      <div className="grid gap-4 md:grid-cols-2">
        {events.map((event) => (
          <div
            key={event.id}
            className="bg-white border border-gray-200 rounded-lg p-6 hover:border-purple-300 hover:shadow-md transition-all cursor-pointer"
            onClick={() => onSelect(event)}
          >
            {/* Event Image */}
            {event.imageUrl && (
              <img
                src={event.imageUrl}
                alt={event.name}
                className="w-full h-40 object-cover rounded-md mb-4"
              />
            )}

            {/* Event Details */}
            <h3 className="text-lg font-bold text-gray-900 mb-2">{event.name}</h3>
            
            {event.description && (
              <p className="text-sm text-gray-600 mb-3 line-clamp-2">{event.description}</p>
            )}

            {/* Event Info */}
            <div className="space-y-2 text-sm text-gray-700">
              {event.venue && (
                <div className="flex items-center gap-2">
                  <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  <span>{event.venue}</span>
                </div>
              )}

              {event.startTime && (
                <div className="flex items-center gap-2">
                  <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  <span>{new Date(event.startTime).toLocaleString()}</span>
                </div>
              )}

              <div className="flex items-center gap-2">
                <span className={`px-2 py-1 rounded text-xs font-medium ${
                  event.status === EventStatus.AVAILABLE 
                    ? "bg-green-100 text-green-700"
                    : event.status === EventStatus.UPCOMING
                    ? "bg-gray-100 text-gray-700"
                    : "bg-red-100 text-red-700"
                }`}>
                  {event.status}
                </span>
              </div>
            </div>

            {/* Select Button */}
            <button className="mt-4 w-full bg-purple-600 text-white py-2 px-4 rounded-md hover:bg-purple-700 transition-colors font-medium">
              Select Event
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};