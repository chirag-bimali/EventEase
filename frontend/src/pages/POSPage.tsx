import { useState } from "react";
import Navbar from "../components/Navbar";
import { EventSelector } from "../components/POS/EventSelector";
import { TicketingStep } from "../components/POS/TicketingStep";
import { PaymentForm } from "../components/POS/PaymentForm";
import { TicketReceipt } from "../components/POS/TicketReceipt";
import { usePOSCart } from "../hooks/usePOSCart";
import { useSeatHolds } from "../hooks/useSeatHolds";
import type { Event } from "../types/event.types";
import type { PosOrder } from "../types/posOrder.types";

export const POSPage = () => {
  const [step, setStep] = useState<"event" | "ticketing" | "payment" | "receipt">("event");
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
  const [completedOrder, setCompletedOrder] = useState<PosOrder | null>(null);

  const cart = usePOSCart();
  const seatHolds = useSeatHolds();

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

  const handlePaymentComplete = (order: PosOrder) => {
    setCompletedOrder(order);
    seatHolds.clearAllHolds();
    cart.clearCart();
    setStep("receipt");
  };

  const handleStartNew = () => {
    setStep("event");
    setSelectedEvent(null);
    setCompletedOrder(null);
    cart.clearCart();
    seatHolds.clearAllHolds();
  };

  const handleBack = () => {
    if (step === "ticketing") {
      setStep("event");
      setSelectedEvent(null);
      cart.clearCart();
      seatHolds.clearAllHolds();
    } else if (step === "payment") {
      setStep("ticketing");
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      
      <div className="max-w-5xl mx-auto p-6">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-4 mb-4">
            <div className="bg-purple-100 p-3 rounded-lg">
              <svg className="w-8 h-8 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <rect x="2" y="5" width="20" height="14" rx="2" strokeWidth="2" />
                <path d="M2 10h20" strokeWidth="2" />
              </svg>
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">POINT OF SALE</h1>
              <p className="text-gray-600">Process ticket sales and generate instant QR codes.</p>
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
        {step === "event" && (
          <EventSelector onSelect={handleEventSelect} />
        )}

        {step === "ticketing" && selectedEvent && (
          <TicketingStep
            event={selectedEvent}
            cart={cart}
            seatHolds={seatHolds}
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
          <TicketReceipt
            order={completedOrder}
            onStartNew={handleStartNew}
          />
        )}
      </div>
    </div>
  );
};