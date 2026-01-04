import { useState, useEffect, useCallback } from "react";
import {
  salesService,
  type SalesFilters,
  type SalesStats,
} from "../services/sales.service";
import { eventService } from "../services/event.service";
import type { PosOrder } from "../types/posOrder.types";
import type { Event } from "../types/event.types";
import Navbar from "../components/Navbar";

export default function SalesPage() {
  const [orders, setOrders] = useState<PosOrder[]>([]);
  const [events, setEvents] = useState<Event[]>([]);
  const [stats, setStats] = useState<SalesStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState<SalesFilters>({
    search: "",
    eventId: undefined,
    paymentStatus: undefined,
    startDate: undefined,
    endDate: undefined,
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

  const fetchStats = useCallback(async () => {
    try {
      const statsData = await salesService.getSalesStats({
        eventId: filters.eventId,
        startDate: filters.startDate,
        endDate: filters.endDate,
      });
      setStats(statsData);
    } catch (error) {
      console.error("Failed to fetch stats:", error);
    }
  }, [filters.eventId, filters.startDate, filters.endDate]);

  const fetchOrders = useCallback(async () => {
    try {
      setLoading(true);
      const response = await salesService.getAllOrders(filters);
      setOrders(response.orders);
      setTotal(response.total);
      setCurrentPage(response.page);
      setLimit(response.limit);
    } catch (error) {
      console.error("Failed to fetch orders:", error);
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    fetchEvents();
  }, []);

  useEffect(() => {
    fetchOrders();
    fetchStats();
  }, [fetchOrders, fetchStats]);

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFilters((prev) => ({ ...prev, search: e.target.value, page: 1 }));
  };

  const handleEventFilter = (eventId: number | undefined) => {
    setFilters((prev) => ({ ...prev, eventId, page: 1 }));
  };

  const handleStatusFilter = (status: string | undefined) => {
    setFilters((prev) => ({ ...prev, paymentStatus: status, page: 1 }));
  };

  const handleDateFilter = (
    startDate: string | undefined,
    endDate: string | undefined
  ) => {
    setFilters((prev) => ({ ...prev, startDate, endDate, page: 1 }));
  };

  const handleLimitChange = (newLimit: number) => {
    setLimit(newLimit);
    setFilters((prev) => ({ ...prev, limit: newLimit, page: 1 }));
  };

  const handlePageChange = (newPage: number) => {
    setFilters((prev) => ({ ...prev, page: newPage }));
  };

  const handleDeleteOrder = async (orderId: number) => {
    if (!confirm("Are you sure you want to delete this order?")) return;

    try {
      await salesService.deleteOrder(orderId);
      fetchOrders();
      fetchStats();
    } catch (error: unknown) {
      if (error instanceof Error) {
        alert(error.message || "Failed to delete order");
      }
    }
  };

  const handleRefundOrder = async (orderId: number) => {
    if (
      !confirm(
        "Are you sure you want to refund this order? This will mark all tickets as available."
      )
    )
      return;

    try {
      await salesService.refundOrder(orderId);
      fetchOrders();
      fetchStats();
    } catch (error: unknown) {
      if (error instanceof Error)
        alert(error.message || "Failed to refund order");
    }
  };

  const totalPages = Math.ceil(total / limit);

  const getPaymentStatusColor = (status: string) => {
    switch (status) {
      case "PAID":
        return "text-green-600 bg-green-100";
      case "PENDING":
        return "text-yellow-600 bg-yellow-100";
      case "FAILED":
        return "text-red-600 bg-red-100";
      case "REFUNDED":
        return "text-gray-600 bg-gray-100";
      default:
        return "text-gray-600 bg-gray-100";
    }
  };

  const getPaginationRange = () => {
    const delta = 2;
    const range: (number | string)[] = [];
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
          <h1 className="text-2xl font-bold">SALES</h1>
          <p className="text-gray-600">
            View and manage all sales orders in the system.
          </p>
        </div>

        {/* Stats Cards */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <div className="bg-white p-4 rounded-lg shadow">
              <p className="text-sm text-gray-600">Total Orders</p>
              <p className="text-2xl font-bold">{stats.totalOrders}</p>
            </div>
            <div className="bg-white p-4 rounded-lg shadow">
              <p className="text-sm text-gray-600">Tickets Sold</p>
              <p className="text-2xl font-bold">{stats.ticketsSold}</p>
            </div>
            <div className="bg-white p-4 rounded-lg shadow">
              <p className="text-sm text-gray-600">Total Revenue</p>
              <p className="text-2xl font-bold">
                ${Number(stats.totalRevenue).toFixed(2)}
              </p>
            </div>
            <div className="bg-white p-4 rounded-lg shadow">
              <p className="text-sm text-gray-600">Paid Revenue</p>
              <p className="text-2xl font-bold text-green-600">
                ${Number(stats.paidRevenue).toFixed(2)}
              </p>
            </div>
          </div>
        )}

        {/* Filters */}
        <div className="mb-6 flex flex-wrap gap-4">
          {/* Search Bar */}
          <div className="flex-1 min-w-50">
            <input
              type="text"
              placeholder="Search by order number, buyer name..."
              value={filters.search}
              onChange={handleSearchChange}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Event Filter */}
          <select
            value={filters.eventId || ""}
            onChange={(e) =>
              handleEventFilter(
                e.target.value ? Number(e.target.value) : undefined
              )
            }
            className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">ALL EVENTS</option>
            {events.map((event) => (
              <option key={event.id} value={event.id}>
                {event.name}
              </option>
            ))}
          </select>

          {/* Payment Status Filter */}
          <select
            value={filters.paymentStatus || ""}
            onChange={(e) => handleStatusFilter(e.target.value || undefined)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">ALL STATUS</option>
            <option value="PAID">PAID</option>
            <option value="PENDING">PENDING</option>
            <option value="FAILED">FAILED</option>
            <option value="REFUNDED">REFUNDED</option>
          </select>

          {/* Date Range */}
          <input
            type="date"
            value={filters.startDate || ""}
            onChange={(e) =>
              handleDateFilter(e.target.value || undefined, filters.endDate)
            }
            className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <input
            type="date"
            value={filters.endDate || ""}
            onChange={(e) =>
              handleDateFilter(filters.startDate, e.target.value || undefined)
            }
            className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {/* Orders Table */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Order Number
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Event
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Buyer
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Items
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Amount
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Payment
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {loading ? (
                <tr>
                  <td
                    colSpan={8}
                    className="px-6 py-12 text-center text-gray-500"
                  >
                    Loading orders...
                  </td>
                </tr>
              ) : orders.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-6 py-12 text-center">
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
                          d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
                        />
                      </svg>
                      <p className="text-gray-500 font-medium">
                        No Orders Found
                      </p>
                      <p className="text-gray-400 text-sm">
                        Try adjusting your filters
                      </p>
                    </div>
                  </td>
                </tr>
              ) : (
                orders.map((order) => {
                  const o = order as PosOrder & {
                    event?: { name?: string };
                    createdBy?: { username?: string };
                  };

                  return (
                    <tr key={order.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {order.orderNumber}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {o.event?.name || "N/A"}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {order.buyerName || "-"}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {order.items?.length || 0} items
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        ${Number(order.totalAmount).toFixed(2)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {order.paymentMethod}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span
                          className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getPaymentStatusColor(
                            order.paymentStatus
                          )}`}
                        >
                          {order.paymentStatus}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm space-x-2">
                        {order.paymentStatus === "PAID" && (
                          <button
                            onClick={() => handleRefundOrder(order.id)}
                            className="text-orange-600 hover:text-orange-900"
                          >
                            Refund
                          </button>
                        )}
                        {(order.paymentStatus === "PENDING" ||
                          order.paymentStatus === "FAILED") && (
                          <button
                            onClick={() => handleDeleteOrder(order.id)}
                            className="text-red-600 hover:text-red-900"
                          >
                            Delete
                          </button>
                        )}
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
                of <span className="font-semibold">{total}</span> orders
              </div>

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

            <div className="flex items-center justify-center gap-1">
              <button
                onClick={() =>
                  currentPage > 1 && handlePageChange(currentPage - 1)
                }
                disabled={currentPage === 1}
                className="px-3 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                ← Previous
              </button>

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
