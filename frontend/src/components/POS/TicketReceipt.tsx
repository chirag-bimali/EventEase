import type { PosOrder } from "../../types/posOrder.types";

interface TicketReceiptProps {
  order: PosOrder;
  onStartNew: () => void;
}

export const TicketReceipt = ({ order, onStartNew }: TicketReceiptProps) => {
  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="max-w-3xl mx-auto">
      <div className="bg-white rounded-lg shadow-lg p-8">
        {/* Success Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-green-100 rounded-full mb-4">
            <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h2 className="text-3xl font-bold text-gray-900 mb-2">Sale Complete!</h2>
          <p className="text-gray-600">Tickets have been generated successfully</p>
        </div>

        {/* Order Number */}
        <div className="bg-purple-50 border-2 border-purple-200 rounded-lg p-6 mb-6 text-center">
          <p className="text-sm text-gray-600 mb-1">ORDER NUMBER</p>
          <p className="text-3xl font-bold text-purple-600">{order.orderNumber}</p>
        </div>

        {/* Order Details */}
        <div className="mb-6">
          <h3 className="font-semibold text-gray-900 mb-3">Order Details</h3>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-600">Date:</span>
              <span className="font-medium">{new Date(order.createdAt).toLocaleString()}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Payment Method:</span>
              <span className="font-medium">{order.paymentMethod}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Payment Status:</span>
              <span className={`font-medium ${
                order.paymentStatus === "PAID" ? "text-green-600" : "text-yellow-600"
              }`}>
                {order.paymentStatus}
              </span>
            </div>
            {order.buyerName && (
              <div className="flex justify-between">
                <span className="text-gray-600">Buyer Name:</span>
                <span className="font-medium">{order.buyerName}</span>
              </div>
            )}
            {order.buyerPhone && (
              <div className="flex justify-between">
                <span className="text-gray-600">Phone:</span>
                <span className="font-medium">{order.buyerPhone}</span>
              </div>
            )}
            {order.buyerEmail && (
              <div className="flex justify-between">
                <span className="text-gray-600">Email:</span>
                <span className="font-medium">{order.buyerEmail}</span>
              </div>
            )}
          </div>
        </div>

        {/* Ticket Items */}
        <div className="mb-6">
          <h3 className="font-semibold text-gray-900 mb-3">Tickets Generated</h3>
          <div className="space-y-4">
            {order.items.map((item, index) => (
              <div key={item.id} className="border border-gray-200 rounded-lg p-4">
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <h4 className="font-semibold text-gray-900">Group {index + 1}</h4>
                    <p className="text-sm text-gray-600">
                      {item.quantity} tickets × ${Number(item.unitPrice).toFixed(2)}
                    </p>
                  </div>
                  <span className="font-bold text-purple-600">
                    ${Number(item.subtotal).toFixed(2)}
                  </span>
                </div>

                {/* Ticket Numbers */}
                <div className="bg-gray-50 rounded p-3">
                  <p className="text-xs text-gray-600 mb-2 font-medium">TICKET NUMBERS:</p>
                  <div className="flex flex-wrap gap-2">
                    {item.tickets.map((ticket) => (
                      <span
                        key={ticket.id}
                        className="px-3 py-1 bg-white border border-gray-300 rounded-full text-sm font-mono font-medium"
                      >
                        {ticket.seatNumber || `#${ticket.id}`}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Total */}
        <div className="border-t-2 border-gray-300 pt-4 mb-6">
          <div className="flex justify-between items-center text-2xl">
            <span className="font-bold text-gray-900">Total Paid:</span>
            <span className="font-bold text-purple-600">
              ${Number(order.totalAmount).toFixed(2)} {order.currency}
            </span>
          </div>
        </div>

        {/* Notes */}
        {order.notes && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
            <p className="text-sm font-medium text-gray-700 mb-1">Notes:</p>
            <p className="text-sm text-gray-600">{order.notes}</p>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex gap-3 print:hidden">
          <button
            onClick={handlePrint}
            className="flex-1 bg-gray-100 text-gray-700 py-3 px-6 rounded-lg hover:bg-gray-200 transition-colors font-medium flex items-center justify-center gap-2"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
            </svg>
            Print Receipt
          </button>
          <button
            onClick={onStartNew}
            className="flex-1 bg-purple-600 text-white py-3 px-6 rounded-lg hover:bg-purple-700 transition-colors font-medium"
          >
            Start New Sale
          </button>
        </div>
      </div>

      {/* Print Styles */}
      <style>{`
        @media print {
          body * {
            visibility: hidden;
          }
          .print\\:hidden {
            display: none !important;
          }
          #root, #root * {
            visibility: visible;
          }
          #root {
            position: absolute;
            left: 0;
            top: 0;
          }
        }
      `}</style>
    </div>
  );
};
