import { useState } from "react";
import { usePOS } from "../../hooks/usePOS";
import type { Event } from "../../types/event.types";
import type { PaymentMethod, PosOrder } from "../../types/posOrder.types";

interface PaymentFormProps {
  event: Event;
  cart: ReturnType<typeof import("../../hooks/usePOSCart").usePOSCart>;
  onComplete: (order: PosOrder) => void;
  onBack: () => void;
}

export const PaymentForm = ({ event, cart, onComplete, onBack }: PaymentFormProps) => {
  const { createOrder, loading, error } = usePOS();
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("CASH");
  const [buyerName, setBuyerName] = useState("");
  const [buyerPhone, setBuyerPhone] = useState("");
  const [buyerEmail, setBuyerEmail] = useState("");
  const [notes, setNotes] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (cart.cart.length === 0) {
      alert("Cart is empty");
      return;
    }

    const orderData = {
      eventId: event.id,
      items: cart.cart.map((item) => ({
        ticketGroupId: item.ticketGroup.id,
        seatType: item.ticketGroup.seatType,
        quantity: item.quantity,
        seatNumbers: item.seatNumbers,
        unitPrice: Number(item.ticketGroup.price),
      })),
      paymentMethod,
      buyerName: buyerName || undefined,
      buyerPhone: buyerPhone || undefined,
      buyerEmail: buyerEmail || undefined,
      notes: notes || undefined,
    };

    const order = await createOrder(orderData);
    
    if (order) {
      onComplete(order);
    }
  };

  return (
    <div className="max-w-3xl mx-auto">
      <div className="bg-white rounded-lg shadow-lg p-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-6">Complete Sale</h2>

        <form onSubmit={handleSubmit}>
          {/* Order Summary */}
          <div className="bg-purple-50 rounded-lg p-4 mb-6">
            <h3 className="font-semibold text-gray-900 mb-3">Order Summary</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-700">Event:</span>
                <span className="font-medium">{event.name}</span>
              </div>
              {cart.cart.map((item) => (
                <div key={item.ticketGroup.id} className="flex justify-between">
                  <span className="text-gray-700">{item.ticketGroup.name}:</span>
                  <span className="font-medium">
                    {item.quantity || item.seatNumbers?.length} × ${Number(item.ticketGroup.price).toFixed(2)}
                  </span>
                </div>
              ))}
              <div className="flex justify-between pt-2 border-t border-purple-200 text-lg">
                <span className="font-bold">Total:</span>
                <span className="font-bold text-purple-600">
                  ${cart.getTotal().toFixed(2)}
                </span>
              </div>
            </div>
          </div>

          {/* Payment Method */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Payment Method *
            </label>
            <div className="grid grid-cols-2 gap-3">
              {(["CASH", "CARD", "ONLINE", "OTHER"] as PaymentMethod[]).map((method) => (
                <button
                  key={method}
                  type="button"
                  onClick={() => setPaymentMethod(method)}
                  className={`py-3 px-4 rounded-lg border-2 font-medium transition-colors ${
                    paymentMethod === method
                      ? "border-purple-600 bg-purple-50 text-purple-700"
                      : "border-gray-300 bg-white text-gray-700 hover:border-gray-400"
                  }`}
                >
                  {method}
                </button>
              ))}
            </div>
          </div>

          {/* Buyer Information */}
          <div className="mb-6">
            <h3 className="font-semibold text-gray-900 mb-3">Buyer Information (Optional)</h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Name
                </label>
                <input
                  type="text"
                  value={buyerName}
                  onChange={(e) => setBuyerName(e.target.value)}
                  placeholder="Enter buyer name"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Phone
                </label>
                <input
                  type="tel"
                  value={buyerPhone}
                  onChange={(e) => setBuyerPhone(e.target.value)}
                  placeholder="Enter phone number"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Email
                </label>
                <input
                  type="email"
                  value={buyerEmail}
                  onChange={(e) => setBuyerEmail(e.target.value)}
                  placeholder="Enter email address"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Notes
                </label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Add any notes about this order"
                  rows={3}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                />
              </div>
            </div>
          </div>

          {/* Error Message */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
              <p className="text-red-600 font-medium">{error}</p>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex gap-3">
            <button
              type="button"
              onClick={onBack}
              disabled={loading}
              className="flex-1 bg-gray-100 text-gray-700 py-3 px-6 rounded-lg hover:bg-gray-200 transition-colors font-medium disabled:opacity-50"
            >
              Back
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 bg-purple-600 text-white py-3 px-6 rounded-lg hover:bg-purple-700 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                  Processing...
                </span>
              ) : (
                "Complete Sale"
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
