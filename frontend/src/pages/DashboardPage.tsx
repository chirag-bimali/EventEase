import Navbar from "../components/Navbar";
import { Link } from "react-router-dom";
import { useEffect, useState } from "react";
import { eventService } from "../services/event.service";
import { salesService } from "../services/sales.service";
import { ticketService } from "../services/ticket.service";
import type { Event } from "../types/event.types";

export default function DashboardPage() {
  const [loading, setLoading] = useState(true);
  const [events, setEvents] = useState<Event[]>([]);
  const [stats, setStats] = useState({
    totalEvents: 0,
    ticketsSold: 0,
    totalRevenue: 0,
    activeUsers: 0,
  });

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        
        // Fetch all data in parallel
        const [eventsData, salesStats, ticketStats] = await Promise.all([
          eventService.getAllEvents(),
          salesService.getSalesStats(),
          ticketService.getTicketStats(),
        ]);

        // Set events
        setEvents(eventsData);

        // Calculate stats
        setStats({
          totalEvents: eventsData.length,
          ticketsSold: ticketStats.sold || 0,
          totalRevenue: salesStats.paidRevenue || 0,
          activeUsers: salesStats.paidOrders || 0, // Using paid orders as proxy for active users
        });
      } catch (error) {
        console.error("Failed to fetch dashboard data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  // Get upcoming events (events with future dates)
  // Limit to 5 upcoming events
  // Sort by date ascending
  // Only include events within the next week
  const upcomingEvents = events
    .filter((event) => {
      const eventDate = new Date(event.startTime);
      const now = new Date();
      const oneWeekFromNow = new Date();
      oneWeekFromNow.setDate(now.getDate() + 7);
      return eventDate > now && eventDate <= oneWeekFromNow;
    })
    .sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime())
    .slice(0, 5);


  const quickActions = [
    {
      title: "Point of Sale",
      description: "Sell tickets at the counter",
      link: "/pos",
      icon: "💳",
    },
    {
      title: "Ticket Validator",
      description: "Scan and validate tickets",
      link: "/validator",
      icon: "✓",
    },
  ];

  const statsDisplay = [
    { label: "Total Events", value: loading ? "..." : stats.totalEvents.toString() },
    { label: "Tickets Sold", value: loading ? "..." : stats.ticketsSold.toLocaleString() },
    { 
      label: "Total Revenue", 
      value: loading ? "..." : `$${stats.totalRevenue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` 
    },
    { label: "Recent Orders", value: loading ? "..." : stats.activeUsers.toString() },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-gray-600 mt-2">Welcome back! Here's your overview.</p>
        </div>

        <div className="grid gap-6 md:grid-cols-2 mb-8">
          {quickActions.map((action) => (
            <Link
              key={action.title}
              to={action.link}
              className="group bg-linear-to-br from-purple-600 to-purple-700 rounded-xl p-8 text-white hover:from-purple-700 hover:to-purple-800 transition-all hover:shadow-lg hover:-translate-y-1"
            >
              <div className="flex items-center gap-4">
                <div className="text-4xl">{action.icon}</div>
                <div>
                  <h3 className="text-2xl font-bold mb-1">{action.title}</h3>
                  <p className="text-purple-100">{action.description}</p>
                </div>
              </div>
            </Link>
          ))}
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4 mb-8">
          {statsDisplay.map((stat) => (
            <div
              key={stat.label}
              className="bg-white rounded-lg border border-gray-200 p-6 hover:shadow-md transition-shadow"
            >
              <p className="text-sm text-gray-600 mb-2">{stat.label}</p>
              <p className="text-3xl font-bold text-purple-600">{stat.value}</p>
            </div>
          ))}
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Upcoming Events</h2>
          {loading ? (
            <div className="text-center py-8 text-gray-500">Loading events...</div>
          ) : upcomingEvents.length === 0 ? (
            <div className="text-center py-8 text-gray-500">No upcoming events</div>
          ) : (
            <div className="space-y-4">
              {upcomingEvents.map((event) => (
                <div
                  key={event.id}
                  className="flex items-center justify-between py-3 border-b border-gray-100 last:border-0"
                >
                  <div>
                    <p className="font-semibold text-gray-900">{event.name}</p>
                    <p className="text-sm text-gray-600">{event.venue}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium text-purple-600">
                      {new Date(event.startTime).toLocaleDateString('en-US', { 
                        month: 'short', 
                        day: 'numeric', 
                        year: 'numeric' 
                      })}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
