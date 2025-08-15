// src/mocks/handlers.ts
import { http, HttpResponse } from 'msw'
import { db } from './db'
import { Booking } from '@/context/BookingsContext'

const API_PREFIX = '/api'

export const handlers = [
  // Get all bookings
  http.get(`${API_PREFIX}/bookings`, () => {
    return HttpResponse.json(db.getAllBookings())
  }),

  // Get a single booking by ID
  http.get(`${API_PREFIX}/bookings/:id`, ({ params }) => {
    const { id } = params
    if (typeof id !== 'string') {
      return new HttpResponse(null, { status: 400 });
    }
    const booking = db.getBookingById(id)
    if (!booking) {
      return new HttpResponse(null, { status: 404 })
    }
    return HttpResponse.json(booking)
  }),

  // Add a new booking
  http.post(`${API_PREFIX}/bookings`, async ({ request }) => {
    const newBookingData = await request.json() as Omit<Booking, 'id'>
    const newBooking = db.addBooking(newBookingData)
    return HttpResponse.json(newBooking, { status: 201 })
  }),

  // Update a booking
  http.patch(`${API_PREFIX}/bookings/:id`, async ({ request, params }) => {
    const { id } = params
    const patch = await request.json() as Partial<Booking>

    if (typeof id !== 'string') {
      return new HttpResponse(null, { status: 400 });
    }

    const updatedBooking = db.updateBooking(id, patch)

    if (!updatedBooking) {
      return new HttpResponse(null, { status: 404 })
    }
    return HttpResponse.json(updatedBooking)
  }),

  // Delete a booking
  http.delete(`${API_PREFIX}/bookings/:id`, ({ params }) => {
    const { id } = params

    if (typeof id !== 'string') {
      return new HttpResponse(null, { status: 400 });
    }

    const wasDeleted = db.deleteBooking(id)
    if (!wasDeleted) {
      return new HttpResponse(null, { status: 404 })
    }
    return new HttpResponse(null, { status: 204 }) // No Content
  }),

  // Handle authentication
  http.post(`${API_PREFIX}/auth/login`, async ({ request }) => {
    const { email, password } = await request.json() as Record<string, string>

    // Simulate user validation
    if (email === 'admin@ead.com' && password === 'admin123') {
      return HttpResponse.json({
        user: { name: 'Admin User', email: 'admin@ead.com', role: 'admin' },
        token: 'fake-jwt-for-admin',
      })
    }
    if (email === 'editor@ead.com' && password === 'editor123') {
      return HttpResponse.json({
        user: { name: 'Editor User', email: 'editor@ead.com', role: 'editor' },
        token: 'fake-jwt-for-editor',
      })
    }

    // Handle invalid credentials
    return new HttpResponse(
      JSON.stringify({ message: 'Invalid credentials' }),
      { status: 401, headers: { 'Content-Type': 'application/json' } }
    )
  }),

  // Handle bulk update for a discipline
  http.patch(`${API_PREFIX}/disciplines/:disciplineName`, async ({ request, params }) => {
    const { disciplineName } = params;
    const patch = await request.json() as Partial<Booking>;

    if (typeof disciplineName !== 'string') {
      return new HttpResponse(null, { status: 400 });
    }

    const decodedDisciplineName = decodeURIComponent(disciplineName);
    db.updateBookingsByDiscipline(decodedDisciplineName, patch);

    return new HttpResponse(null, { status: 204 });
  }),
]
