import { useEffect, useState } from "react";
import { QueueTicketSelector } from "./QueueTicketSelector";
import { GeneralTicketSelector } from "./GeneralTicketSelector";
import { SeatMapSelector } from "./SeatMapSelector";
import { CartSummary } from "./CartSummary";
import { useTicketGroups } from "../../hooks/useTicketGroups";
import type { Event } from "../../types/event.types";
import type { TicketGroup } from "../../types/ticketGroup.types";

interface TicketingStepProps {
  event: Event;
  cart: ReturnType<typeof import("../../hooks/usePOSCart").usePOSCart>;
  seatHolds: ReturnType<typeof import("../../hooks/useSeatHolds").useSeatHolds>;
  onNext: () => void;
  onBack: () => void;
}

export const TicketingStep = ({
  event,
  cart,
  seatHolds,
  onNext,
  onBack,
}: TicketingStepProps) => {
  const { ticketGroups, fetchTicketGroupsByEvent, loading, error } =
    useTicketGroups();

  useEffect(() => {
    // Fetch ticket groups for the selected event
    (async () => {
      await fetchTicketGroupsByEvent(event.id);
    })();
  }, [event.id, fetchTicketGroupsByEvent]);

  const [selectedGroup, setSelectedGroup] = useState<TicketGroup | null>(() =>
    ticketGroups.length === 1 ? ticketGroups[0] : null
  );

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

  if (ticketGroups.length === 0) {
    return (
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 text-center">
        <p className="text-yellow-700 mb-4">
          No ticket groups available for this event.
        </p>
        <button
          onClick={onBack}
          className="text-purple-600 hover:text-purple-700 font-medium"
        >
          ← Back to Events
        </button>
      </div>
    );
  }

  const renderSelector = () => {
    if (!selectedGroup) return null;

    switch (selectedGroup.seatType) {
      case "QUEUE":
        return (
          <QueueTicketSelector
            ticketGroup={selectedGroup}
            cart={cart}
            onBack={() => setSelectedGroup(null)}
          />
        );
      case "GENERAL":
        return (
          <GeneralTicketSelector
            ticketGroups={ticketGroups}
            cart={cart}
            onBack={() => setSelectedGroup(null)}
          />
        );
      case "SEAT":
        return (
          <SeatMapSelector
            ticketGroup={selectedGroup}
            cart={cart}
            seatHolds={seatHolds}
            onBack={() => setSelectedGroup(null)}
          />
        );
      default:
        return null;
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Main Content */}
      <div className="lg:col-span-2">
        {!selectedGroup ? (
          <div>
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              SELECT TICKET GROUP
            </h2>

            <div className="grid gap-4">
              {ticketGroups.map((group) => (
                <div
                  key={group.id}
                  className="bg-white border border-gray-200 rounded-lg p-6 hover:border-purple-300 hover:shadow-md transition-all cursor-pointer"
                  onClick={() => setSelectedGroup(group)}
                >
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="text-lg font-bold text-gray-900">
                      {group.name}
                    </h3>
                    <span className="text-2xl font-bold text-purple-600">
                      ${Number(group.price).toFixed(2)}
                    </span>
                  </div>

                  {group.description && (
                    <p className="text-sm text-gray-600 mb-3">
                      {group.description}
                    </p>
                  )}

                  <div className="flex items-center gap-4">
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-medium ${
                        group.seatType === "SEAT"
                          ? "bg-blue-100 text-blue-700"
                          : group.seatType === "QUEUE"
                          ? "bg-green-100 text-green-700"
                          : "bg-purple-100 text-purple-700"
                      }`}
                    >
                      {group.seatType}
                    </span>

                    {group.seatType !== "SEAT" && group.quantity && (
                      <span className="text-sm text-gray-600">
                        Capacity: {group.quantity}
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          renderSelector()
        )}
      </div>

      {/* Cart Summary Sidebar */}
      <div className="lg:col-span-1">
        <CartSummary
          cart={cart}
          seatHolds={seatHolds}
          onCheckout={onNext}
          onBack={onBack}
          showBackButton={!selectedGroup}
        />
      </div>
    </div>
  );
};
