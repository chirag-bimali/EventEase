import { useState } from "react";
import Navbar from "../components/Navbar";
import { QRScanner } from "../components/TicketValidator/QRScanner";
import { useTicketValidation } from "../hooks/useTicketValidation";

type ValidatorMode = "scanner" | "manual";
type ValidationState = "idle" | "validating" | "success" | "error";

export const TicketValidatorPage = () => {
  const [mode, setMode] = useState<ValidatorMode>("scanner");
  const [manualCode, setManualCode] = useState("");
  const [validationState, setValidationState] = useState<ValidationState>(
    "idle"
  );

  const { validateTicket, loading, error, result, clearResult } =
    useTicketValidation();

  const handleScan = async (qrToken: string) => {
    if (validationState === "validating") return; // Prevent double validation

    setValidationState("validating");
    try {
      await validateTicket(qrToken);
      setValidationState("success");
      // Reset after 3 seconds
      setTimeout(() => {
        setValidationState("idle");
        clearResult();
      }, 3000);
    } catch {
      setValidationState("error");
      // Reset after 5 seconds
      setTimeout(() => {
        setValidationState("idle");
        clearResult();
      }, 5000);
    }
  };

  const handleManualSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualCode.trim()) return;

    setValidationState("validating");
    try {
      await validateTicket(manualCode);
      setManualCode("");
      setValidationState("success");
      setTimeout(() => {
        setValidationState("idle");
        clearResult();
      }, 3000);
    } catch {
      setValidationState("error");
      setTimeout(() => {
        setValidationState("idle");
        clearResult();
      }, 5000);
    }
  };

  const handleScannerError = (errorMessage: string) => {
    console.error("Scanner error:", errorMessage);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      <div className="max-w-2xl mx-auto p-6">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-4 mb-4">
            <div className="bg-blue-100 p-3 rounded-lg">
              <svg
                className="w-8 h-8 text-blue-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M12 4v16m8-8H4"
                />
              </svg>
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                TICKET VALIDATOR
              </h1>
              <p className="text-gray-600">Scan or enter ticket codes</p>
            </div>
          </div>
        </div>

        {/* Mode Selector */}
        <div className="flex gap-2 mb-8 bg-white rounded-lg p-2 shadow">
          <button
            onClick={() => setMode("scanner")}
            className={`flex-1 py-3 px-6 rounded-md font-medium transition-colors ${
              mode === "scanner"
                ? "bg-blue-100 text-blue-700"
                : "text-gray-500 hover:bg-gray-100"
            }`}
          >
            <svg
              className="w-5 h-5 inline mr-2"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M12 4v16m8-8H4"
              />
            </svg>
            SCAN QR CODE
          </button>
          <button
            onClick={() => setMode("manual")}
            className={`flex-1 py-3 px-6 rounded-md font-medium transition-colors ${
              mode === "manual"
                ? "bg-blue-100 text-blue-700"
                : "text-gray-500 hover:bg-gray-100"
            }`}
          >
            <svg
              className="w-5 h-5 inline mr-2"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
              />
            </svg>
            MANUAL ENTRY
          </button>
        </div>

        {/* Scanner Mode */}
        {mode === "scanner" && (
          <div className="bg-white rounded-lg shadow-lg p-6 mb-8">
            <p className="text-sm text-gray-600 mb-4">
              Position the QR code in front of the camera
            </p>
            <div className="rounded-lg overflow-hidden">
              <QRScanner
                onScan={handleScan}
                onError={handleScannerError}
              />
            </div>
          </div>
        )}

        {/* Manual Entry Mode */}
        {mode === "manual" && (
          <div className="bg-white rounded-lg shadow-lg p-6 mb-8">
            <form onSubmit={handleManualSubmit}>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Ticket Code
                </label>
                <input
                  type="text"
                  value={manualCode}
                  onChange={(e) => setManualCode(e.target.value)}
                  placeholder="Enter ticket validation code"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  disabled={loading}
                />
              </div>
              <button
                type="submit"
                disabled={loading || !manualCode.trim()}
                className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors font-medium disabled:bg-gray-400 disabled:cursor-not-allowed"
              >
                {loading ? "Validating..." : "Validate Ticket"}
              </button>
            </form>
          </div>
        )}

        {/* Result Display */}
        {validationState === "validating" && (
          <div className="bg-white rounded-lg shadow-lg p-8 text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="text-gray-600 mt-4">Validating ticket...</p>
          </div>
        )}

        {validationState === "success" && result && (
          <div className="bg-green-50 border-2 border-green-200 rounded-lg shadow-lg p-8">
            <div className="flex items-center justify-center mb-4">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-green-100 rounded-full">
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
            </div>

            <h2 className="text-2xl font-bold text-green-700 text-center mb-4">
              {result.message}
            </h2>

            {result.ticketData && (
              <div className="space-y-3">
                <div className="bg-white rounded p-4">
                  <p className="text-sm text-gray-600">Event</p>
                  <p className="text-lg font-bold text-gray-900">
                    {result.ticketData.eventName}
                  </p>
                </div>

                <div className="bg-white rounded p-4">
                  <p className="text-sm text-gray-600">Ticket Group</p>
                  <p className="text-lg font-bold text-gray-900">
                    {result.ticketData.groupName}
                  </p>
                </div>

                <div className="bg-white rounded p-4">
                  <p className="text-sm text-gray-600">Seat/Number</p>
                  <p className="text-lg font-bold text-gray-900">
                    {result.ticketData.seatNumber}
                  </p>
                </div>

                <div className="bg-white rounded p-4">
                  <p className="text-sm text-gray-600">Validated At</p>
                  <p className="text-lg font-bold text-gray-900">
                    {new Date(result.ticketData.validatedAt).toLocaleString()}
                  </p>
                </div>
              </div>
            )}
          </div>
        )}

        {validationState === "error" && error && (
          <div className="bg-red-50 border-2 border-red-200 rounded-lg shadow-lg p-8">
            <div className="flex items-center justify-center mb-4">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-red-100 rounded-full">
                <svg
                  className="w-8 h-8 text-red-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </div>
            </div>

            <h2 className="text-2xl font-bold text-red-700 text-center mb-2">
              Validation Failed
            </h2>

            <p className="text-center text-red-600 text-lg font-medium">
              {error}
            </p>

            <div className="mt-6 p-4 bg-white rounded">
              <p className="text-sm text-gray-600">
                <strong>Possible reasons:</strong>
              </p>
              <ul className="list-disc list-inside text-sm text-gray-700 mt-2 space-y-1">
                <li>Ticket already validated</li>
                <li>Invalid or expired QR code</li>
                <li>Ticket not found in system</li>
                <li>Network connection issue</li>
              </ul>
            </div>
          </div>
        )}

        {validationState === "idle" && !loading && (
          <div className="bg-blue-50 border-2 border-blue-200 rounded-lg p-8 text-center">
            <svg
              className="w-12 h-12 text-blue-600 mx-auto mb-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M13 10V3L4 14h7v7l9-11h-7z"
              />
            </svg>
            <p className="text-gray-600 text-lg">
              {mode === "scanner"
                ? "Ready to scan. Point camera at QR code."
                : "Enter ticket code above."}
            </p>
          </div>
        )}
      </div>
    </div>
  );
};