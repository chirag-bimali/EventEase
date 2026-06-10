import Navbar from "../components/Navbar";

export default function DashboardPage() {
  return (
    <div>
      <Navbar />
      <div className="max-w-5xl mx-auto p-6">
        <h1 className="text-2xl font-semibold uppercase tracking-wide text-gray-800">
          Dashboard
        </h1>
        <p className="text-gray-600">Welcome to the Dashboard!</p>
      </div>
    </div>
  );
}
