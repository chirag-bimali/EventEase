import { useState, useEffect } from "react";
import Navbar from "../components/Navbar";
import { EventSelector } from "../components/POS/EventSelector";
import { TicketingStep } from "../components/POS/TicketingStep";
import { PaymentForm } from "../components/POS/PaymentForm";
import { TicketReceipt } from "../components/POS/TicketReceipt";
import { usePOSCart } from "../hooks/usePOSCart";
import { eventService } from "../services/event.service";
import {
  loadSession,
  saveSession,
  clearPOSSession,
  type POSStep,
} from "../lib/posSessionStorage";
import { releaseCartSeatReservations } from "../lib/releaseCartSeats";
import type { Event } from "../types/event.types";
import type { PosOrder } from "../types/posOrder.types";

export const POSPage = () => {
  const [step, setStep] = useState<POSStep | "receipt">("event");
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
  const [completedOrder, setCompletedOrder] = useState<PosOrder | null>(null);
  const [restoring, setRestoring] = useState(true);

  const cart = usePOSCart();

  const resetSession = async () => {
    try {
      await releaseCartSeatReservations(cart.cart);
    } catch {
      // Continue clearing local cart even if release fails
    }
    cart.clearCart();
    clearPOSSession();
  };

  useEffect(() => {
    const restore = async () => {
      const session = loadSession();

      if (session.eventId) {
        try {
          const event = await eventService.getEventById(session.eventId);
          setSelectedEvent(event);

          if (session.step === "payment" && cart.getItemCount() > 0) {
            setStep("payment");
          } else if (cart.getItemCount() > 0 || session.step !== "event") {
            setStep("ticketing");
          }
        } catch {
          cart.clearCart();
          clearPOSSession();
        }
      }

      setRestoring(false);
    };

    restore();
    // Only run on mount
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (restoring || step === "receipt") return;

    saveSession({
      eventId: selectedEvent?.id ?? null,
      step: step as POSStep,
    });
  }, [selectedEvent, step, restoring]);

  const handleEventSelect = (event: Event) => {
    setSelectedEvent(event);
    setStep("ticketing");
  };

  const handleNextToPayment = () => {
    if (cart.getItemCount() === 0) {
      alert("Please add at least one ticket to continue");
      return;
    }
    setStep("payment");
  };

  const handlePaymentComplete = async (order: PosOrder) => {
    setCompletedOrder(order);
    cart.clearCart();
    clearPOSSession();
    setStep("receipt");
  };

  const handleStartNew = async () => {
    setStep("event");
    setSelectedEvent(null);
    setCompletedOrder(null);
    await resetSession();
  };

  const handleBack = async () => {
    if (step === "ticketing") {
      setStep("event");
      setSelectedEvent(null);
      await resetSession();
    } else if (step === "payment") {
      setStep("ticketing");
    }
  };

  if (restoring) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="flex justify-center items-center py-32">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      <div className="max-w-5xl mx-auto p-6">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-4 mb-4">
            <div className="bg-purple-100 p-3 rounded-lg">
              <svg
                className="w-8 h-8 text-purple-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <rect
                  x="2"
                  y="5"
                  width="20"
                  height="14"
                  rx="2"
                  strokeWidth="2"
                />
                <path d="M2 10h20" strokeWidth="2" />
              </svg>
            </div>
            <div>
              <h1 className="text-2xl font-semibold uppercase tracking-wide text-gray-800">
                POINT OF SALE
              </h1>
              <p className="text-gray-600">
                Process ticket sales and generate instant QR codes.
              </p>
            </div>
          </div>
        </div>

        {/* Step Tabs */}
        {step !== "receipt" && (
          <div className="flex gap-2 mb-8 bg-white rounded-lg p-2 shadow">
            <button
              className={`flex-1 py-3 px-6 rounded-md font-medium transition-colors ${
                step === "event"
                  ? "bg-purple-100 text-purple-700"
                  : "text-gray-500 hover:bg-gray-100"
              }`}
              onClick={() => step !== "event" && handleBack()}
            >
              EVENT
            </button>
            <button
              className={`flex-1 py-3 px-6 rounded-md font-medium transition-colors ${
                step === "ticketing"
                  ? "bg-purple-100 text-purple-700"
                  : step === "payment"
                    ? "text-gray-500 hover:bg-gray-100"
                    : "text-gray-300 cursor-not-allowed"
              }`}
              disabled={!selectedEvent}
            >
              GROUP
            </button>
            <button
              className={`flex-1 py-3 px-6 rounded-md font-medium transition-colors ${
                step === "payment"
                  ? "bg-purple-100 text-purple-700"
                  : "text-gray-300 cursor-not-allowed"
              }`}
              disabled={cart.getItemCount() === 0}
            >
              Sale
            </button>
          </div>
        )}

        {/* Step Content */}
        {step === "event" && <EventSelector onSelect={handleEventSelect} />}

        {step === "ticketing" && selectedEvent && (
          <TicketingStep
            event={selectedEvent}
            cart={cart}
            onNext={handleNextToPayment}
            onBack={handleBack}
          />
        )}

        {step === "payment" && selectedEvent && (
          <PaymentForm
            event={selectedEvent}
            cart={cart}
            onComplete={handlePaymentComplete}
            onBack={handleBack}
          />
        )}

        {step === "receipt" && completedOrder && (
          <TicketReceipt order={completedOrder} onStartNew={handleStartNew} />
        )}
      </div>
    </div>
  );
};
