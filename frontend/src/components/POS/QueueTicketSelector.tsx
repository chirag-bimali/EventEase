import { useState } from "react";
import type { TicketGroup } from "../../types/ticketGroup.types";

interface QueueTicketSelectorProps {
  ticketGroup: TicketGroup;
  cart: ReturnType<typeof import("../../hooks/usePOSCart").usePOSCart>;
  onBack: () => void;
}

export const QueueTicketSelector = ({ ticketGroup, cart, onBack }: QueueTicketSelectorProps) => {
  const [quantity, setQuantity] = useState(1);

  const handleAddToCart = () => {
    if (quantity <= 0) {
      alert("Please enter a valid quantity");
      return;
    }

    cart.addItem({
      ticketGroup,
      quantity,
    });

    alert(`Added ${quantity} ticket(s) to cart`);
    onBack();
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
      </div>

      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Number of Tickets
        </label>
        <input
          type="number"
          min="1"
          max={ticketGroup.quantity || 100}
          value={quantity}
          onChange={(e) => setQuantity(parseInt(e.target.value) || 1)}
          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-lg"
        />
        {ticketGroup.quantity && (
          <p className="text-sm text-gray-500 mt-1">
            Maximum: {ticketGroup.quantity} tickets
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
        className="w-full bg-purple-600 text-white py-3 px-6 rounded-lg hover:bg-purple-700 transition-colors font-medium text-lg"
      >
        Add to Cart
      </button>
    </div>
  );
};