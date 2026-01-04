import { useState, useEffect, useCallback } from "react";
import { ticketService, type TicketFilters } from "../services/ticket.service";
import { eventService } from "../services/event.service";
import type { Ticket } from "../types/ticket.types";
import type { Event } from "../types/event.types";
import Navbar from "../components/Navbar";

export default function TicketPage() {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState<TicketFilters>({
    search: "",
    eventId: undefined,
    status: undefined,
    page: 1,
    limit: 50,
  });
  const [total, setTotal] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [limit, setLimit] = useState(50);

  const fetchEvents = async () => {
    try {
      const data = await eventService.getAllEvents();
      setEvents(data);
    } catch (error) {
      console.error("Failed to fetch events:", error);
    }
  };

  const fetchTickets = useCallback(async () => {
    try {
      setLoading(true);
      const response = await ticketService.getAllTickets(filters);
      setTickets(response.tickets);
      setTotal(response.total);
      setCurrentPage(response.page);
      setLimit(response.limit);
    } catch (error) {
      console.error("Failed to fetch tickets:", error);
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    fetchEvents();
  }, []);

  useEffect(() => {
    fetchTickets();
  }, [fetchTickets]);

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFilters((prev) => ({ ...prev, search: e.target.value, page: 1 }));
  };

  const handleEventFilter = (eventId: number | undefined) => {
    setFilters((prev) => ({ ...prev, eventId, page: 1 }));
  };

  const handleStatusFilter = (status: string | undefined) => {
    setFilters((prev) => ({ ...prev, status, page: 1 }));
  };

  const handleLimitChange = (newLimit: number) => {
    setLimit(newLimit);
    setFilters((prev) => ({ ...prev, limit: newLimit, page: 1 }));
  };

  const handlePageChange = (newPage: number) => {
    setFilters((prev) => ({ ...prev, page: newPage }));
  };

  const totalPages = Math.ceil(total / limit);

  const getStatusColor = (status: string) => {
    switch (status) {
      case "SOLD":
        return "text-green-600 bg-green-100";
      case "RESERVED":
        return "text-yellow-600 bg-yellow-100";
      case "AVAILABLE":
        return "text-gray-600 bg-gray-100";
      case "USED":
        return "text-blue-600 bg-blue-100";
      default:
        return "text-gray-600 bg-gray-100";
    }
  };

  // Calculate pagination range for display
  const getPaginationRange = () => {
    const delta = 2;
    const range = [];
    const left = currentPage - delta;
    const right = currentPage + delta + 1;

    for (let i = 1; i <= totalPages; i++) {
      if (i === 1 || i === totalPages || (i >= left && i < right)) {
        range.push(i);
      } else if (range[range.length - 1] !== "...") {
        range.push("...");
      }
    }

    return range;
  };

  const paginationRange = getPaginationRange();

  return (
    <div>
      <Navbar />
      <div className="p-6">
        <div className="mb-6">
          <h1 className="text-2xl font-bold">TICKETS</h1>
          <p className="text-gray-600">
            View and manage all tickets in the system.
          </p>
        </div>

        {/* Filters */}
        <div className="mb-6 flex gap-4">
          {/* Search Bar */}
          <div className="flex-1">
            <input
              type="text"
              placeholder="Search by code, customer name..."
              value={filters.search}
              onChange={handleSearchChange}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Event Filter Dropdown */}
          <select
            value={filters.eventId || ""}
            onChange={(e) =>
              handleEventFilter(
                e.target.value ? Number(e.target.value) : undefined
              )
            }
            className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">EVENTS</option>
            {events.map((event) => (
              <option key={event.id} value={event.id}>
                {event.name}
              </option>
            ))}
          </select>

          {/* Status Filter Dropdown */}
          <select
            value={filters.status || ""}
            onChange={(e) => handleStatusFilter(e.target.value || undefined)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">STATUS</option>
            <option value="AVAILABLE">AVAILABLE</option>
            <option value="RESERVED">RESERVED</option>
            <option value="SOLD">SOLD</option>
            <option value="USED">USED</option>
          </select>
        </div>

        {/* Tickets Table */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Unique code
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Event
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Ticket Group
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Customer
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Price
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {loading ? (
                <tr>
                  <td
                    colSpan={6}
                    className="px-6 py-12 text-center text-gray-500"
                  >
                    Loading tickets...
                  </td>
                </tr>
              ) : tickets.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center">
                    <div className="flex flex-col items-center justify-center">
                      <svg
                        className="w-12 h-12 text-gray-400 mb-4"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4"
                        />
                      </svg>
                      <p className="text-gray-500 font-medium">
                        No Tickets Found
                      </p>
                      <p className="text-gray-400 text-sm">
                        Try adjusting your filters
                      </p>
                    </div>
                  </td>
                </tr>
              ) : (
                tickets.map((ticket) => {
                  const t = ticket as Ticket & {
                    ticketGroup?: {
                      event?: { name?: string };
                      name?: string;
                      price?: number;
                    } | null;
                    purchasedBy?: { username?: string } | null;
                  };

                  return (
                    <tr key={ticket.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {t.seatNumber}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {t.ticketGroup?.event?.name || "N/A"}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {t.ticketGroup?.name || "N/A"}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {t.purchasedBy?.username || "-"}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {"$" + (Number(t.ticketGroup?.price) || 0).toFixed(2)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span
                          className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(
                            ticket.status
                          )}`}
                        >
                          {ticket.status}
                        </span>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Section */}
        {!loading && total > 0 && (
          <div className="mt-6 flex flex-col gap-4">
            {/* Pagination Info and Items Per Page */}
            <div className="flex items-center justify-between">
              <div className="text-sm text-gray-600">
                Showing{" "}
                <span className="font-semibold">
                  {(currentPage - 1) * limit + 1}
                </span>{" "}
                to{" "}
                <span className="font-semibold">
                  {Math.min(currentPage * limit, total)}
                </span>{" "}
                of <span className="font-semibold">{total}</span> tickets
              </div>

              {/* Items Per Page Selector */}
              <div className="flex items-center gap-2">
                <label className="text-sm text-gray-600">Items per page:</label>
                <select
                  value={limit}
                  onChange={(e) => handleLimitChange(Number(e.target.value))}
                  className="px-3 py-1 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value={10}>10</option>
                  <option value={25}>25</option>
                  <option value={50}>50</option>
                  <option value={100}>100</option>
                </select>
              </div>
            </div>

            {/* Pagination Controls */}
            <div className="flex items-center justify-center gap-1">
              {/* Previous Button */}
              <button
                onClick={() =>
                  currentPage > 1 && handlePageChange(currentPage - 1)
                }
                disabled={currentPage === 1}
                className="px-3 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                ← Previous
              </button>

              {/* Page Numbers */}
              {paginationRange.map((page, idx) => (
                <button
                  key={idx}
                  onClick={() =>
                    typeof page === "number" && handlePageChange(page)
                  }
                  disabled={typeof page === "string"}
                  className={`px-3 py-2 border rounded-lg text-sm font-medium transition-colors ${
                    currentPage === page
                      ? "bg-blue-500 text-white border-blue-500"
                      : typeof page === "string"
                        ? "border-gray-300 text-gray-500 cursor-default"
                        : "border-gray-300 text-gray-700 hover:bg-gray-50"
                  }`}
                >
                  {page}
                </button>
              ))}

              {/* Next Button */}
              <button
                onClick={() =>
                  currentPage < totalPages && handlePageChange(currentPage + 1)
                }
                disabled={currentPage === totalPages}
                className="px-3 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Next →
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}