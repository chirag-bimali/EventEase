import { useState } from "react";
import type { TicketGroup } from "../../types/ticketGroup.types";
import { useTicketAvailability } from "../../hooks/useTicketAvailability";

interface QueueTicketSelectorProps {
  ticketGroup: TicketGroup;
  cart: ReturnType<typeof import("../../hooks/usePOSCart").usePOSCart>;
  onBack: () => void;
}

export const QueueTicketSelector = ({ ticketGroup, cart, onBack }: QueueTicketSelectorProps) => {
  const [quantity, setQuantity] = useState(1);
  const { availability, loading, isUnlimited, isSoldOut, hasAvailability } = useTicketAvailability(
    ticketGroup.id
  );

  const maxQuantity = availability?.available === -1 ? 999 : availability?.available || 0;

  const handleAddToCart = () => {
    if (quantity <= 0) {
      alert("Please enter a valid quantity");
      return;
    }

    if (!hasAvailability) {
      alert("This ticket is sold out or unavailable");
      return;
    }

    if (!isUnlimited && quantity > maxQuantity) {
      alert(`Only ${maxQuantity} tickets available`);
      return;
    }

    cart.addItem({
      ticketGroup,
      quantity,
    });

    alert(`Added ${quantity} ticket(s) to cart`);
    onBack();
  };

  const handleQuantityChange = (newQuantity: number) => {
    if (newQuantity < 1) {
      setQuantity(1);
    } else if (!isUnlimited && newQuantity > maxQuantity) {
      setQuantity(maxQuantity);
    } else {
      setQuantity(newQuantity);
    }
  };

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
        {ticketGroup.description && (
          <p className="text-gray-600">{ticketGroup.description}</p>
        )}
        <div className="mt-4">
          <span className="text-3xl font-bold text-purple-600">
            ${Number(ticketGroup.price).toFixed(2)}
          </span>
          <span className="text-gray-600 ml-2">per ticket</span>
        </div>

        {/* Availability Display */}
        <div className="mt-4">
          {loading ? (
            <div className="flex items-center gap-2">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-purple-600"></div>
              <span className="text-sm text-gray-500">Checking availability...</span>
            </div>
          ) : isSoldOut ? (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3">
              <span className="text-sm font-medium text-red-600">❌ SOLD OUT</span>
            </div>
          ) : isUnlimited ? (
            <div className="bg-green-50 border border-green-200 rounded-lg p-3">
              <span className="text-sm font-medium text-green-600">✓ Unlimited tickets available</span>
            </div>
          ) : (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
              <span className="text-sm font-medium text-blue-600">
                ✓ {availability?.available} tickets available
              </span>
            </div>
          )}
        </div>
      </div>

      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Number of Tickets
        </label>
        <input
          type="number"
          min="1"
          max={isUnlimited ? 999 : maxQuantity}
          value={quantity}
          onChange={(e) => handleQuantityChange(parseInt(e.target.value) || 1)}
          disabled={loading || isSoldOut}
          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-lg disabled:bg-gray-100 disabled:cursor-not-allowed"
        />
        {!isUnlimited && !isSoldOut && (
          <p className="text-sm text-gray-500 mt-1">
            Maximum: {maxQuantity} tickets
          </p>
        )}
      </div>

      <div className="bg-purple-50 rounded-lg p-4 mb-6">
        <div className="flex justify-between items-center text-lg">
          <span className="font-medium text-gray-700">Total:</span>
          <span className="font-bold text-purple-600">
            ${(Number(ticketGroup.price) * quantity).toFixed(2)}
          </span>
        </div>
      </div>

      <button
        onClick={handleAddToCart}
        disabled={loading || isSoldOut || !hasAvailability}
        className="w-full bg-purple-600 text-white py-3 px-6 rounded-lg hover:bg-purple-700 transition-colors font-medium text-lg disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {isSoldOut ? "Sold Out" : "Add to Cart"}
      </button>
    </div>
  );
};