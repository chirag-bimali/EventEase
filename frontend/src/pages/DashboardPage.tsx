import Navbar from "../components/Navbar";

export default function DashboardPage() {
  return (
    <div>
      <Navbar />
      <div className="max-w-7xl mx-auto p-4">
        <h1 className="text-2xl font-bold mb-4">Dashboard</h1>
        <p>Welcome to the Dashboard!</p>
      </div>
    </div>
  );
}
