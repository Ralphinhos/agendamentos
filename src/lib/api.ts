import { Booking } from "@/context/BookingsContext";

// In a real application, this would be your base API URL
const API_BASE_URL = "/api";

/**
 * Fetches all bookings from the API.
 * In a real app, this would make a network request.
 * For now, it simulates a fetch from localStorage to keep the app working.
 */
export const fetchBookings = async (): Promise<Booking[]> => {
  console.log("Fetching bookings from API...");
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 500));

  // To keep the demo working, we'll read from localStorage as a mock API.
  // In a real scenario, this would be a `fetch` call to your backend.
  const rawData = localStorage.getItem("ead-bookings-v1");
  if (rawData) {
    return JSON.parse(rawData) as Booking[];
  }
  return []; // Return empty array if nothing is in storage
};
