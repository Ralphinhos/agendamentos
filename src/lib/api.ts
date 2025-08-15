import { Booking } from "@/context/BookingsContext";

const API_BASE_URL = "/api";

/**
 * A helper function to handle fetch responses.
 */
async function handleResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`API Error: ${response.status} ${response.statusText} - ${errorText}`);
  }
  if (response.status === 204) { // No Content
    return null as T;
  }
  return response.json();
}

/**
 * Fetches a single booking by its ID.
 */
export const fetchBookingById = async (id: string): Promise<Booking> => {
  const response = await fetch(`${API_BASE_URL}/bookings/${id}`);
  return handleResponse<Booking>(response);
};

/**
 * Fetches all bookings from the API.
 */
export const fetchBookings = async (): Promise<Booking[]> => {
  const response = await fetch(`${API_BASE_URL}/bookings`);
  return handleResponse<Booking[]>(response);
};

/**
 * Adds a new booking.
 */
export const addBookingAPI = async (newBookingData: Omit<Booking, 'id'>): Promise<Booking> => {
  const response = await fetch(`${API_BASE_URL}/bookings`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(newBookingData),
  });
  return handleResponse<Booking>(response);
};

/**
 * Updates an existing booking.
 */
export const updateBookingAPI = async (id: string, patch: Partial<Booking>): Promise<Booking> => {
  const response = await fetch(`${API_BASE_URL}/bookings/${id}`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(patch),
  });
  return handleResponse<Booking>(response);
};

/**
 * Deletes a booking.
 */
export const removeBookingAPI = async (id: string): Promise<void> => {
  const response = await fetch(`${API_BASE_URL}/bookings/${id}`, {
    method: 'DELETE',
  });
  await handleResponse<void>(response);
};

/**
 * Updates all bookings for a given discipline.
 */
export const updateDisciplineAPI = async (disciplineName: string, patch: Partial<Booking>): Promise<void> => {
  const response = await fetch(`${API_BASE_URL}/disciplines/${encodeURIComponent(disciplineName)}`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(patch),
  });
  await handleResponse<void>(response);
};
