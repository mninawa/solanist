import { Booking, CleaningReport, PropertySummary } from '../models/client.models';

/**
 * Fill in derived report fields (plan, system details, property image, next clean) from the
 * customer's REAL properties and bookings returned by the API. Unlike the mock enricher, this
 * does not substitute any placeholder checklist or photo timestamps — it only uses live data.
 */
export function enrichReportFromApi(
  report: CleaningReport,
  properties: PropertySummary[],
  bookings: Booking[],
): CleaningReport {
  const property = properties.find((p) => p.id === report.propertyId);
  const completedBooking =
    (report.bookingId ? bookings.find((b) => b.id === report.bookingId) : null) ??
    bookings.find(
      (b) =>
        b.propertyId === report.propertyId &&
        b.status === 'completed' &&
        b.date === report.completedAt,
    );
  const nextBooking = bookings
    .filter((b) => b.propertyId === report.propertyId && b.status === 'upcoming')
    .sort((a, b) => a.date.localeCompare(b.date))[0];

  return {
    ...report,
    bookingId: report.bookingId ?? completedBooking?.id,
    planName: report.planName ?? completedBooking?.planName ?? property?.planName,
    systemSizeKw: report.systemSizeKw ?? property?.systemSizeKw ?? completedBooking?.systemSizeKw,
    roofType: report.roofType ?? property?.roofType ?? completedBooking?.roofType,
    accessNotes: report.accessNotes ?? property?.accessNotes ?? completedBooking?.accessNotes,
    propertyImageUrl: report.propertyImageUrl ?? property?.imageUrl,
    nextClean: nextBooking
      ? {
          date: nextBooking.date,
          timeSlot: nextBooking.timeSlot,
          planName: nextBooking.planName ?? property?.planName ?? report.planName ?? 'Solar Care',
          bookingId: nextBooking.id,
        }
      : property?.nextCleanDate
        ? {
            date: property.nextCleanDate,
            timeSlot: property.nextCleanTimeSlot ?? '',
            planName: property.planName ?? report.planName ?? 'Solar Care',
            bookingId: '',
          }
        : null,
  };
}
