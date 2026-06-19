/**
 * Static content for the legal / policy pages. Authored as plain data so the
 * pages can be rendered by a single component and easily updated without
 * touching templates. Keep the language plain and customer friendly.
 */

export interface PolicySection {
  heading?: string;
  paragraphs?: string[];
  bullets?: string[];
}

export interface PolicyDoc {
  slug: string;
  title: string;
  intro: string;
  lastUpdated: string;
  sections: PolicySection[];
}

const COMPANY_NAME = 'Solanist';
const SUPPORT_EMAIL = 'support@solanist.co';

export const LEGAL_POLICIES: Record<string, PolicyDoc> = {
  reschedule: {
    slug: 'reschedule',
    title: 'Reschedule Policy',
    intro: `We understand plans change. This policy explains how to move a scheduled cleaning visit and what fees, if any, apply.`,
    lastUpdated: '1 June 2026',
    sections: [
      {
        heading: 'Reschedule window',
        paragraphs: [
          `You can reschedule any upcoming cleaning visit free of charge up to 48 hours before the scheduled start time.`,
          `Reschedules requested within 48 hours of the appointment are accommodated where possible but may be subject to a short-notice fee equal to 25% of the visit price, charged on your next invoice.`,
        ],
      },
      {
        heading: 'How to reschedule',
        bullets: [
          'Open the booking from the Bookings page and tap "Reschedule".',
          'Pick a new date from the available calendar slots.',
          'You will receive an email and in-app confirmation once the new slot is locked in.',
        ],
      },
      {
        heading: 'Limits',
        paragraphs: [
          `Each booking may be rescheduled up to two times. Beyond that, please cancel the visit and re-book at a date that suits you, or contact ${SUPPORT_EMAIL} for help.`,
        ],
      },
      {
        heading: 'When we reschedule',
        paragraphs: [
          `If our team needs to move your visit (for example due to severe weather or a safety concern), we'll give you as much notice as possible and offer the next available slot at no charge.`,
        ],
      },
    ],
  },

  cancellation: {
    slug: 'cancellation',
    title: 'Cancellation Policy',
    intro: `If you need to cancel a single cleaning visit or end your subscription, here's how it works.`,
    lastUpdated: '1 June 2026',
    sections: [
      {
        heading: 'Cancelling a single visit',
        bullets: [
          'Cancel any visit free of charge up to 48 hours before the scheduled start time.',
          'Cancellations within 48 hours may be subject to a 50% short-notice fee.',
          'No-shows or refused entry on the day are charged the full visit fee.',
        ],
      },
      {
        heading: 'Cancelling a subscription',
        paragraphs: [
          `You can cancel your subscription at any time from the property detail page or by contacting support. Cancellation takes effect at the end of your current paid billing period — there are no lock-in terms beyond that period.`,
          `Already-completed visits in the current billing period remain payable.`,
        ],
      },
      {
        heading: 'Pausing a subscription',
        paragraphs: [
          `If you'd like a temporary pause (e.g. you're travelling or selling the property), email ${SUPPORT_EMAIL} and we'll suspend the schedule without ending your subscription.`,
        ],
      },
    ],
  },

  refund: {
    slug: 'refund',
    title: 'Refund Policy',
    intro: `${COMPANY_NAME} guarantees its work. If something is wrong with a clean, we'll fix it — or refund you in full.`,
    lastUpdated: '1 June 2026',
    sections: [
      {
        heading: 'Service guarantee',
        paragraphs: [
          `If you're not satisfied with a completed clean, contact us within 48 hours of the visit and we'll arrange a free re-clean of the affected panels at the next available slot.`,
          `If a re-clean isn't appropriate or possible, we'll refund the visit fee in full to your original payment method.`,
        ],
      },
      {
        heading: 'Eligible scenarios',
        bullets: [
          'Visible dirt or streaks left on panels after the team departs.',
          'Damage to panels, mounts or surrounding property caused by our team.',
          'Documented under-performance compared to our before/after readings outside normal tolerances.',
        ],
      },
      {
        heading: 'How refunds are processed',
        paragraphs: [
          `Approved refunds are issued via Paystack to the card or account used for the original payment. Most refunds clear within 3–5 working days.`,
          `For any questions about a refund, email ${SUPPORT_EMAIL} with your booking reference.`,
        ],
      },
    ],
  },

  terms: {
    slug: 'terms',
    title: 'Terms of Service',
    intro: `These Terms of Service ("Terms") govern your use of the ${COMPANY_NAME} portal, mobile app, and cleaning services. By creating an account or booking a visit you agree to be bound by these Terms.`,
    lastUpdated: '1 June 2026',
    sections: [
      {
        heading: '1. Account & eligibility',
        bullets: [
          'You must be 18 or older and authorised to enter into agreements for the property listed.',
          'You are responsible for keeping your login credentials secure.',
          'Notify us immediately if you believe your account has been accessed without your permission.',
        ],
      },
      {
        heading: '2. Services',
        paragraphs: [
          `${COMPANY_NAME} provides solar panel cleaning, performance reporting, and related services. Specific scope, frequency and pricing are described in the plan you select and confirmed at the time of booking.`,
          `We may engage trained service partners to perform visits on our behalf. All partners operate under our quality and safety standards.`,
        ],
      },
      {
        heading: '3. Property access & safety',
        bullets: [
          'You are responsible for granting safe roof or array access on the day of the visit.',
          'Our teams may decline a visit on safety grounds (e.g. unsafe ladders, severe weather, structural concerns) and reschedule at no charge.',
          'Damage caused by pre-existing structural issues is not covered.',
        ],
      },
      {
        heading: '4. Payments & subscriptions',
        paragraphs: [
          `Payments are processed by Paystack. By subscribing to a plan you authorise recurring charges in line with the plan's billing cadence.`,
          `Late payments may result in a temporary suspension of service until the balance is settled.`,
        ],
      },
      {
        heading: '5. Cancellation, reschedule & refunds',
        paragraphs: [
          `See our Cancellation Policy, Reschedule Policy and Refund Policy linked at the foot of this page for the specifics.`,
        ],
      },
      {
        heading: '6. Liability',
        paragraphs: [
          `${COMPANY_NAME}'s aggregate liability under these Terms is limited to the amount you have paid in the 12 months preceding the event giving rise to the claim. We are not liable for indirect or consequential losses, including lost savings or generation revenue.`,
        ],
      },
      {
        heading: '7. Changes to these Terms',
        paragraphs: [
          `We may update these Terms from time to time. Material changes will be notified via email at least 14 days before they take effect.`,
        ],
      },
      {
        heading: '8. Contact',
        paragraphs: [
          `Questions about these Terms? Email ${SUPPORT_EMAIL}.`,
        ],
      },
    ],
  },

  privacy: {
    slug: 'privacy',
    title: 'Privacy Policy',
    intro: `${COMPANY_NAME} is committed to protecting your personal information. This policy explains what we collect, how we use it, and the choices you have.`,
    lastUpdated: '1 June 2026',
    sections: [
      {
        heading: '1. Information we collect',
        bullets: [
          'Account information: name, email, phone number, role.',
          'Property information: address, panel count, system size, photos you upload.',
          'Service information: bookings, cleaning history, performance reports.',
          'Payment information: tokenised payment method details handled by Paystack — we do not store full card numbers.',
          'Usage information: device, browser, pages visited, and how you interact with the portal.',
        ],
      },
      {
        heading: '2. How we use your information',
        bullets: [
          'To deliver the cleaning service and produce reports.',
          'To process payments and issue invoices.',
          'To communicate about your bookings, account and service updates.',
          'To improve the product and resolve issues you raise with support.',
          'To comply with our legal obligations.',
        ],
      },
      {
        heading: '3. Sharing',
        paragraphs: [
          `We share information with service partners (e.g. Paystack for payments, Google for sign-in, hosting providers, and the field staff assigned to your visit) strictly on a need-to-know basis. We do not sell your personal information.`,
        ],
      },
      {
        heading: '4. Your choices',
        bullets: [
          'You can update or delete most account information from your profile.',
          'You can request a copy of the data we hold about you, or ask us to erase it, by emailing ' + SUPPORT_EMAIL + '.',
          'You can opt out of marketing emails at any time using the unsubscribe link.',
        ],
      },
      {
        heading: '5. Data retention',
        paragraphs: [
          `We retain account and service records for as long as your account is active and for a reasonable period afterwards to satisfy legal, accounting or reporting requirements.`,
        ],
      },
      {
        heading: '6. Security',
        paragraphs: [
          `We use industry-standard safeguards including encryption in transit, restricted access controls and regular reviews. No system is perfectly secure, however, so please use a strong unique password and keep your sign-in credentials private.`,
        ],
      },
      {
        heading: '7. Contact',
        paragraphs: [
          `Privacy questions or requests can be sent to ${SUPPORT_EMAIL}.`,
        ],
      },
    ],
  },
};

export const LEGAL_INDEX: Array<{ slug: string; title: string; description: string }> = [
  {
    slug: 'reschedule',
    title: 'Reschedule Policy',
    description: 'How to move an upcoming visit and when fees may apply.',
  },
  {
    slug: 'cancellation',
    title: 'Cancellation Policy',
    description: 'Cancelling a single visit or your subscription.',
  },
  {
    slug: 'refund',
    title: 'Refund Policy',
    description: 'Our service guarantee and how refunds are handled.',
  },
  {
    slug: 'terms',
    title: 'Terms of Service',
    description: 'The agreement that governs your use of Solanist.',
  },
  {
    slug: 'privacy',
    title: 'Privacy Policy',
    description: 'What we collect, how we use it, and your choices.',
  },
];
