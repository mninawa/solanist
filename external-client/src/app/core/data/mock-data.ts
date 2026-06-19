import { InviteData } from '../models/invite.models';
import {
  ClientDashboard,
  Booking,
  CleaningReport,
  Subscription,
  Payment,
  PropertySummary,
  PropertyPlanDetails,
  BillingMode,
} from '../models/client.models';
import { PLAN_BENEFITS } from '../content/client-content';

export const MOCK_CUSTOMER = {
  firstName: 'Nicolette',
  lastName: 'Botha',
  fullName: 'Nicolette Botha',
  email: 'nicolette.botha@email.com',
  phone: '082 123 4567',
  whatsApp: '27821234567',
} as const;

export const MOCK_PROPERTY = {
  address: 'Hurlingham View',
  city: 'Sandton',
  postcode: '2196',
  panelCount: 12,
  systemSizeKw: 5.2,
  roofType: 'Tile Roof',
  accessNotes: 'Side gate access — please use side entrance.',
  imageUrl: 'https://images.unsplash.com/photo-1508514177221-188b1cf16e9d?w=800&h=500&fit=crop',
} as const;

export const MOCK_PROPERTY_RIDGE = {
  address: 'Sandton Ridge',
  city: 'Sandton',
  postcode: '2196',
  panelCount: 8,
  systemSizeKw: 3.4,
  roofType: 'Metal Roof',
  accessNotes: 'Front gate code: 4521',
  imageUrl: 'https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=800&h=500&fit=crop',
} as const;

export const MOCK_PROPERTY_FARM = {
  address: 'Meyerton Farmhouse',
  city: 'Meyerton',
  postcode: '1961',
  panelCount: 24,
  systemSizeKw: 10.8,
  roofType: 'Tile Roof',
  accessNotes: 'Call on arrival — gravel driveway.',
  imageUrl: 'https://images.unsplash.com/photo-1582268611958-ebfd161ef9cf?w=800&h=500&fit=crop',
} as const;

export const MOCK_PLANS = [
  {
    id: 'plan-once',
    name: 'Once-off Clean',
    description: 'Single deep clean for immediate performance boost.',
    pricePerVisit: 699,
    visitsPerYear: 1,
    annualPrice: 699,
    features: ['Full panel wash', 'Visual inspection', 'Photo report'],
  },
  {
    id: 'plan-quarterly',
    name: 'Quarterly Solar Care',
    description: 'Clean every 3 months — our best value plan.',
    pricePerVisit: 499,
    visitsPerYear: 4,
    annualPrice: 1996,
    features: [
      '4 cleans per year',
      'Priority booking',
      'WhatsApp reminders',
      'Before & after photo report',
    ],
    recommended: true,
  },
  {
    id: 'plan-biannual',
    name: 'Bi-Annual Care',
    description: 'Two thorough cleans per year for steady maintenance.',
    pricePerVisit: 399,
    visitsPerYear: 2,
    annualPrice: 798,
    features: ['2 cleans per year', 'Photo reports', 'Flexible rescheduling'],
  },
] as const;

export const MOCK_INVITE: InviteData = {
  code: 'NB7XK2',
  customerName: MOCK_CUSTOMER.fullName,
  customerEmail: MOCK_CUSTOMER.email,
  customerPhone: MOCK_CUSTOMER.phone,
  quote: {
    basePrice: 699,
    estimatedPanelCount: MOCK_PROPERTY.panelCount,
    serviceType: 'Solar Panel Cleaning',
    quoteRef: 'SOL-2026-0042',
    notes: 'Quote based on 12-panel array, tile roof, standard access.',
  },
  property: { ...MOCK_PROPERTY },
  plans: MOCK_PLANS.map((p) => ({ ...p, features: [...p.features] })),
  expiresAt: '2026-07-16T23:59:59Z',
  status: 'pending',
};

export const MOCK_DASHBOARD: ClientDashboard = {
  customerName: MOCK_CUSTOMER.firstName,
  customerFullName: MOCK_CUSTOMER.fullName,
  greeting: 'Good morning',
  currentPlan: {
    name: 'Quarterly Solar Care',
    pricePerVisit: 499,
    visitsPerYear: 4,
    nextBillingDate: '2026-06-15',
  },
  nextService: {
    date: '2026-06-22',
    timeSlot: '10:00 AM – 02:00 PM',
    daysUntil: 7,
    status: 'confirmed' as const,
  },
  property: { ...MOCK_PROPERTY },
  systemSizeKw: MOCK_PROPERTY.systemSizeKw,
  latestReport: {
    id: 'report-001',
    completedAt: '2026-03-22',
    serviceType: 'Solar Panel Cleaning Report',
    panelCount: 12,
    staffName: 'James M.',
    thumbnailUrl: 'https://images.unsplash.com/photo-1509391366360-2e959784a276?w=200&h=120&fit=crop',
  },
  subscription: {
    status: 'active',
    planName: 'Quarterly Solar Care',
    annualPrice: 1996,
    visitsRemaining: 3,
  },
  valueProps: [
    'Maximize energy output',
    'Protect your investment',
    'Longer panel lifespan',
    'Peace of mind',
  ],
  systemStatus: 'Your system is in great shape',
};

export const MOCK_BOOKINGS: Booking[] = [
  {
    id: 'booking-001',
    bookingRef: 'BKG-2026-0622-0017',
    propertyId: 'prop-001',
    date: '2026-06-22',
    timeSlot: '10:00 AM – 02:00 PM',
    status: 'upcoming',
    serviceType: 'Solar Panel Cleaning',
    propertyAddress: `${MOCK_PROPERTY.address}, ${MOCK_PROPERTY.city}`,
    propertyPostcode: MOCK_PROPERTY.postcode,
    planName: 'Quarterly Solar Care',
    staffName: 'James M.',
    confirmationStatus: 'confirmed',
    bookedOn: '2026-05-28',
    serviceDuration: '~4 hours',
    panelCount: MOCK_PROPERTY.panelCount,
    systemSizeKw: MOCK_PROPERTY.systemSizeKw,
    roofType: MOCK_PROPERTY.roofType,
    accessNotes: 'Side access',
    specialInstructions:
      'Please ensure side gate is unlocked. Our dog is friendly but please keep gate closed after entry.',
    billingNote: 'subscription',
    isNextBooking: true,
  },
  {
    id: 'booking-002',
    bookingRef: 'BKG-2026-0922-0024',
    propertyId: 'prop-001',
    date: '2026-09-22',
    timeSlot: '08:00 AM – 12:00 PM',
    status: 'upcoming',
    serviceType: 'Solar Panel Cleaning',
    propertyAddress: `${MOCK_PROPERTY.address}, ${MOCK_PROPERTY.city}`,
    propertyPostcode: MOCK_PROPERTY.postcode,
    planName: 'Quarterly Solar Care',
    confirmationStatus: 'scheduled',
    bookedOn: '2026-06-01',
    serviceDuration: '~4 hours',
    panelCount: MOCK_PROPERTY.panelCount,
    systemSizeKw: MOCK_PROPERTY.systemSizeKw,
    roofType: MOCK_PROPERTY.roofType,
    accessNotes: 'Side access',
    billingNote: 'subscription',
  },
  {
    id: 'booking-003',
    bookingRef: 'BKG-2026-0815-0031',
    propertyId: 'prop-002',
    date: '2026-08-15',
    timeSlot: '08:00 AM – 12:00 PM',
    status: 'upcoming',
    serviceType: 'Solar Panel Cleaning',
    propertyAddress: `${MOCK_PROPERTY_RIDGE.address}, ${MOCK_PROPERTY_RIDGE.city}`,
    propertyPostcode: MOCK_PROPERTY_RIDGE.postcode,
    planName: 'Quarterly Solar Care',
    staffName: 'Sipho N.',
    confirmationStatus: 'confirmed',
    bookedOn: '2026-05-15',
    serviceDuration: '~3 hours',
    panelCount: MOCK_PROPERTY_RIDGE.panelCount,
    systemSizeKw: MOCK_PROPERTY_RIDGE.systemSizeKw,
    roofType: MOCK_PROPERTY_RIDGE.roofType,
    accessNotes: 'Front gate',
    billingNote: 'subscription',
  },
  {
    id: 'booking-004',
    bookingRef: 'BKG-2026-0322-0012',
    propertyId: 'prop-001',
    date: '2026-03-22',
    timeSlot: '10:00 AM – 02:00 PM',
    status: 'completed',
    serviceType: 'Solar Panel Cleaning',
    propertyAddress: `${MOCK_PROPERTY.address}, ${MOCK_PROPERTY.city}`,
    propertyPostcode: MOCK_PROPERTY.postcode,
    planName: 'Quarterly Solar Care',
    staffName: 'James M.',
    confirmationStatus: 'confirmed',
    bookedOn: '2026-02-01',
    serviceDuration: '~4 hours',
    panelCount: MOCK_PROPERTY.panelCount,
    systemSizeKw: MOCK_PROPERTY.systemSizeKw,
    roofType: MOCK_PROPERTY.roofType,
    billingNote: 'subscription',
  },
  {
    id: 'booking-005',
    bookingRef: 'BKG-2026-0210-0008',
    propertyId: 'prop-002',
    date: '2026-02-10',
    timeSlot: '09:00 AM – 01:00 PM',
    status: 'completed',
    serviceType: 'Solar Panel Cleaning',
    propertyAddress: `${MOCK_PROPERTY_RIDGE.address}, ${MOCK_PROPERTY_RIDGE.city}`,
    propertyPostcode: MOCK_PROPERTY_RIDGE.postcode,
    planName: 'Bi-Annual Care',
    staffName: 'Sipho N.',
    confirmationStatus: 'confirmed',
    bookedOn: '2026-01-05',
    serviceDuration: '~3 hours',
    panelCount: MOCK_PROPERTY_RIDGE.panelCount,
    systemSizeKw: MOCK_PROPERTY_RIDGE.systemSizeKw,
    roofType: MOCK_PROPERTY_RIDGE.roofType,
    billingNote: 'subscription',
  },
  {
    id: 'booking-006',
    bookingRef: 'BKG-2025-1215-0005',
    propertyId: 'prop-001',
    date: '2025-12-15',
    timeSlot: '12:00 PM – 04:00 PM',
    status: 'completed',
    serviceType: 'Solar Panel Cleaning',
    propertyAddress: `${MOCK_PROPERTY.address}, ${MOCK_PROPERTY.city}`,
    propertyPostcode: MOCK_PROPERTY.postcode,
    planName: 'Quarterly Solar Care',
    staffName: 'Sipho N.',
    confirmationStatus: 'confirmed',
    bookedOn: '2025-11-20',
    serviceDuration: '~4 hours',
    panelCount: MOCK_PROPERTY.panelCount,
    systemSizeKw: MOCK_PROPERTY.systemSizeKw,
    roofType: MOCK_PROPERTY.roofType,
    billingNote: 'subscription',
  },
  {
    id: 'booking-007',
    bookingRef: 'BKG-2025-0915-0002',
    propertyId: 'prop-001',
    date: '2025-09-15',
    timeSlot: '08:00 AM – 12:00 PM',
    status: 'completed',
    serviceType: 'Solar Panel Cleaning',
    propertyAddress: `${MOCK_PROPERTY.address}, ${MOCK_PROPERTY.city}`,
    propertyPostcode: MOCK_PROPERTY.postcode,
    planName: 'Quarterly Solar Care',
    staffName: 'Sipho N.',
    confirmationStatus: 'confirmed',
    bookedOn: '2025-08-10',
    serviceDuration: '~4 hours',
    panelCount: MOCK_PROPERTY.panelCount,
    systemSizeKw: MOCK_PROPERTY.systemSizeKw,
    roofType: MOCK_PROPERTY.roofType,
    billingNote: 'subscription',
  },
  {
    id: 'booking-008',
    bookingRef: 'BKG-2025-0620-0001',
    propertyId: 'prop-001',
    date: '2025-06-20',
    timeSlot: '10:00 AM – 02:00 PM',
    status: 'cancelled',
    serviceType: 'Solar Panel Cleaning',
    propertyAddress: `${MOCK_PROPERTY.address}, ${MOCK_PROPERTY.city}`,
    propertyPostcode: MOCK_PROPERTY.postcode,
    planName: 'Quarterly Solar Care',
    confirmationStatus: 'confirmed',
    bookedOn: '2025-05-01',
    serviceDuration: '~4 hours',
    panelCount: MOCK_PROPERTY.panelCount,
    systemSizeKw: MOCK_PROPERTY.systemSizeKw,
    roofType: MOCK_PROPERTY.roofType,
    billingNote: 'subscription',
  },
];

export const REPORT_DEFAULT_CHECKLIST = [
  'Roof access confirmed',
  'Solar panels inspected',
  'Dust and dirt removed',
  'Bird droppings removed',
  'Frame edges cleaned',
  'Visual damage check completed',
  'Before photos uploaded',
  'After photos uploaded',
  'Customer report generated',
] as const;

export function enrichCleaningReport(
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
    checklistSummary:
      report.checklistSummary.length >= 5
        ? report.checklistSummary
        : [...REPORT_DEFAULT_CHECKLIST],
    photosTakenAt: report.photosTakenAt ?? `${report.completedAt}T10:15:00`,
    nextClean: nextBooking
      ? {
          date: nextBooking.date,
          timeSlot: nextBooking.timeSlot,
          planName: nextBooking.planName ?? property?.planName ?? 'Solar Care',
          bookingId: nextBooking.id,
        }
      : property?.nextCleanDate
        ? {
            date: property.nextCleanDate,
            timeSlot: property.nextCleanTimeSlot ?? '10:00 AM – 12:00 PM',
            planName: property.planName ?? 'Solar Care',
            bookingId: '',
          }
        : null,
  };
}

function buildHistoricalReports(): CleaningReport[] {
  const hurlingham = {
    propertyId: 'prop-001',
    panelCount: MOCK_PROPERTY.panelCount,
    address: `${MOCK_PROPERTY.address}, ${MOCK_PROPERTY.city}, ${MOCK_PROPERTY.postcode}`,
    before: 'https://images.unsplash.com/photo-1497441173707-f25a2e1d4a65?w=400&h=260&fit=crop',
    after: 'https://images.unsplash.com/photo-1613665813447-82a78c468a4d?w=400&h=260&fit=crop',
  };
  const ridge = {
    propertyId: 'prop-002',
    panelCount: MOCK_PROPERTY_RIDGE.panelCount,
    address: `${MOCK_PROPERTY_RIDGE.address}, ${MOCK_PROPERTY_RIDGE.city}, ${MOCK_PROPERTY_RIDGE.postcode}`,
    before: 'https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=400&h=260&fit=crop',
    after: 'https://images.unsplash.com/photo-1509391366360-2e959784a276?w=400&h=260&fit=crop',
  };

  type ReportProp = { propertyId: string; panelCount: number; address: string; before: string; after: string };

  const entries: Array<{ id: string; date: string; prop: ReportProp; tech: string }> = [
    { id: 'report-006', date: '2025-06-15', prop: hurlingham, tech: 'James M.' },
    { id: 'report-007', date: '2025-03-20', prop: hurlingham, tech: 'Sipho N.' },
    { id: 'report-008', date: '2024-12-10', prop: hurlingham, tech: 'James M.' },
    { id: 'report-009', date: '2024-09-05', prop: hurlingham, tech: 'Sipho N.' },
    { id: 'report-010', date: '2024-06-18', prop: hurlingham, tech: 'James M.' },
    { id: 'report-011', date: '2024-03-12', prop: hurlingham, tech: 'Sipho N.' },
    { id: 'report-012', date: '2023-12-08', prop: hurlingham, tech: 'James M.' },
    { id: 'report-013', date: '2023-09-14', prop: hurlingham, tech: 'Sipho N.' },
    { id: 'report-014', date: '2025-05-22', prop: ridge, tech: 'James M.' },
    { id: 'report-015', date: '2025-02-14', prop: ridge, tech: 'Sipho N.' },
    { id: 'report-016', date: '2024-11-02', prop: ridge, tech: 'James M.' },
    { id: 'report-017', date: '2024-08-19', prop: ridge, tech: 'Sipho N.' },
    { id: 'report-018', date: '2024-05-07', prop: ridge, tech: 'James M.' },
    { id: 'report-019', date: '2024-02-21', prop: ridge, tech: 'Sipho N.' },
    { id: 'report-020', date: '2023-11-30', prop: ridge, tech: 'James M.' },
    { id: 'report-021', date: '2026-01-18', prop: hurlingham, tech: 'James M.' },
    { id: 'report-022', date: '2026-04-15', prop: hurlingham, tech: 'Sipho N.' },
    { id: 'report-023', date: '2026-05-20', prop: ridge, tech: 'James M.' },
    { id: 'report-024', date: '2025-07-30', prop: hurlingham, tech: 'James M.' },
    { id: 'report-025', date: '2026-06-01', prop: ridge, tech: 'Sipho N.' },
    { id: 'report-026', date: '2026-04-28', prop: hurlingham, tech: 'James M.' },
    { id: 'report-027', date: '2026-03-05', prop: ridge, tech: 'Sipho N.' },
    { id: 'report-028', date: '2026-02-18', prop: hurlingham, tech: 'James M.' },
  ];

  return entries.map((e) => ({
    id: e.id,
    completedAt: e.date,
    serviceType: 'Solar Panel Cleaning Report',
    panelCount: e.prop.panelCount,
    staffName: e.tech,
    propertyId: e.prop.propertyId,
    propertyAddress: e.prop.address,
    status: 'completed' as const,
    beforePhotos: [e.prop.before],
    afterPhotos: [e.prop.after],
    checklistSummary: ['Full clean completed', 'Visual inspection passed'],
    staffNotes: 'Routine service completed successfully.',
  }));
}

export const MOCK_REPORTS: CleaningReport[] = [
  {
    id: 'report-001',
    bookingId: 'booking-004',
    completedAt: '2026-03-22',
    serviceType: 'Solar Panel Cleaning Report',
    panelCount: 12,
    staffName: 'James M.',
    propertyId: 'prop-001',
    propertyAddress: `${MOCK_PROPERTY.address}, ${MOCK_PROPERTY.city}, ${MOCK_PROPERTY.postcode}`,
    status: 'completed',
    planName: 'Quarterly Solar Care',
    beforePhotos: [
      'https://images.unsplash.com/photo-1509391366360-2e959784a276?w=800&h=520&fit=crop',
      'https://images.unsplash.com/photo-1497441173707-f25a2e1d4a65?w=800&h=520&fit=crop',
      'https://images.unsplash.com/photo-1508514177221-188b1cf16e9d?w=800&h=520&fit=crop',
    ],
    afterPhotos: [
      'https://images.unsplash.com/photo-1613665813447-82a78c468a4d?w=800&h=520&fit=crop',
      'https://images.unsplash.com/photo-1558449455-0aa211637b00?w=800&h=520&fit=crop',
      'https://images.unsplash.com/photo-1509391366360-2e959784a276?w=800&h=520&fit=crop',
    ],
    checklistSummary: [...REPORT_DEFAULT_CHECKLIST],
    staffNotes:
      'Panels had moderate dust build-up, especially on the lower row. No visible cracks or major damage found. Side gate access was used. Recommended next clean: 3 months.',
    beforeKwhReading: 11842.5,
    afterKwhReading: 11845.1,
    kwhGain: 2.6,
  },
  {
    id: 'report-002',
    completedAt: '2025-12-15',
    serviceType: 'Solar Panel Cleaning Report',
    panelCount: 12,
    staffName: 'Sipho N.',
    propertyId: 'prop-001',
    propertyAddress: `${MOCK_PROPERTY.address}, ${MOCK_PROPERTY.city}, ${MOCK_PROPERTY.postcode}`,
    status: 'completed',
    beforePhotos: [
      'https://images.unsplash.com/photo-1497441173707-f25a2e1d4a65?w=400&h=260&fit=crop',
    ],
    afterPhotos: [
      'https://images.unsplash.com/photo-1613665813447-82a78c468a4d?w=400&h=260&fit=crop',
    ],
    checklistSummary: ['Full clean completed', 'Visual inspection passed'],
    staffNotes: 'Routine quarterly clean completed.',
  },
  {
    id: 'report-003',
    completedAt: '2025-09-15',
    serviceType: 'Solar Panel Cleaning Report',
    panelCount: 12,
    staffName: 'Sipho N.',
    propertyId: 'prop-001',
    propertyAddress: `${MOCK_PROPERTY.address}, ${MOCK_PROPERTY.city}, ${MOCK_PROPERTY.postcode}`,
    status: 'completed',
    beforePhotos: [
      'https://images.unsplash.com/photo-1509391366360-2e959784a276?w=400&h=260&fit=crop',
    ],
    afterPhotos: [
      'https://images.unsplash.com/photo-1558449455-0aa211637b00?w=400&h=260&fit=crop',
    ],
    checklistSummary: ['Full clean completed'],
    staffNotes: 'Panels in good condition.',
  },
  {
    id: 'report-004',
    completedAt: '2026-02-10',
    serviceType: 'Solar Panel Cleaning Report',
    panelCount: 8,
    staffName: 'Sipho N.',
    propertyId: 'prop-002',
    propertyAddress: `${MOCK_PROPERTY_RIDGE.address}, ${MOCK_PROPERTY_RIDGE.city}, ${MOCK_PROPERTY_RIDGE.postcode}`,
    status: 'completed',
    beforePhotos: [
      'https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=400&h=260&fit=crop',
    ],
    afterPhotos: [
      'https://images.unsplash.com/photo-1509391366360-2e959784a276?w=400&h=260&fit=crop',
    ],
    checklistSummary: ['Full clean completed', 'Metal roof access confirmed'],
    staffNotes: '8-panel array cleaned. Minor dust buildup removed.',
  },
  {
    id: 'report-005',
    completedAt: '2025-08-20',
    serviceType: 'Solar Panel Cleaning Report',
    panelCount: 8,
    staffName: 'James M.',
    propertyId: 'prop-002',
    propertyAddress: `${MOCK_PROPERTY_RIDGE.address}, ${MOCK_PROPERTY_RIDGE.city}, ${MOCK_PROPERTY_RIDGE.postcode}`,
    status: 'completed',
    beforePhotos: [
      'https://images.unsplash.com/photo-1497441173707-f25a2e1d4a65?w=400&h=260&fit=crop',
    ],
    afterPhotos: [
      'https://images.unsplash.com/photo-1613665813447-82a78c468a4d?w=400&h=260&fit=crop',
    ],
    checklistSummary: ['Bi-annual clean completed'],
    staffNotes: 'First bi-annual service for Sandton Ridge.',
  },
  ...buildHistoricalReports(),
];

export const MOCK_SUBSCRIPTION: Subscription = {
  planName: 'Quarterly Solar Care',
  planDescription: 'Clean every 3 months',
  status: 'active',
  pricePerVisit: 499,
  annualPrice: 1996,
  billingCycle: 'Quarterly',
  nextBillingDate: '2026-06-15',
  nextCleanDate: '2026-06-22',
  visitsRemaining: 3,
  paymentMethod: 'Mastercard •••• 4422',
  features: [
    '4 professional cleans per year',
    'WhatsApp reminders before each visit',
    'Priority booking slots',
    'Before & after photo reports',
    'Visual inspection included',
    'Flexible rescheduling',
  ],
};

export const MOCK_PAYMENTS: Payment[] = [
  {
    id: 'pay-001',
    date: '2026-05-22',
    description: 'Combined invoice',
    amount: 1397,
    status: 'paid',
    invoiceType: 'combined',
  },
  {
    id: 'pay-002',
    date: '2026-04-22',
    description: 'Combined invoice',
    amount: 998,
    status: 'paid',
    invoiceType: 'combined',
  },
  {
    id: 'pay-003',
    date: '2026-03-15',
    description: 'Quarterly Solar Care — Hurlingham View',
    amount: 499,
    status: 'paid',
    invoiceType: 'single',
  },
  {
    id: 'pay-004',
    date: '2025-12-15',
    description: 'Combined invoice',
    amount: 898,
    status: 'paid',
    invoiceType: 'combined',
  },
  {
    id: 'pay-005',
    date: '2025-09-15',
    description: 'Quarterly Solar Care — Hurlingham View',
    amount: 499,
    status: 'paid',
    invoiceType: 'single',
  },
];

export const MOCK_PROPERTIES: PropertySummary[] = [
  {
    id: 'prop-001',
    ...MOCK_PROPERTY,
    isPrimary: true,
    subscriptionStatus: 'active',
    planName: 'Quarterly Solar Care',
    planVariant: 'purple',
    planFrequency: 'Every 3 months',
    nextCleanDate: '2026-06-22',
    nextCleanTimeSlot: '10:00 AM – 02:00 PM',
    pricePerClean: 499,
    visitsPerYear: 4,
    visitsRemaining: 3,
    monthlyBilling: 499,
  },
  {
    id: 'prop-002',
    ...MOCK_PROPERTY_RIDGE,
    isPrimary: false,
    subscriptionStatus: 'active',
    planName: 'Quarterly Solar Care',
    planVariant: 'blue',
    planFrequency: 'Every 3 months',
    nextCleanDate: '2026-08-15',
    nextCleanTimeSlot: '08:00 AM – 12:00 PM',
    pricePerClean: 499,
    visitsPerYear: 4,
    visitsRemaining: 2,
    monthlyBilling: 499,
  },
  {
    id: 'prop-003',
    ...MOCK_PROPERTY_FARM,
    isPrimary: false,
    subscriptionStatus: 'active',
    planName: 'Bi-Annual Care',
    planVariant: 'neutral',
    planFrequency: 'Every 6 months',
    nextCleanDate: '2026-09-10',
    nextCleanTimeSlot: '08:00 AM – 12:00 PM',
    pricePerClean: 399,
    visitsPerYear: 2,
    visitsRemaining: 1,
    monthlyBilling: 399,
  },
];

export const MOCK_BILLING_MODE: BillingMode = 'combined';

export const MOCK_SUBSCRIPTION_PORTFOLIO = {
  billingMode: MOCK_BILLING_MODE,
  paymentMethod: 'Mastercard •••• 4422',
  nextBillingDate: '2026-06-15',
  upcomingBillingTotal: 1397,
  invoicePreview: [
    { propertyId: 'prop-001', propertyName: 'Hurlingham View', planName: 'Quarterly Solar Care', amount: 499 },
    { propertyId: 'prop-002', propertyName: 'Sandton Ridge', planName: 'Quarterly Solar Care', amount: 499 },
    { propertyId: 'prop-003', propertyName: 'Meyerton Farmhouse', planName: 'Bi-Annual Care', amount: 399 },
  ],
} as const;

export const TIME_SLOTS = [
  { id: 'morning', label: 'Morning', time: '08:00 – 12:00' },
  { id: 'afternoon', label: 'Afternoon', time: '12:00 – 16:00' },
  { id: 'late-afternoon', label: 'Late Afternoon', time: '14:00 – 18:00' },
] as const;


const PROPERTY_PLAN_CONFIG: Record<
  string,
  Omit<NonNullable<PropertyPlanDetails['plan']>, 'name'> & { name?: string }
> = {
  'prop-001': {
    description: 'Clean every 3 months',
    status: 'active',
    planSince: '2025-12-22',
    pricePerVisit: 499,
    frequencyLabel: 'Every 3 months',
    cleansPerYear: 4,
    visitsRemaining: 3,
    annualValue: 1996,
    features: [...PLAN_BENEFITS],
    heroImageUrl: MOCK_PROPERTY.imageUrl,
  },
  'prop-002': {
    description: 'Clean every 3 months',
    status: 'active',
    planSince: '2026-01-10',
    pricePerVisit: 499,
    frequencyLabel: 'Every 3 months',
    cleansPerYear: 4,
    visitsRemaining: 2,
    annualValue: 1996,
    features: [...PLAN_BENEFITS],
    heroImageUrl: MOCK_PROPERTY_RIDGE.imageUrl,
  },
  'prop-003': {
    name: 'Bi-Annual Care',
    description: 'Clean twice per year',
    status: 'active',
    planSince: '2026-03-01',
    pricePerVisit: 399,
    frequencyLabel: 'Every 6 months',
    cleansPerYear: 2,
    visitsRemaining: 1,
    annualValue: 798,
    features: [
      '2 professional cleans per year',
      'WhatsApp reminders before each visit',
      'Photo reports',
      'Flexible rescheduling',
    ],
    heroImageUrl: MOCK_PROPERTY_FARM.imageUrl,
  },
};

export function buildPropertyPlanDetails(property: PropertySummary): PropertyPlanDetails {
  const config = PROPERTY_PLAN_CONFIG[property.id];
  const address = `${property.address}, ${property.city}, ${property.postcode}`;
  const propertyReports = MOCK_REPORTS.filter((r) =>
    r.propertyAddress.startsWith(property.address),
  ).slice(0, 3);

  if (!config || property.subscriptionStatus === 'setup_required') {
    return {
      property,
      plan: null,
      nextCleaning: null,
      billing: null,
      usage: null,
      recentReports: propertyReports.map((r) => ({
        id: r.id,
        completedAt: r.completedAt,
        serviceType: r.serviceType,
        panelCount: r.panelCount,
        staffName: r.staffName,
        thumbnailUrl: r.beforePhotos[0],
      })),
    };
  }

  const cleansCompleted = config.cleansPerYear - config.visitsRemaining;

  return {
    property,
    plan: {
      name: config.name ?? property.planName ?? 'Solar Care Plan',
      description: config.description,
      status: config.status,
      planSince: config.planSince,
      pricePerVisit: config.pricePerVisit,
      frequencyLabel: config.frequencyLabel,
      cleansPerYear: config.cleansPerYear,
      visitsRemaining: config.visitsRemaining,
      annualValue: config.annualValue,
      features: config.features,
      heroImageUrl: config.heroImageUrl,
    },
    nextCleaning: property.nextCleanDate
      ? {
          date: property.nextCleanDate,
          timeSlot: property.id === 'prop-001' ? '10:00 AM – 12:00 PM' : '08:00 AM – 12:00 PM',
          staffName: property.id === 'prop-001' ? null : 'Sipho N.',
          address,
        }
      : null,
    billing: {
      mode: 'Combined billing',
      planPrice: config.pricePerVisit,
      nextInvoiceDate: property.id === 'prop-002' ? '2026-08-01' : '2026-07-01',
      paymentMethod: 'Mastercard •••• 4422',
      lastPaymentDate: property.id === 'prop-002' ? '2026-02-10' : '2026-05-22',
      lastPaymentStatus: 'paid',
    },
    usage: {
      cleansCompleted,
      cleansTotal: config.cleansPerYear,
      reportsAvailable: propertyReports.length,
      nextBillingAmount: config.pricePerVisit,
      renewDate: property.id === 'prop-002' ? '2027-01-10' : '2026-12-22',
    },
    recentReports: propertyReports.map((r) => ({
      id: r.id,
      completedAt: r.completedAt,
      serviceType: r.serviceType,
      panelCount: r.panelCount,
      staffName: r.staffName,
      thumbnailUrl: r.beforePhotos[0],
    })),
  };
}
