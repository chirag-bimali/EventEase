import { ticketService } from "../../services/ticket.service";
import type { CartItem } from "../../hooks/usePOSCart";

interface CartSummaryProps {
  cart: ReturnType<typeof import("../../hooks/usePOSCart").usePOSCart>;
  onCheckout: () => void;
  onBack: () => void;
  showBackButton?: boolean;
}

export const CartSummary = ({ cart, onCheckout, onBack, showBackButton = true }: CartSummaryProps) => {
  const itemCount = cart.getItemCount();
  const total = cart.getTotal();

  const handleRemoveItem = async (item: CartItem) => {
    if (item.seatNumbers?.length) {
      try {
        await ticketService.updateSeatStatus(
          item.ticketGroup.id,
          item.seatNumbers,
          "AVAILABLE",
        );
      } catch {
        // Still remove from cart if release fails
      }
    }
    cart.removeItem(item.ticketGroup.id);
  };

  return (
    <div className="bg-white rounded-lg shadow-lg p-6 sticky top-6">
      <h3 className="text-xl font-bold text-gray-900 mb-4">Cart Summary</h3>

      {/* Cart Items */}
      {cart.cart.length === 0 ? (
        <p className="text-gray-500 text-center py-8">No items in cart</p>
      ) : (
        <div className="space-y-3 mb-4">
          {cart.cart.map((item) => (
            <div key={item.ticketGroup.id} className="border-b border-gray-200 pb-3">
              <div className="flex justify-between items-start mb-1">
                <h4 className="font-semibold text-gray-900">{item.ticketGroup.name}</h4>
                <button
                  onClick={() => handleRemoveItem(item)}
                  className="text-red-500 hover:text-red-700"
                  title="Remove"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              <div className="text-sm text-gray-600">
                {item.seatNumbers ? (
                  <div>
                    <p className="font-medium">Seats: {item.seatNumbers.join(", ")}</p>
                    <p>{item.seatNumbers.length} × ${Number(item.ticketGroup.price).toFixed(2)}</p>
                  </div>
                ) : (
                  <p>{item.quantity} × ${Number(item.ticketGroup.price).toFixed(2)}</p>
                )}
              </div>
              <div className="text-right font-semibold text-gray-900 mt-1">
                ${((item.quantity || item.seatNumbers?.length || 0) * Number(item.ticketGroup.price)).toFixed(2)}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Total */}
      <div className="border-t border-gray-300 pt-4 mb-4">
        <div className="flex justify-between items-center mb-2">
          <span className="text-gray-700">Total Items:</span>
          <span className="font-semibold">{itemCount}</span>
        </div>
        <div className="flex justify-between items-center text-xl">
          <span className="font-bold text-gray-900">Total:</span>
          <span className="font-bold text-purple-600">${total.toFixed(2)}</span>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="space-y-2">
        <button
          onClick={onCheckout}
          disabled={itemCount === 0}
          className="w-full bg-purple-600 text-white py-3 px-6 rounded-lg hover:bg-purple-700 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Proceed to Payment
        </button>
        {showBackButton && (
          <button
            onClick={onBack}
            className="w-full bg-gray-100 text-gray-700 py-3 px-6 rounded-lg hover:bg-gray-200 transition-colors font-medium"
          >
            Back to Events
          </button>
        )}
      </div>
    </div>
  );
};
