import {
  ChecklistItem,
  JobPhotoSlot,
  StaffJob,
  StaffMember,
} from '../models/staff.models';
import { deriveOperationalStatus } from '../utils/staff-workflow.util';
import {
  MOCK_CUSTOMER,
  MOCK_PROPERTY,
  MOCK_PROPERTY_FARM,
  MOCK_PROPERTY_RIDGE,
} from './mock-data';

export const MOCK_STAFF_MEMBER: StaffMember = {
  id: 'staff-001',
  fullName: 'James Mitchell',
  phone: '082 987 6543',
  role: 'Cleaning Technician',
  status: 'active',
};

const DEFAULT_CHECKLIST: ChecklistItem[] = [
  { id: 'c1', label: 'Roof access confirmed', completed: false, required: true },
  { id: 'c2', label: 'Safety check completed', completed: false, required: true },
  { id: 'c3', label: 'Panels inspected', completed: false, required: true },
  { id: 'c4', label: 'Loose debris removed', completed: false, required: true },
  { id: 'c5', label: 'Dust and grime cleaned', completed: false, required: true },
  { id: 'c6', label: 'Bird droppings removed', completed: false, required: true },
  { id: 'c7', label: 'Frame edges cleaned', completed: false, required: true },
  { id: 'c8', label: 'Water runoff checked', completed: false, required: true },
  { id: 'c9', label: 'Visual damage check completed', completed: false, required: true },
  { id: 'c10', label: 'Work area left clean', completed: false, required: true },
];

function beforeSlots(): JobPhotoSlot[] {
  return [
    { id: 'bf1', label: 'Full panel array', type: 'before', required: true, photoUrl: null },
    { id: 'bf2', label: 'Close-up of panels (condition)', type: 'before', required: true, photoUrl: null },
    { id: 'bf3', label: 'Access/roof area', type: 'before', required: true, photoUrl: null },
    { id: 'bf4', label: 'Any visible issues (if any)', type: 'before', required: true, photoUrl: null },
  ];
}

function afterSlots(): JobPhotoSlot[] {
  return [
    { id: 'af1', label: 'Full clean panel array', type: 'after', required: true, photoUrl: null },
    { id: 'af2', label: 'Close-up clean panel', type: 'after', required: true, photoUrl: null },
    { id: 'af3', label: 'Final work area', type: 'after', required: true, photoUrl: null },
  ];
}

const BEFORE_IMGS = [
  'https://images.unsplash.com/photo-1497441173707-f25a2e1d4a65?w=600&h=400&fit=crop',
  'https://images.unsplash.com/photo-1509391366360-2e959784a276?w=600&h=400&fit=crop',
  'https://images.unsplash.com/photo-1508514177221-188b1cf16e9d?w=600&h=400&fit=crop',
];

const AFTER_IMGS = [
  'https://images.unsplash.com/photo-1613665813447-82a78c468a4d?w=600&h=400&fit=crop',
  'https://images.unsplash.com/photo-1558449455-0aa211637b00?w=600&h=400&fit=crop',
  'https://images.unsplash.com/photo-1509391366360-2e959784a276?w=600&h=400&fit=crop',
];

const PROPERTY_META: Record<
  string,
  { imageUrl: string; systemSizeKw: number }
> = {
  'prop-001': { imageUrl: MOCK_PROPERTY.imageUrl, systemSizeKw: MOCK_PROPERTY.systemSizeKw },
  'prop-002': { imageUrl: MOCK_PROPERTY_RIDGE.imageUrl, systemSizeKw: MOCK_PROPERTY_RIDGE.systemSizeKw },
  'prop-003': { imageUrl: MOCK_PROPERTY_FARM.imageUrl, systemSizeKw: MOCK_PROPERTY_FARM.systemSizeKw },
  'prop-fict-001': {
    imageUrl: 'https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=800&h=500&fit=crop',
    systemSizeKw: 4.2,
  },
};

function buildJob(partial: Partial<StaffJob> & Pick<StaffJob, 'id' | 'bookingId' | 'routeOrder' | 'scheduledTime'>): StaffJob {
  const checklist = partial.checklist ?? DEFAULT_CHECKLIST.map((c) => ({ ...c }));
  const photoSlots = partial.photoSlots ?? [...beforeSlots(), ...afterSlots()];
  const beforePhotos = partial.beforePhotos ?? [];
  const afterPhotos = partial.afterPhotos ?? [];
  const propertyId = partial.propertyId ?? 'prop-001';
  const propertyMeta = PROPERTY_META[propertyId] ?? PROPERTY_META['prop-001'];
  const panelCount = partial.panelCount ?? MOCK_PROPERTY.panelCount;

  const job: StaffJob = {
    id: partial.id,
    bookingId: partial.bookingId,
    propertyId,
    customerId: partial.customerId ?? 'cust-001',
    customerName: partial.customerName ?? MOCK_CUSTOMER.fullName,
    address: partial.address ?? MOCK_PROPERTY.address,
    city: partial.city ?? MOCK_PROPERTY.city,
    postcode: partial.postcode ?? MOCK_PROPERTY.postcode,
    serviceType: partial.serviceType ?? 'Solar Panel Cleaning',
    planType: partial.planType ?? 'Quarterly Solar Care',
    scheduledTime: partial.scheduledTime,
    scheduledDate: partial.scheduledDate ?? '2026-06-16',
    status: partial.status ?? 'scheduled',
    operationalStatus: 'assigned',
    routeOrder: partial.routeOrder,
    panelCount,
    systemSizeKw: partial.systemSizeKw ?? propertyMeta.systemSizeKw,
    roofType: partial.roofType ?? MOCK_PROPERTY.roofType,
    heroImageUrl: partial.heroImageUrl ?? propertyMeta.imageUrl,
    accessShort: partial.accessShort ?? 'Side gate',
    accessNotes: partial.accessNotes ?? MOCK_PROPERTY.accessNotes,
    customerPhone: partial.customerPhone ?? MOCK_CUSTOMER.phone,
    customerEmail: partial.customerEmail ?? MOCK_CUSTOMER.email,
    instructions: partial.instructions ?? 'Please use side gate. Dog in yard.',
    checklist,
    photoSlots,
    beforePhotos,
    afterPhotos,
    beforeKwhReading: partial.beforeKwhReading ?? null,
    afterKwhReading: partial.afterKwhReading ?? null,
    checkedInAt: partial.checkedInAt ?? null,
    checkInLatitude: partial.checkInLatitude ?? null,
    checkInLongitude: partial.checkInLongitude ?? null,
    checkInNote: partial.checkInNote ?? null,
    completedAt: partial.completedAt ?? null,
    completionNotes: partial.completionNotes ?? null,
    onTheWay: partial.onTheWay ?? false,
    arrived: partial.arrived ?? false,
    issue: partial.issue ?? null,
  };
  return { ...job, operationalStatus: deriveOperationalStatus(job) };
}

export function createStaffMockJobs(): StaffJob[] {
  const completedChecklist = DEFAULT_CHECKLIST.map((c) => ({ ...c, completed: true }));
  const completedSlots = [...beforeSlots(), ...afterSlots()].map((s, i) => ({
    ...s,
    photoUrl: i < 3 ? BEFORE_IMGS[i % 3] : i < 6 ? AFTER_IMGS[i - 3] : null,
  }));

  return [
    buildJob({
      id: 'job-001',
      bookingId: 'booking-004',
      routeOrder: 1,
      scheduledTime: '08:00 AM – 10:00 AM',
      customerName: 'Linda Pretorius',
      address: 'Parkhurst Villa',
      city: 'Parkhurst',
      postcode: '2193',
      propertyId: 'prop-fict-001',
      panelCount: 10,
      roofType: 'Tile Roof',
      accessShort: 'Front gate',
      accessNotes: 'Front gate code: 8821',
      customerPhone: '082 456 7890',
      customerEmail: 'linda.pretorius@email.com',
      instructions: 'Ring bell on arrival.',
      checkedInAt: '2026-06-16T08:05:00',
      checkInLatitude: -26.12,
      checkInLongitude: 28.04,
      completedAt: '2026-06-16T09:45:00',
      completionNotes: 'Routine quarterly clean. Panels in good condition.',
      checklist: completedChecklist,
      photoSlots: completedSlots,
      beforePhotos: [...BEFORE_IMGS],
      afterPhotos: [...AFTER_IMGS],
      beforeKwhReading: 12450.2,
      afterKwhReading: 12452.8,
    }),
    buildJob({
      id: 'job-002',
      bookingId: 'booking-001',
      routeOrder: 2,
      scheduledTime: '10:00 AM – 12:00 PM',
      customerName: MOCK_CUSTOMER.fullName,
      address: MOCK_PROPERTY.address,
      city: MOCK_PROPERTY.city,
      postcode: MOCK_PROPERTY.postcode,
      propertyId: 'prop-001',
      customerId: 'cust-001',
      panelCount: MOCK_PROPERTY.panelCount,
      roofType: MOCK_PROPERTY.roofType,
      accessShort: 'Side gate',
      accessNotes: MOCK_PROPERTY.accessNotes,
      customerPhone: MOCK_CUSTOMER.phone,
      customerEmail: MOCK_CUSTOMER.email,
      instructions: 'Please use side gate. Dog in yard.',
    }),
    buildJob({
      id: 'job-003',
      bookingId: 'booking-003',
      routeOrder: 3,
      scheduledTime: '12:30 PM – 02:30 PM',
      customerName: 'David Khumalo',
      address: MOCK_PROPERTY_RIDGE.address,
      city: MOCK_PROPERTY_RIDGE.city,
      postcode: MOCK_PROPERTY_RIDGE.postcode,
      propertyId: 'prop-002',
      panelCount: MOCK_PROPERTY_RIDGE.panelCount,
      roofType: MOCK_PROPERTY_RIDGE.roofType,
      accessShort: 'Front gate',
      accessNotes: MOCK_PROPERTY_RIDGE.accessNotes,
      customerPhone: '083 234 5678',
      customerEmail: 'david.khumalo@email.com',
      instructions: 'Front gate code: 4521. Metal roof — use harness.',
      planType: 'Quarterly Solar Care',
      onTheWay: true,
      arrived: true,
      checkedInAt: '2026-06-16T12:00:00',
      issue: {
        issueType: 'no_access',
        description: 'Gate code not working — customer unreachable.',
        reportedAt: '2026-06-16T12:05:00',
      },
    }),
    buildJob({
      id: 'job-004',
      bookingId: 'booking-farm-001',
      routeOrder: 4,
      scheduledTime: '03:00 PM – 05:00 PM',
      customerName: 'Sarah van der Merwe',
      address: MOCK_PROPERTY_FARM.address,
      city: MOCK_PROPERTY_FARM.city,
      postcode: MOCK_PROPERTY_FARM.postcode,
      propertyId: 'prop-003',
      panelCount: MOCK_PROPERTY_FARM.panelCount,
      roofType: MOCK_PROPERTY_FARM.roofType,
      accessShort: 'Call on arrival',
      accessNotes: MOCK_PROPERTY_FARM.accessNotes,
      customerPhone: '084 345 6789',
      customerEmail: 'sarah.vdm@email.com',
      instructions: 'Call on arrival — gravel driveway.',
      planType: 'Bi-Annual Care',
    }),
  ];
}
