export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

/** Minimal hand-written Database type matching supabase/migrations/*.sql. */
export interface Database {
  public: {
    Tables: {
      students: {
        Row: {
          id: string;
          full_name: string;
          email: string;
          department: string | null;
          year_of_study: number | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          full_name: string;
          email: string;
          department?: string | null;
          year_of_study?: number | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          full_name?: string;
          email?: string;
          department?: string | null;
          year_of_study?: number | null;
          created_at?: string;
        };
        Relationships: [];
      };
      events: {
        Row: {
          id: string;
          title: string;
          description: string | null;
          category: string;
          event_date: string;
          location: string | null;
          capacity: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          title: string;
          description?: string | null;
          category: string;
          event_date: string;
          location?: string | null;
          capacity: number;
          created_at?: string;
        };
        Update: {
          id?: string;
          title?: string;
          description?: string | null;
          category?: string;
          event_date?: string;
          location?: string | null;
          capacity?: number;
          created_at?: string;
        };
        Relationships: [];
      };
      registrations: {
        Row: {
          id: string;
          student_id: string;
          event_id: string;
          registered_at: string;
          google_event_id: string | null;
        };
        Insert: {
          id?: string;
          student_id: string;
          event_id: string;
          registered_at?: string;
          google_event_id?: string | null;
        };
        Update: {
          id?: string;
          student_id?: string;
          event_id?: string;
          registered_at?: string;
          google_event_id?: string | null;
        };
        Relationships: [];
      };
    };
    Views: { [_ in never]: never };
    Functions: {
      register_student_for_event: {
        Args: {
          p_email: string;
          p_full_name?: string | null;
          p_department?: string | null;
          p_year?: number | null;
          p_event_id: string;
        };
        Returns: Json;
      };
    };
    Enums: { [_ in never]: never };
    CompositeTypes: { [_ in never]: never };
  };
}

export type EventCategory = 'Workshop' | 'Seminar' | 'Hackathon';

export interface EventWithSeats {
  id: string;
  title: string;
  description: string | null;
  category: EventCategory;
  event_date: string;
  location: string | null;
  capacity: number;
  created_at: string;
  registered_count: number;
  seats_left: number;
}

export interface RegistrationRow {
  registration_id: string;
  registered_at: string;
  google_event_id: string | null;
  student_id: string;
  student_name: string;
  student_email: string;
  department: string | null;
  year_of_study: number | null;
  event_id: string;
  event_title: string;
  event_category: EventCategory;
  event_date: string;
}

export interface AdminStats {
  total_events: number;
  upcoming_events: number;
  total_registrations: number;
  total_capacity: number;
}

export interface PopularEvent {
  id: string;
  title: string;
  category: EventCategory;
  event_date: string;
  capacity: number;
  registered_count: number;
  fill_rate: number;
}

export const CATEGORY_OPTIONS: EventCategory[] = ['Workshop', 'Seminar', 'Hackathon'];

export const CATEGORY_STYLES: Record<EventCategory, string> = {
  Workshop: 'bg-emerald-400/15 text-emerald-200 ring-emerald-400/35',
  Seminar: 'bg-sky-400/15 text-sky-200 ring-sky-400/35',
  Hackathon: 'bg-fuchsia-400/15 text-fuchsia-200 ring-fuchsia-400/35',
};

/** Gradient + glyph per category, used for card banners. */
/** Neon gradient + glyph per category, used for card and detail banners. */
export const CATEGORY_ACCENTS: Record<
  EventCategory,
  { accent: string; glow: string; icon: string; ring: string }
> = {
  Workshop: {
    accent: 'from-emerald-400 via-teal-400 to-cyan-400',
    glow: 'shadow-[0_0_40px_-8px_rgb(45_212_191/0.55)]',
    icon: '🔧',
    ring: 'group-hover:shadow-[0_0_48px_-10px_rgb(45_212_191/0.65)]',
  },
  Seminar: {
    accent: 'from-sky-400 via-blue-500 to-indigo-500',
    glow: 'shadow-[0_0_40px_-8px_rgb(56_189_248/0.55)]',
    icon: '🎤',
    ring: 'group-hover:shadow-[0_0_48px_-10px_rgb(56_189_248/0.65)]',
  },
  Hackathon: {
    accent: 'from-fuchsia-400 via-violet-500 to-purple-600',
    glow: 'shadow-[0_0_40px_-8px_rgb(232_121_249/0.55)]',
    icon: '⚡',
    ring: 'group-hover:shadow-[0_0_48px_-10px_rgb(232_121_249/0.65)]',
  },
};

export function formatDate(iso: string): string {
  return new Date(iso).toLocaleString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}

/** Convert a JS Date to a "YYYY-MM-DDTHH:mm" string for <input type="datetime-local">. */
export function toDatetimeLocal(date: Date): string {
  const pad = (n: number) => String(n).padStart(2, '0');
  return (
    `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}` +
    `T${pad(date.getHours())}:${pad(date.getMinutes())}`
  );
}
