import { useState } from "react";
import type { TicketGroup } from "../../types/ticketGroup.types";
import { useTicketAvailability } from "../../hooks/useTicketAvailability";

interface GeneralTicketSelectorProps {
  ticketGroups: TicketGroup[];
  cart: ReturnType<typeof import("../../hooks/usePOSCart").usePOSCart>;
  onBack: () => void;
}

interface GroupSelection {
  ticketGroup: TicketGroup;
  quantity: number;
  availability: ReturnType<typeof useTicketAvailability>;
}

export const GeneralTicketSelector = ({ ticketGroups, cart, onBack }: GeneralTicketSelectorProps) => {
  const [selections, setSelections] = useState<GroupSelection[]>(() =>
    ticketGroups.map((group) => {
      const cartItem = cart.cart.find((item) => item.ticketGroup.id === group.id);
      return {
        ticketGroup: group,
        quantity: cartItem?.quantity || 0,
        availability: { loading: true, availability: null, error: null, isUnlimited: false, isSoldOut: false, hasAvailability: false },
      };
    })
  );

  const updateQuantity = (groupId: number, quantity: number) => {
    setSelections((prev) =>
      prev.map((sel) => {
        if (sel.ticketGroup.id !== groupId) return sel;
        
        const availability = sel.availability.availability;
        const maxQuantity = availability?.available === -1 
          ? 999 
          : availability?.available || 0;
        
        return {
          ...sel,
          quantity: Math.max(0, Math.min(quantity, maxQuantity)),
        };
      })
    );
  };

  const handleAddToCart = () => {
    const validSelections = selections.filter((sel) => sel.quantity > 0);
    
    if (validSelections.length === 0) {
      alert("Please select at least one ticket");
      return;
    }

    validSelections.forEach((sel) => {
      cart.addItem({
        ticketGroup: sel.ticketGroup,
        quantity: sel.quantity,
      });
    });

    alert(`Added ${validSelections.length} group(s) to cart`);
    onBack();
  };

  const getTotal = () => {
    return selections.reduce(
      (total, sel) => total + Number(sel.ticketGroup.price) * sel.quantity,
      0
    );
  };

  const getTotalTickets = () => {
    return selections.reduce((total, sel) => total + sel.quantity, 0);
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

      <h2 className="text-2xl font-bold text-gray-900 mb-6">Select Tickets</h2>

      <div className="space-y-4 mb-6">
        {selections.map((selection) => (
          <TicketGroupRow
            key={selection.ticketGroup.id}
            selection={selection}
            onUpdateQuantity={updateQuantity}
          />
        ))}
      </div>

      {getTotalTickets() > 0 && (
        <div className="bg-purple-50 rounded-lg p-4 mb-6">
          <div className="flex justify-between items-center mb-2">
            <span className="text-gray-700">Total Tickets:</span>
            <span className="font-semibold">{getTotalTickets()}</span>
          </div>
          <div className="flex justify-between items-center text-lg">
            <span className="font-medium text-gray-700">Total:</span>
            <span className="font-bold text-purple-600">
              ${getTotal().toFixed(2)}
            </span>
          </div>
        </div>
      )}

      <button
        onClick={handleAddToCart}
        disabled={getTotalTickets() === 0}
        className="w-full bg-purple-600 text-white py-3 px-6 rounded-lg hover:bg-purple-700 transition-colors font-medium text-lg disabled:opacity-50 disabled:cursor-not-allowed"
      >
        Add to Cart
      </button>
    </div>
  );
};

// Separate component for each ticket group row with its own availability hook
const TicketGroupRow = ({
  selection,
  onUpdateQuantity,
}: {
  selection: { ticketGroup: TicketGroup; quantity: number };
  onUpdateQuantity: (groupId: number, quantity: number) => void;
}) => {
  const { availability, loading, isUnlimited, isSoldOut } = useTicketAvailability(
    selection.ticketGroup.id
  );

  const maxQuantity = availability?.available === -1 ? 999 : availability?.available || 0;
  const canIncrease = !isSoldOut && (isUnlimited || selection.quantity < maxQuantity);

  return (
    <div className="border border-gray-200 rounded-lg p-4">
      <div className="flex justify-between items-start mb-3">
        <div>
          <h3 className="font-semibold text-gray-900">{selection.ticketGroup.name}</h3>
          {selection.ticketGroup.description && (
            <p className="text-sm text-gray-600 mt-1">{selection.ticketGroup.description}</p>
          )}
          
          {/* Availability Display */}
          <div className="mt-2">
            {loading ? (
              <span className="text-xs text-gray-500">Loading availability...</span>
            ) : isSoldOut ? (
              <span className="text-xs font-medium text-red-600 bg-red-50 px-2 py-1 rounded">
                SOLD OUT
              </span>
            ) : isUnlimited ? (
              <span className="text-xs font-medium text-green-600 bg-green-50 px-2 py-1 rounded">
                UNLIMITED AVAILABLE
              </span>
            ) : (
              <span className="text-xs font-medium text-blue-600 bg-blue-50 px-2 py-1 rounded">
                {availability?.available} AVAILABLE
              </span>
            )}
          </div>
        </div>
        <span className="text-lg font-bold text-purple-600">
          ${Number(selection.ticketGroup.price).toFixed(2)}
        </span>
      </div>

      <div className="flex items-center gap-3">
        <button
          onClick={() => onUpdateQuantity(selection.ticketGroup.id, selection.quantity - 1)}
          disabled={selection.quantity === 0}
          className="w-10 h-10 rounded-lg border border-gray-300 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed font-bold text-lg"
        >
          -
        </button>
        <input
          type="number"
          min="0"
          max={maxQuantity}
          value={selection.quantity}
          onChange={(e) => onUpdateQuantity(selection.ticketGroup.id, parseInt(e.target.value) || 0)}
          disabled={loading || isSoldOut}
          className="w-20 text-center px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent disabled:bg-gray-100"
        />
        <button
          onClick={() => onUpdateQuantity(selection.ticketGroup.id, selection.quantity + 1)}
          disabled={!canIncrease || loading}
          className="w-10 h-10 rounded-lg border border-gray-300 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed font-bold text-lg"
        >
          +
        </button>
        {selection.quantity > 0 && (
          <span className="ml-auto text-sm font-medium text-gray-700">
            Subtotal: ${(Number(selection.ticketGroup.price) * selection.quantity).toFixed(2)}
          </span>
        )}
      </div>
    </div>
  );
};