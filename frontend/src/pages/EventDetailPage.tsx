import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { format, parseISO } from "date-fns";
import { eventService } from "../services/event.service";
import { useTicketGroups } from "../hooks/useTicketGroups";
import { TicketGroupList } from "../components/TicketGroupList";
import { TicketGroupModal } from "../components/TicketGroupModal";
import EventEditModal from "../components/EventEditModal";
import Navbar from "../components/Navbar";
import { useAuth } from "../hooks/useAuth";
import type { Event, EventWithRelations } from "../types/event.types";
import type {
  TicketGroup,
  CreateTicketGroupDTO,
  UpdateTicketGroupDTO,
} from "../types/ticketGroup.types";
import axios from "axios";

export const EventDetailPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { role } = useAuth();
  const [event, setEvent] = useState<Event | null>(null);
  const [loadingEvent, setLoadingEvent] = useState(true);
  const [eventError, setEventError] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedTicketGroup, setSelectedTicketGroup] = useState<
    TicketGroup | undefined
  >(undefined);

  const {
    ticketGroups,
    loading: ticketGroupsLoading,
    error: ticketGroupsError,
    fetchTicketGroupsByEvent,
    createTicketGroup,
    updateTicketGroup,
    deleteTicketGroup,
  } = useTicketGroups();

  // Fetch event details
  useEffect(() => {
    const fetchEvent = async () => {
      if (!id) {
        navigate("/events");
        return;
      }

      try {
        setLoadingEvent(true);
        const data = await eventService.getEventById(parseInt(id));
        setEvent(data);
        setEventError(null);
      } catch (err) {
        const message =
          err instanceof Error ? err.message : "Failed to fetch event";
        setEventError(message);
      } finally {
        setLoadingEvent(false);
      }
    };

    fetchEvent();
  }, [id, navigate]);

  // Fetch ticket groups for this event
  useEffect(() => {
    if (id) {
      fetchTicketGroupsByEvent(parseInt(id));
    }
  }, [id, fetchTicketGroupsByEvent]);

  const handleAddGroup = () => {
    setSelectedTicketGroup(undefined);
    setIsModalOpen(true);
  };

  const handleEditGroup = (ticketGroup: TicketGroup) => {
    setSelectedTicketGroup(ticketGroup);
    setIsModalOpen(true);
  };

  const handleDeleteGroup = async (ticketGroupId: number) => {
    if (window.confirm("Are you sure you want to delete this ticket group?")) {
      try {
        await deleteTicketGroup(ticketGroupId);
      } catch (err) {
        if (axios.isAxiosError(err) && err.response) {
          const message =
            (err.response.data as { message?: string }).message ||
            "Failed to delete ticket group";
          alert(message);
          return;
        }
        console.error("Failed to delete ticket group:", err);
        alert("Failed to delete ticket group");
      }
    }
  };

  const handleModalSubmit = async (
    data: CreateTicketGroupDTO | UpdateTicketGroupDTO,
    isUpdate?: boolean,
    ticketGroupId?: number
  ) => {
    try {
      if (isUpdate && ticketGroupId) {
        await updateTicketGroup(ticketGroupId, data as UpdateTicketGroupDTO);
      } else {
        await createTicketGroup(data as CreateTicketGroupDTO);
      }
    } catch (err) {
      if (axios.isAxiosError(err) && err.response) {
        const message =
          (err.response.data as { message?: string }).message ||
          "Failed to submit ticket group";
        alert(message);
        throw err;
      }
      alert("Failed to submit ticket group");
      throw err;
    }
  };

  const handleUpdateEvent = async (updatedEventId: number) => {
    try {
      if (!updatedEventId) return;
      const updated = await eventService.getEventById(updatedEventId);
      setEvent(updated);
      if (id) {
        await fetchTicketGroupsByEvent(parseInt(id));
      }
    } catch (err) {
      console.error("Failed to refresh event data:", err);
    }
  };

  // roleId 1 is typically admin (based on seed order)
  const isAdmin = role === 1;

  if (loadingEvent) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (eventError || !event) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
          {eventError || "Event not found"}
        </div>
      </div>
    );
  }

  // print not formated dates
  let startDate = undefined;
  let endDate = undefined;

  if (event.endTime) {
    startDate = format(parseISO(event.startTime ?? null), "yyyy/MM/dd hh:mm a");
  }
  if (event.startTime) {
    endDate = format(parseISO(event.endTime ?? null), "yyyy/MM/dd hh:mm a");
  }
  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Left side - Event Details */}
          <div>
            <div className="flex justify-between items-start mb-4">
              <h1 className="text-3xl font-bold text-gray-900">{event.name}</h1>
              {isAdmin && (
                <button
                  onClick={() => setIsEditModalOpen(true)}
                  className="px-4 py-2 bg-purple-600 text-white text-sm font-medium rounded-lg hover:bg-purple-700 transition-colors"
                >
                  Edit Event
                </button>
              )}
            </div>
            <p className="text-sm text-gray-600 mb-4">
              {startDate && endDate
                ? `${startDate} ~ ${endDate}`
                : startDate
                ? `Starts: ${startDate}`
                : endDate
                ? `Ends: ${endDate}`
                : "Date & Time TBA"}
            </p>

            {/* Event Image */}
            <div className="w-full h-96 bg-blue-900 rounded-lg overflow-hidden mb-6">
              {event.imageUrl ? (
                <img
                  src={event.imageUrl}
                  alt={event.name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <p className="text-white text-lg">No image available</p>
                </div>
              )}
            </div>

            {/* Event Description */}
            <div className="bg-white rounded-lg p-6 shadow-sm">
              <p className="text-gray-700 leading-relaxed whitespace-pre-line">
                {event.description}
              </p>
              <div className="mt-4 pt-4 border-t border-gray-200">
                <p className="text-sm text-gray-600">
                  <span className="font-medium">Venue:</span> {event.venue}
                </p>
                <p className="text-sm text-gray-600 mt-1">
                  <span className="font-medium">Status:</span>{" "}
                  <span
                    className={`inline-block px-2 py-1 rounded text-xs ${
                      event.status === "AVAILABLE"
                        ? "bg-green-100 text-green-800"
                        : event.status === "SOLD"
                        ? "bg-red-100 text-red-800"
                        : "bg-blue-100 text-blue-800"
                    }`}
                  >
                    {event.status}
                  </span>
                </p>
              </div>
            </div>
          </div>

          {/* Right side - Ticket Groups */}
          <div>
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-semibold text-gray-900">
                TICKET GROUP
              </h2>
              <button
                onClick={handleAddGroup}
                className="px-6 py-2 bg-purple-200 text-purple-900 rounded-lg hover:bg-purple-300 transition font-medium"
              >
                ADD GROUP
              </button>
            </div>

            {ticketGroupsError && (
              <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
                {ticketGroupsError}
              </div>
            )}

            <TicketGroupList
              ticketGroups={ticketGroups}
              onEdit={handleEditGroup}
              onDelete={handleDeleteGroup}
              loading={ticketGroupsLoading}
            />
          </div>
        </div>
      </div>

      {/* Modal for Create/Edit Ticket Group */}
      <TicketGroupModal
        key={selectedTicketGroup?.id || "newdd"}
        isOpen={isModalOpen}
        ticketGroup={selectedTicketGroup}
        eventId={event.id}
        onClose={() => {
          setIsModalOpen(false);
          setSelectedTicketGroup(undefined);
        }}
        onSubmit={handleModalSubmit}
        loading={ticketGroupsLoading}
      />

      {/* Modal for Edit Event */}
      {event && (
        <EventEditModal
          event={event as EventWithRelations}
          isOpen={isEditModalOpen}
          onClose={() => setIsEditModalOpen(false)}
          onUpdated={handleUpdateEvent}
        />
      )}
    </div>
  );
};
