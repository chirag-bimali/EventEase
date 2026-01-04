import { useEffect, useState } from "react";
import { useQRCode } from "../../hooks/useQRCode";
import type { PosOrder } from "../../types/posOrder.types";
import { useTicketGroups } from "../../hooks/useTicketGroups";

interface TicketReceiptProps {
  order: PosOrder;
  onStartNew: () => void;
}

interface TicketQRData {
  ticketId: number;
  qrDataUrl: string;
  seatNumber: string;
}

export const TicketReceipt = ({ order, onStartNew }: TicketReceiptProps) => {
  const { ticketGroup, fetchTicketGroupById } = useTicketGroups();
  const { generateQRDataUrl } = useQRCode();
  const [ticketQRs, setTicketQRs] = useState<TicketQRData[]>([]);
  const [loadingQRs, setLoadingQRs] = useState(true);

  const ticketGroupId = order.items[0]?.ticketGroupId;

  useEffect(() => {
    if (!ticketGroupId) return;

    fetchTicketGroupById(ticketGroupId);
  }, [ticketGroupId, fetchTicketGroupById]);

  // Generate QR codes on mount
  useEffect(() => {
    const generateAllQRs = async () => {
      try {
        const qrDataMap: TicketQRData[] = [];
        console.log(order);

        for (const item of order.items) {
          for (const ticket of item.tickets) {
            if (ticket.qrToken) {
              const qrDataUrl = await generateQRDataUrl(ticket.qrToken);
              qrDataMap.push({
                ticketId: ticket.id,
                qrDataUrl,
                seatNumber: ticket.seatNumber,
              });
            }
          }
        }
        setTicketQRs(qrDataMap);
      } catch (error) {
        console.error("Failed to generate QR codes:", error);
      } finally {
        setLoadingQRs(false);
      }
    };

    generateAllQRs();
  }, [order, generateQRDataUrl]);

  const getQRDataForTicket = (ticketId: number): TicketQRData | undefined => {
    return ticketQRs.find((qr) => qr.ticketId === ticketId);
  };

  const handlePrint = () => {
    window.print();
  };

  if (loadingQRs) {
    return (
      <div className="max-w-3xl mx-auto">
        <div className="bg-white rounded-lg shadow-lg p-8 text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto"></div>
          <p className="text-gray-600 mt-4">Generating QR codes...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="bg-white rounded-lg shadow-lg p-8">
        {/* Success Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-green-100 rounded-full mb-4">
            <svg
              className="w-8 h-8 text-green-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M5 13l4 4L19 7"
              />
            </svg>
          </div>
          <h2 className="text-3xl font-bold text-gray-900 mb-2">
            Sale Complete!
          </h2>
          <p className="text-gray-600">
            Tickets have been generated successfully with QR codes
          </p>
        </div>

        {/* Order Number */}
        <div className="bg-purple-50 border-2 border-purple-200 rounded-lg p-6 mb-6 text-center">
          <p className="text-sm text-gray-600 mb-1">ORDER NUMBER</p>
          <p className="text-3xl font-bold text-purple-600">
            {order.orderNumber}
          </p>
        </div>

        {/* Order Details */}
        <div className="mb-6">
          <h3 className="font-semibold text-gray-900 mb-3">Order Details</h3>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-600">Date:</span>
              <span className="font-medium">
                {new Date(order.createdAt).toLocaleString()}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Payment Method:</span>
              <span className="font-medium">{order.paymentMethod}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Payment Status:</span>
              <span
                className={`font-medium ${
                  order.paymentStatus === "PAID"
                    ? "text-green-600"
                    : "text-yellow-600"
                }`}
              >
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

        {/* Tickets with QR Codes */}
        <div className="mb-6">
          <h3 className="font-semibold text-gray-900 mb-4">
            Tickets with QR Codes
          </h3>
          <div className="space-y-8">
            {order.items.map((item, itemIndex) => (
              <div
                key={item.id}
                className="border border-gray-200 rounded-lg p-6"
              >
                <div className="mb-4">
                  <h4 className="font-semibold text-gray-900">
                    Group {itemIndex + 1}: {ticketGroup?.name || "Tickets"}
                  </h4>
                  <p className="text-sm text-gray-600">
                    {item.quantity} tickets × $
                    {Number(item.unitPrice).toFixed(2)}
                  </p>
                </div>

                {/* Individual Tickets with QR Codes */}
                <div className="space-y-6">
                  {item.tickets.map((ticket, ticketIndex) => {
                    const qrData = getQRDataForTicket(ticket.id);
                    return (
                      <div
                        key={ticket.id}
                        className="border border-gray-200 rounded-lg p-4 bg-gray-50"
                      >
                        {/* Ticket Header */}
                        <div className="flex justify-between items-start mb-4">
                          <div>
                            <p className="text-sm font-medium text-gray-600">
                              Ticket {ticketIndex + 1}
                            </p>
                            <p className="text-lg font-bold text-gray-900">
                              {ticket.seatNumber}
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="text-xs text-gray-500">Ticket ID</p>
                            <p className="text-sm font-mono font-medium">
                              #{ticket.id}
                            </p>
                          </div>
                        </div>

                        {/* QR Code */}
                        {qrData ? (
                          <div className="flex justify-center mb-4">
                            <div className="border-2 border-gray-300 p-3 bg-white">
                              <img
                                src={qrData.qrDataUrl}
                                alt={`QR Code for ticket ${ticket.id}`}
                                width={250}
                                height={250}
                                className="block"
                              />
                            </div>
                          </div>
                        ) : (
                          <div className="flex justify-center mb-4">
                            <div className="w-64 h-64 bg-gray-300 flex items-center justify-center rounded">
                              <span className="text-gray-500">No QR Code</span>
                            </div>
                          </div>
                        )}

                        {/* QR Token for Manual Entry */}
                        {ticket.qrToken && (
                          <div className="bg-white rounded p-3 mb-3">
                            <p className="text-xs text-gray-500 mb-1">
                              VALIDATION CODE:
                            </p>
                            <p className="text-xs font-mono break-all font-medium text-gray-700">
                              {ticket.qrToken}
                            </p>
                          </div>
                        )}

                        {/* Instructions */}
                        <div className="text-xs text-gray-600 border-t pt-3">
                          <p className="font-medium mb-1">How to validate:</p>
                          <ul className="list-disc list-inside space-y-1">
                            <li>Scan the QR code at the entrance</li>
                            <li>Or manually enter the code above</li>
                            <li>Ticket will be marked as validated</li>
                          </ul>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Subtotal */}
                <div className="border-t mt-4 pt-4">
                  <div className="flex justify-between">
                    <span className="text-gray-700">Subtotal:</span>
                    <span className="font-bold text-purple-600">
                      ${Number(item.subtotal).toFixed(2)}
                    </span>
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
                d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z"
              />
            </svg>
            Print Receipt with QR Codes
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

          /* Print-specific styles */
          @page {
            margin: 0.5in;
            size: A4;
          }

          /* Ensure QR codes print well */
          img {
            max-width: 100%;
            page-break-inside: avoid;
          }

          .space-y-6 > * {
            page-break-inside: avoid;
          }
        }
      `}</style>
    </div>
  );
};
