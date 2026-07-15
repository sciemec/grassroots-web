// src/lib/calendar-engine.ts

export interface AvailabilitySlot {
  id: string;
  day: 'monday' | 'tuesday' | 'wednesday' | 'thursday' | 'friday' | 'saturday' | 'sunday';
  startTime: string;
  endTime: string;
  isRecurring: boolean;
  date?: string;
  maxBookings: number;
  bookedCount: number;
}

export class CalendarEngine {
  generateTimeSlots(
    date: Date,
    availability: AvailabilitySlot[],
    duration: number
  ): Array<{ start: Date; end: Date; available: boolean }> {
    const dayName = date.toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase() as AvailabilitySlot['day'];
    const dayAvailability = availability.filter(a => a.day === dayName);

    if (dayAvailability.length === 0) {
      return [];
    }

    const slots: Array<{ start: Date; end: Date; available: boolean }> = [];
    const dayStart = new Date(date);
    dayStart.setHours(0, 0, 0, 0);

    dayAvailability.forEach(slot => {
      const [startHour, startMinute] = slot.startTime.split(':').map(Number);
      const [endHour, endMinute] = slot.endTime.split(':').map(Number);

      const slotStart = new Date(dayStart);
      slotStart.setHours(startHour, startMinute, 0, 0);

      const slotEnd = new Date(dayStart);
      slotEnd.setHours(endHour, endMinute, 0, 0);

      let current = new Date(slotStart);
      while (current.getTime() + duration * 60000 <= slotEnd.getTime()) {
        const slotEndTime = new Date(current);
        slotEndTime.setMinutes(slotEndTime.getMinutes() + duration);

        slots.push({
          start: new Date(current),
          end: slotEndTime,
          available: true,
        });

        current = slotEndTime;
      }
    });

    return slots;
  }

  isSlotAvailable(
    date: Date,
    duration: number,
    bookedSlots: Array<{ start: Date; end: Date }>,
    availability: AvailabilitySlot[]
  ): boolean {
    const dayName = date.toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase() as AvailabilitySlot['day'];
    const dayAvailability = availability.filter(a => a.day === dayName);

    if (dayAvailability.length === 0) {
      return false;
    }

    const dayStart = new Date(date);
    dayStart.setHours(0, 0, 0, 0);

    const isWithinHours = dayAvailability.some(slot => {
      const [startHour, startMinute] = slot.startTime.split(':').map(Number);
      const [endHour, endMinute] = slot.endTime.split(':').map(Number);

      const slotStart = new Date(dayStart);
      slotStart.setHours(startHour, startMinute, 0, 0);
      const slotEnd = new Date(dayStart);
      slotEnd.setHours(endHour, endMinute, 0, 0);

      const slotEndTime = new Date(date);
      slotEndTime.setMinutes(slotEndTime.getMinutes() + duration);

      return date >= slotStart && slotEndTime <= slotEnd;
    });

    if (!isWithinHours) {
      return false;
    }

    const slotEnd = new Date(date);
    slotEnd.setMinutes(slotEnd.getMinutes() + duration);

    const isBooked = bookedSlots.some(booked => {
      return date < booked.end && slotEnd > booked.start;
    });

    return !isBooked;
  }

  getAvailableDates(
    startDate: Date,
    endDate: Date,
    availability: AvailabilitySlot[],
    bookedSlots: Array<{ start: Date; end: Date }>,
    duration: number
  ): Date[] {
    const availableDates: Date[] = [];
    const current = new Date(startDate);

    while (current <= endDate) {
      const dayName = current.toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase() as AvailabilitySlot['day'];
      const hasAvailability = availability.some(a => a.day === dayName);

      if (hasAvailability) {
        const slots = this.generateTimeSlots(current, availability, duration);
        const hasAvailableSlot = slots.some(slot => {
          return this.isSlotAvailable(slot.start, duration, bookedSlots, availability);
        });

        if (hasAvailableSlot) {
          availableDates.push(new Date(current));
        }
      }

      current.setDate(current.getDate() + 1);
    }

    return availableDates;
  }
}

export const calendarEngine = new CalendarEngine();