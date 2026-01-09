import { useState, useEffect } from "react";
import { usePOS } from "../../hooks/usePOS";
import type { TicketGroup, SeatLayout, SeatInfo } from "../../types/ticketGroup.types";

interface SeatMapSelectorProps {
  ticketGroup: TicketGroup;
  cart: ReturnType<typeof import("../../hooks/usePOSCart").usePOSCart>;
  seatHolds: ReturnType<typeof import("../../hooks/useSeatHolds").useSeatHolds>;
  onBack: () => void;
}

export const SeatMapSelector = ({ ticketGroup, cart, seatHolds, onBack }: SeatMapSelectorProps) => {
  const { getSeatLayout, createHolds, loading, error, getSeatHoldsByTicketGroup } = usePOS();
  const [layout, setLayout] = useState<SeatLayout | null>(null);
  const [selectedSeats, setSelectedSeats] = useState<string[]>([]);

  useEffect(() => {
    const loadLayout = async () => {
      const data = await getSeatLayout(ticketGroup.id);
      if (data) {
        console.log("Loaded seat layout:", data);
        setLayout(data);
      }
    };

    loadLayout();
  }, [ticketGroup.id, getSeatLayout]);

  const handleSeatClick = (seat: SeatInfo) => {
    if (seat.status === "SOLD") return;
    if (seat.status === "RESERVED" && !selectedSeats.includes(seat.seatNumber)) return;

    setSelectedSeats((prev) => {
      if (prev.includes(seat.seatNumber)) {
        return prev.filter((s) => s !== seat.seatNumber);
      }
      return [...prev, seat.seatNumber];
    });
  };

  const handleConfirmSelection = async () => {
    if (selectedSeats.length === 0) {
      alert("Please select at least one seat");
      return;
    }

    try {

      // Create holds for selected seats
      await createHolds(ticketGroup.id, selectedSeats, 10);
      const holds = await getSeatHoldsByTicketGroup(ticketGroup.id);
    
      if (holds) {
        seatHolds.addHolds(holds, ticketGroup.id, selectedSeats);
      
        cart.addItem({
          ticketGroup,
          seatNumbers: selectedSeats,
        });

        alert(`Reserved ${selectedSeats.length} seat(s) for 10 minutes`);
        onBack();
      }
    } catch (err) {
      alert(`Failed to reserve seats: ${err instanceof Error ? err.message : 'Unknown error'}`);

      const data = await getSeatLayout(ticketGroup.id);
      if (data) {
        setLayout(data);
      }
      // Clear selection
      setSelectedSeats([]);
    }
  };

  const handleClearSelection = () => {
    setSelectedSeats([]);
  };

  const getSeatColor = (seat: SeatInfo) => {
    if (selectedSeats.includes(seat.seatNumber)) {
      return "bg-purple-600 text-white hover:bg-purple-700";
    }
    switch (seat.status) {
      case "SOLD":
        return "bg-red-500 text-white cursor-not-allowed";
      case "RESERVED":
        return "bg-yellow-500 text-white cursor-not-allowed";
      case "AVAILABLE":
      default:
        return "bg-green-500 text-white hover:bg-green-600 cursor-pointer";
    }
  };

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
        <button onClick={onBack} className="mt-4 text-purple-600 hover:text-purple-700 font-medium">
          ← Back to Groups
        </button>
      </div>
    );
  }

  if (!layout) {
    return <div>Loading seat map...</div>;
  }

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="mb-6">
        <button
          onClick={onBack}
          className="text-purple-600 hover:text-purple-700 font-medium flex items-center gap-2"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" />
          </svg>
          Back to Groups
        </button>
      </div>

      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">{ticketGroup.name}</h2>
        <span className="text-xl font-bold text-purple-600">
          ${Number(ticketGroup.price).toFixed(2)} per seat
        </span>
      </div>

      {/* Legend */}
      <div className="flex gap-6 mb-6 text-sm">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-green-500 rounded"></div>
          <span>Available</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-purple-600 rounded"></div>
          <span>Selected</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-yellow-500 rounded"></div>
          <span>Reserved</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-red-500 rounded"></div>
          <span>Sold</span>
        </div>
      </div>

      {/* Stage */}
      <div className="mb-4">
        <div className="bg-gray-800 text-white text-center py-3 rounded-lg font-semibold">
          STAGE
        </div>
      </div>

      {/* Seat Map */}
      <div className="mb-6 overflow-x-auto">
        <div className="inline-block min-w-full">
          {layout.rows.map((row) => (
            <div key={row.row} className="flex items-center gap-2 mb-2">
              <div className="w-8 text-center font-bold text-gray-700">{row.row}</div>
              <div className="flex gap-1">
                {row.seats.map((seat) => {
                  
                  return (
                    <button
                      key={seat.seatNumber}
                      onClick={() => handleSeatClick(seat)}
                      disabled={seat.status === "SOLD" || (seat.status === "RESERVED" && !selectedSeats.includes(seat.seatNumber))}
                      className={`w-10 h-10 rounded text-xs font-medium transition-colors ${getSeatColor(seat)
                        }`}
                      title={`${seat.seatNumber} - ${seat.status}`}
                    >
                      {seat.seatNumber.replace(row.row, "")}
                    </button>
                  )
                })}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Selection Summary */}
      {selectedSeats.length > 0 && (
        <div className="bg-purple-50 rounded-lg p-4 mb-4">
          <div className="flex justify-between items-center mb-2">
            <span className="font-medium text-gray-700">Selected Seats:</span>
            <button
              onClick={handleClearSelection}
              className="text-sm text-purple-600 hover:text-purple-700 font-medium"
            >
              Clear
            </button>
          </div>
          <div className="flex flex-wrap gap-2 mb-3">
            {selectedSeats.map((seat) => (
              <span
                key={seat}
                className="px-3 py-1 bg-white border border-purple-300 rounded-full text-sm font-medium"
              >
                {seat}
              </span>
            ))}
          </div>
          <div className="flex justify-between items-center text-lg pt-3 border-t border-purple-200">
            <span className="font-medium text-gray-700">Total:</span>
            <span className="font-bold text-purple-600">
              ${(Number(ticketGroup.price) * selectedSeats.length).toFixed(2)}
            </span>
          </div>
        </div>
      )}

      {/* Action Buttons */}
      <button
        onClick={handleConfirmSelection}
        disabled={selectedSeats.length === 0}
        className="w-full bg-purple-600 text-white py-3 px-6 rounded-lg hover:bg-purple-700 transition-colors font-medium text-lg disabled:opacity-50 disabled:cursor-not-allowed"
      >
        Confirm Selection ({selectedSeats.length} seat{selectedSeats.length !== 1 ? "s" : ""})
      </button>
    </div>
  );
};
