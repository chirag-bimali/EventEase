import { useCallback, useEffect, useRef, useState } from "react";
import axios from "axios";
import type {
  TicketGroup,
  SeatInfo,
  SeatLayoutRow,
  SeatStatus,
} from "../../types/ticketGroup.types";
import { posService } from "../../services/pos.service";
import { ticketService } from "../../services/ticket.service";
import { useAuth } from "../../hooks/useAuth";

interface SeatMapSelectorProps {
  ticketGroup: TicketGroup;
  cart: ReturnType<typeof import("../../hooks/usePOSCart").usePOSCart>;
  onBack: () => void;
}

const LAYOUT_POLL_MS = 5000;

export const SeatMapSelector = ({
  ticketGroup,
  cart,
  onBack,
}: SeatMapSelectorProps) => {
  const { user } = useAuth();
  const userId = user?.id;

  const existingCartItem = cart.cart.find(
    (item) => item.ticketGroup.id === ticketGroup.id,
  );
  const cartSeats = existingCartItem?.seatNumbers ?? [];

  const [selectedSeats, setSelectedSeats] = useState<string[]>(() => [
    ...cartSeats,
  ]);
  const [layout, setLayout] = useState<SeatLayoutRow[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [updatingSeat, setUpdatingSeat] = useState<string | null>(null);
  const selectedSeatsRef = useRef(selectedSeats);
  const cartSeatsRef = useRef(cartSeats);

  selectedSeatsRef.current = selectedSeats;
  cartSeatsRef.current = cartSeats;

  const loadLayout = useCallback(
    async (showLoader = false) => {
      if (showLoader) setLoading(true);
      setError(null);
      try {
        const data = await posService.getSeatLayout(ticketGroup.id);
        setLayout(data.rows);
      } catch (err: unknown) {
        const message =
          err instanceof Error ? err.message : "Failed to load seat map";
        setError(message);
      } finally {
        if (showLoader) setLoading(false);
      }
    },
    [ticketGroup.id],
  );

  useEffect(() => {
    loadLayout(true);
    const interval = setInterval(() => loadLayout(false), LAYOUT_POLL_MS);
    return () => clearInterval(interval);
  }, [loadLayout]);

  const releaseSeats = async (seatNumbers: string[]) => {
    if (!seatNumbers.length) return;
    await ticketService.updateSeatStatus(
      ticketGroup.id,
      seatNumbers,
      "AVAILABLE",
    );
  };

  const isSelectedSeat = (seatNumber: string) =>
    selectedSeats.includes(seatNumber);

  const isOwnReservation = (seat: SeatInfo) =>
    userId != null &&
    seat.reservedById != null &&
    Number(seat.reservedById) === Number(userId);

  const canToggleSeat = (seat: SeatInfo) => {
    if (seat.status === "SOLD" || seat.status === "USED") return false;
    if (isSelectedSeat(seat.seatNumber)) return true;
    if (seat.status === "AVAILABLE") return true;
    if (seat.status === "RESERVED" && isOwnReservation(seat)) return true;
    return false;
  };

  const syncCartSeats = (seatNumbers: string[]) => {
    if (seatNumbers.length > 0) {
      cart.addItem({ ticketGroup, seatNumbers });
    } else {
      cart.removeItem(ticketGroup.id);
    }
  };

  const handleSeatClick = async (seat: SeatInfo) => {
    if (!canToggleSeat(seat) || updatingSeat) {
      return;
    }

    const isSelected = isSelectedSeat(seat.seatNumber);
    setUpdatingSeat(seat.seatNumber);

    try {
      if (isSelected) {
        await releaseSeats([seat.seatNumber]);
        setSelectedSeats((prev) =>
          prev.filter((s) => s !== seat.seatNumber),
        );
        if (cartSeats.includes(seat.seatNumber)) {
          syncCartSeats(
            cartSeats.filter((s) => s !== seat.seatNumber),
          );
        }
      } else {
        await ticketService.updateSeatStatus(
          ticketGroup.id,
          [seat.seatNumber],
          "RESERVED",
        );
        setSelectedSeats((prev) => [...prev, seat.seatNumber]);
      }
      await loadLayout(false);
    } catch (err: unknown) {
      let message = "Failed to update seat";
      if (axios.isAxiosError(err) && err.response?.data?.message) {
        message = err.response.data.message;
      } else if (err instanceof Error) {
        message = err.message;
      }
      alert(message);
      await loadLayout(false);
    } finally {
      setUpdatingSeat(null);
    }
  };

  const handleConfirmSelection = () => {
    if (selectedSeats.length === 0) {
      return;
    }

    cart.addItem({
      ticketGroup,
      seatNumbers: selectedSeats,
    });

    onBack();
  };

  const handleClearSelection = async () => {
    if (selectedSeats.length === 0) return;

    try {
      await releaseSeats(selectedSeats);
      setSelectedSeats([]);
      if (existingCartItem) {
        cart.removeItem(ticketGroup.id);
      }
      await loadLayout(false);
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : "Failed to clear selection";
      alert(message);
    }
  };

  const handleBack = async () => {
    const pendingRelease = selectedSeatsRef.current.filter(
      (seat) => !cartSeatsRef.current.includes(seat),
    );
    try {
      if (pendingRelease.length > 0) {
        await releaseSeats(pendingRelease);
      }
    } catch {
      // Still navigate back if release fails
    }
    onBack();
  };

  const getSeatColor = (status: SeatStatus) => {
    switch (status) {
      case "SELECETED":
        return "bg-purple-600 text-white hover:bg-purple-700 cursor-pointer";
      case "SOLD":
      case "USED":
        return "bg-red-500 text-white cursor-not-allowed";
      case "RESERVED":
        return "bg-yellow-500 text-white cursor-not-allowed";
      case "AVAILABLE":
        return "bg-green-500 text-white hover:bg-green-600 cursor-pointer";
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
        <button
          onClick={handleBack}
          className="mt-4 text-purple-600 hover:text-purple-700 font-medium"
        >
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
          onClick={handleBack}
          className="text-purple-600 hover:text-purple-700 font-medium flex items-center gap-2"
        >
          <svg
            className="w-5 h-5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M15 19l-7-7 7-7"
            />
          </svg>
          Back to Groups
        </button>
      </div>

      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          {ticketGroup.name}
        </h2>
        <span className="text-xl font-bold text-purple-600">
          ${Number(ticketGroup.price).toFixed(2)} per seat
        </span>
      </div>

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

      <div className="mb-4">
        <div className="bg-gray-800 text-white text-center py-3 rounded-lg font-semibold">
          STAGE
        </div>
      </div>

      <div className="mb-6 overflow-x-auto">
        <div className="inline-block min-w-full">
          {layout.map((row) => (
            <div key={row.row} className="flex items-center gap-2 mb-2">
              <div className="w-8 text-center font-bold text-gray-700">
                {row.row}
              </div>
              <div className="flex gap-1">
                {row.seats.map((seat) => {
                  const isSelected = isSelectedSeat(seat.seatNumber);
                  const status = isSelected ? "SELECETED" : seat.status;
                  const isDisabled =
                    !canToggleSeat(seat) || updatingSeat !== null;

                  return (
                    <button
                      key={seat.seatNumber}
                      onClick={() => handleSeatClick(seat)}
                      disabled={isDisabled}
                      className={`w-10 h-10 rounded text-xs font-medium transition-colors ${getSeatColor(
                        status,
                      )} ${isSelected ? "cursor-pointer" : ""} ${updatingSeat === seat.seatNumber ? "opacity-60" : ""}`}
                      title={`${seat.seatNumber} - ${status}`}
                    >
                      {seat.seatNumber.replace(row.row, "")}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </div>

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
            {selectedSeats.map((seatNumber) => (
              <span
                key={seatNumber}
                className="px-3 py-1 bg-white border border-purple-300 rounded-full text-sm font-medium"
              >
                {seatNumber}
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

      <button
        onClick={handleConfirmSelection}
        disabled={selectedSeats.length === 0 || updatingSeat !== null}
        className="w-full bg-purple-600 text-white py-3 px-6 rounded-lg hover:bg-purple-700 transition-colors font-medium text-lg disabled:opacity-50 disabled:cursor-not-allowed"
      >
        Add to Cart ({selectedSeats.length} seat
        {selectedSeats.length !== 1 ? "s" : ""})
      </button>
    </div>
  );
};
