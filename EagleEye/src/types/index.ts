export interface EventItem {
  id: string;
  event_name: string;
  kml_path?: string | null;
  event_venue: string;
  venue_url?: string | null;
  event_desc?: string;
  event_start_date: string;
  event_end_date: string;
  event_organised_by: string;
  event_pic?: string | null;
  event_header_img?: string | null;
  event_footer_img?: string | null;
  speed_limit?: string;
  flag_off_time?: string;
  start_gate_close_time?: string | null;
  gps_accuracy?: string;
  event_organizer_no?: string;
  distance?: string;
  duration?: string;
  sr_path?: string | null;
  indeminity_path?: string | null;
  indemnity_path?: string | null;
  result_published?: number | string | boolean | null;
}

export interface MyEventItem {
  id?: string | number;
  participant_id: string | number;
  event_id: string | number;
  asn?: string;
  team?: string;
  driver_id?: string | number;
  navigator_id?: string | number;
  vehicle_id?: string | number;
  category_id?: string | number;
  class_id?: string | number;
  payment_mode?: string;
  payment_reference?: string;
  payment_date?: string;
  payment_amount?: string;
  terms_accepted?: string | number;
  status?: number;
  user_name?: string;
  event_name: string;
  event_pic?: string | null;
  event_desc?: string;
  event_start_date: string;
  event_end_date: string;
  event_organised_by?: string;
  event_venue?: string;
  sr_path?: string | null;
  indemninity_path?: string | null;
  indemnity_path?: string | null;
  category_name?: string;
  class_name?: string;
  vehicle_model?: string | null;
  vehicle_rc_no?: string | null;
  driver_name?: string;
  navigator_name?: string;
  status_label?: string;
}

export interface DriverItem {
  id: string;
  name: string;
  number: string;
  team: string;
  category: string;
  avatar: string;
  rank: string;
  country: string;
  points: number;
}

export interface OrganizationItem {
  id: string;
  name: string;
  type: string;
  location: string;
  eventsCount: number;
  logo: string;
}

export interface NotificationItem {
  id: string;
  title: string;
  body: string;
  time: string;
  icon: string;
}

export interface ResultItem {
  stage: string;
  pos: string;
  driver: string;
  time: string;
  gap: string;
}

export interface DriverNavigatorProfile {
  id?: string | number;
  user_id?: string | number;
  role_type: 'driver' | 'navigator';
  full_name: string;
  race_nick_name?: string;
  blood_group?: string;
  dob?: string;
  country?: string;
  gender?: string;
  mobile_no?: string;
  alternate_mobile_no?: string;
  email?: string;
  dl_no?: string;
  dl_upload?: string;
  dl_validity?: string;
  driver_pic_upload?: string;
  instagram_handle?: string;
  emergency_contact_name?: string;
  emergency_contact_no?: string;
  relation?: string;
  t_shirt_size?: string;
  asn_fmn_lic?: string;
  insurance_no?: string;
  insurance_document?: string;
  insurance_validity?: string;
  medical_condition?: string;
  approval_status?: string | number;
  is_deleted?: string | number;
  created_at?: string;
  updated_at?: string;
}

export interface VehicleProfile {
  id?: string | number;
  user_id?: string | number;
  vehicle_rc_no: string;
  vehicle_owner_name: string;
  vehicle_cc: string | number;
  is_turbo: 'Yes' | 'No' | string;
  vehicle_manufacturing: string;
  vehicle_model: string;
  fuel_type: string;
  drive_type: string;
  vehicle_nick_name: string;
  rc_upload?: string;
  rc_validity: string;
  insurance_no: string;
  insurance_validity: string;
  insurance_company: string;
  insurance_doc_upload?: string;
  fitness_upload?: string;
  fitness_validity?: string;
  vehicle_img_front?: string;
  vehicle_img_back?: string;
  vehicle_img_left?: string;
  vehicle_img_right?: string;
  vehicle_additional_info?: string;
  status: string | number;
  created_at?: string;
  updated_at?: string;
}



export interface EventCategory {
  id: string | number;
  category_name: string;
  category_desc?: string;
  event_id?: string | number;
}

export interface EventClass {
  id: string | number;
  class_name: string;
  class_desc?: string;
  category_id: string | number;
  event_id?: string | number;
}

export interface JoinEventPayload {
  event_id: string | number;
  asn?: string;
  team?: string;
  driver_id: string | number;
  navigator_id: string | number;
  vehicle_id: string | number;
  category_id: string | number;
  class_id: string | number;
  payment_mode: 'UPI' | 'Cash' | 'Card' | 'Bank Transfer' | string;
  payment_reference?: string;
  payment_date: string;
  payment_amount: number | string;
  terms_accepted: 1 | 0;
}

export type RootScreenName =
  | 'Landing'
  | 'Signup'
  | 'PostSignupOtp'
  | 'ForgotPassword'
  | 'Otp'
  | 'SetPassword'
  | 'Login'
  | 'Home'
  | 'Events'
  | 'EventDetails'
  | 'JoinEvent'
  | 'SelectDriver'
  | 'SelectNavigator'
  | 'SelectVehicle'
  | 'TermsConditions'
  | 'Drivers'
  | 'Profile'
  | 'DriverNavigatorProfile'
  | 'Vehicles'
  | 'Organizations'
  | 'Results'
  | 'Notifications'
  | 'Settings';
