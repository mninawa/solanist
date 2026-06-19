/**
 * Static presentation copy for the client portal (time-slot options, "what's included"
 * lists, plan benefit bullets, etc.). This is UI content — NOT mock business data — and is
 * intentionally kept out of `core/data/mock-data.ts` so client features never depend on the
 * mock module when running against the real API.
 */

export const BOOKING_TIME_WINDOWS = [
  { id: 'morning', label: 'Morning', time: '08:00 – 10:00' },
  { id: 'midday', label: 'Midday', time: '10:00 – 12:00' },
  { id: 'afternoon', label: 'Afternoon', time: '12:00 – 14:00' },
  { id: 'late-afternoon', label: 'Late afternoon', time: '14:00 – 16:00' },
] as const;

export const BOOKING_INCLUDES = [
  'Exterior panel cleaning',
  'Performance check',
  'Before & after photos',
  'Cleaning report',
] as const;

export const BOOKING_EXPECT_SIDEBAR = [
  {
    icon: 'sun' as const,
    title: 'Panel cleaning',
    description: 'We safely remove dust, pollen, and grime from your panels.',
  },
  {
    icon: 'check-circle' as const,
    title: 'Performance check',
    description: 'We inspect key components to ensure optimal output.',
  },
  {
    icon: 'camera' as const,
    title: 'Before & after photos',
    description: 'See the difference with clear before and after photos.',
  },
  {
    icon: 'report' as const,
    title: 'Report delivery',
    description: "You'll receive a detailed report after every visit.",
  },
] as const;

export const REPORT_INCLUDES_SIDEBAR = [
  { icon: 'camera' as const, title: 'Before & after photos', description: 'Visual proof of every clean.' },
  { icon: 'check-circle' as const, title: 'Technician checklist', description: 'Step-by-step completion record.' },
  { icon: 'sun' as const, title: 'System observations', description: 'Performance and condition notes.' },
  { icon: 'report' as const, title: 'Cleaning notes', description: 'Technician comments and recommendations.' },
] as const;

export const PLAN_BENEFITS = [
  '4 professional cleans per year',
  'WhatsApp reminders before each visit',
  'Priority booking slots',
  'Before & after photo reports',
  'Visual inspection included',
  'Flexible rescheduling',
] as const;
