import { useState } from "react";
import Navbar from "../components/Navbar";
import { useEvents } from "../hooks/useEvents";
import CreateEventModel from "../components/CreateEventModel";
import { EventCard } from "../components/EventCard";

export const EventsPage = () => {
  const { events, loading, error, refetch } = useEvents({});

  const [showCreateModal, setShowCreateModal] = useState(false);

  const renderBody = () => {
    if (loading) return <div className="p-6">Loading events...</div>;
    if (error) return <div className="p-6 text-red-600">Error: {error}</div>;

    return (
      <>
        <div className="flex items-center justify-between p-6">
          <div>
            <h1 className="text-2xl font-semibold uppercase tracking-wide text-gray-800">
              Events
            </h1>
            <p className="text-gray-600">
              View and manage all events in the system.
            </p>
          </div>
          <button
            onClick={() => setShowCreateModal(true)}
            className="rounded-sm bg-purple-200 px-5 py-2 text-sm font-semibold uppercase text-purple-800 transition hover:bg-purple-300 cursor-pointer"
          >
            Create New Event
          </button>
        </div>

        <div className="grid grid-cols-1 gap-6 px-6 pb-10 md:grid-cols-2 lg:grid-cols-3">
          {events.map((event) => (
            <EventCard key={event.id} event={event} />
          ))}
        </div>
      </>
    );
  };

  return (
    <div className="min-h-screen bg-white">
      <Navbar />
      <div className="max-w-5xl mx-auto">{renderBody()}</div>

      {showCreateModal && (
        <CreateEventModel
          onClose={() => setShowCreateModal(false)}
          onCreated={() => {
            refetch();
            setShowCreateModal(false);
          }}
        />
      )}
    </div>
  );
};
