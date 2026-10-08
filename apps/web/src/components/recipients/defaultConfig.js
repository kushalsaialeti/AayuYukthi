// Default CMS configuration for Care Recipient Form
// Overridable from Operations CMS via content block: 'recipient_form.config'

export const DEFAULT_RECIPIENT_CMS_CONFIG = {
  banner: {
    step: 'Step 1 of Care Setup',
    title: 'Add Care Recipient',
    description:
      'Enter essential details to customize hospital accompaniment, wheelchair logistics, and caregiver communication during critical transit and OPD consultations.',
    trustPills: [
      { icon: 'support_agent', text: 'Verified Companion Protocol' },
      { icon: 'accessible_forward', text: 'Zero-Friction Transit Logistics' },
      { icon: 'lock', text: 'Caregiver-Controlled Visibility' },
    ],
  },
  relationships: [
    { value: 'Mother', label: 'Mother' },
    { value: 'Father', label: 'Father' },
    { value: 'Spouse', label: 'Spouse' },
    { value: 'Child', label: 'Child' },
    { value: 'In-Law', label: 'In-Law (Mother/Father)' },
    { value: 'Relative', label: 'Relative / Guardian' },
    { value: 'Self', label: 'Self (Direct Account)' },
  ],
  metros: [
    { value: 'Bhimavaram', label: 'Bhimavaram & Surrounding (Active Service)' },
  ],
  hospitals: [
    'Varma Hospitals, Bhimavaram',
    'Imperial Hospitals, Bhimavaram',
    'Akshara Speciality Hospitals, Bhimavaram',
    'Mithra Medicare Hospital, Bhimavaram',
    'Nallaparaju Venkata Raju Hospital, Bhimavaram',
    'Rajarshi Hospitals, Bhimavaram',
    'Bhimavaram Hospitals, Bhimavaram',
    'Teja Super Speciality Hospital, Bhimavaram',
    'VH Care Multi-speciality Hospital, Bhimavaram',
    'Sri Venkateswara Hospitals, Bhimavaram',
    'Sri Lakshmi Hospitals, Bhimavaram',
    'Vinayaka Hospital, Bhimavaram',
    'Sai Indian Hospitals, Bhimavaram',
    'Neeladri Hospitals, Bhimavaram',
    'Abhiram Orthopaedic Hospital, Bhimavaram',
    'Maxivision Super Speciality Eye Hospitals, Bhimavaram',
  ],
  mobilityOptions: [
    {
      id: 'wheelchair',
      label: 'Wheelchair Required',
      description: 'We will arrange hospital wheelchair handoff at Gate 1 porch upon taxi or personal car arrival.',
      icon: 'accessible',
      isWheelchair: true,
    },
    {
      id: 'slow_walker',
      label: 'Slow Walker / Arm Support',
      description: 'Companion provides continuous physical stabilization during long corridor walks and incline ramps.',
      icon: 'elderly',
    },
    {
      id: 'independent',
      label: 'Independent Walker',
      description: 'Comfortable walking, only needs navigation, token queue standing, and prescription fulfillment.',
      icon: 'directions_walk',
    },
    {
      id: 'sensory',
      label: 'Visual / Hearing Support',
      description: 'Companion speaks clearly at natural volume, monitors display monitors, and repeats doctor guidance.',
      icon: 'record_voice_over',
    },
  ],
  languages: ['Telugu', 'English', 'Hindi'],
  guarantee: {
    title: 'AayuYukthi Companion Guarantee',
    description: 'Every companion is police-verified, CPR trained, and equipped with our digital hospital floor-plan GPS.',
  },
  nextSteps: [
    {
      step: 1,
      title: 'Recipient Profile Saved',
      description: 'Safe credentials stored in your caregiver dashboard.',
    },
    {
      step: 2,
      title: '1-Click Booking Ready',
      description: 'Instantly dispatch a trained companion for future appointments.',
    },
    {
      step: 3,
      title: 'Live Transit Tracking',
      description: 'Follow gate entry, OPD room queues, and medicine dispatch.',
    },
  ],
  profileImage:
    'https://lh3.googleusercontent.com/aida-public/AB6AXuBRdZ_OEWj20PzUkMZllhj199BizAnpnZiD9lofcwX5eXaHDTzaTW0Ndrjfoefz1m5dqGiD9DtRZjq8YYyLcx8nDY9ZEnpb-_AkNI5WgXUrtUSdrzomnq_AT9ioeP6A-cUyru7gj32yDB_zh62QtHYBL4p4VGAWmRBac3NiuT2wjyp7_KAp4wXdkW6xZ2Iq-sB9alKx7_AWlhCw5mHTIPT8KvcH-ui6cJ4emQLxATK_XXjAOY8MkDo',
  coordinatorImage:
    'https://lh3.googleusercontent.com/aida-public/AB6AXuATJxTS-CYEoz8i73ewIHt3iAiCVNEgCBRZFfVJGegy5Ezf2yZNand3rMKm-PS2Dy09HnFni_-uwuI23gefVkbdDw5N0qGTIgnRFheCEMbzqE06_ja6y1b3k27Lr9ZNv0MmLuYhdF8FxyBARaeof-guCuuZXmzj9JxUUGGNzdbTvwMicR_aeI6HTz2V5ML1rAB4VIK8BDrN7iZib6CEKMvjHIPnPvT7MrjXRjrCIzTqOAjbld5fFAY',
};
