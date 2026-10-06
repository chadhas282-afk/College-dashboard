import type { Metadata } from 'next';
import { Inter, JetBrains_Mono, Space_Grotesk } from 'next/font/google';
import './globals.css';

const inter = Inter({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-sans',
});

const spaceGrotesk = Space_Grotesk({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-display',
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-mono',
});

export const metadata: Metadata = {
  title: {
    default: 'College Event Hub',
    template: '%s · College Event Hub',
  },
  description:
    'Discover workshops, seminars, and hackathons on campus. Register in one click and get a calendar invite — or just ask the AI assistant.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="en"
      className={`${inter.variable} ${spaceGrotesk.variable} ${jetbrainsMono.variable}`}
    >
      <body className="font-sans">
        {/* Ambient retro-futurist backdrop: grid + drifting light blobs + a
            slow scanline sweep. All decorative and pointer-events-none. */}
        <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden" aria-hidden>
          <div className="absolute inset-0 bg-grid-faint bg-grid" />
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_55%,rgb(4_6_15/0.85)_100%)]" />

          <div className="absolute -left-32 top-10 h-96 w-96 rounded-full bg-cyan-500/20 blur-[110px] animate-float" />
          <div
            className="absolute -right-24 top-1/3 h-[26rem] w-[26rem] rounded-full bg-fuchsia-500/15 blur-[120px] animate-float"
            style={{ animationDelay: '2.4s' }}
          />
          <div
            className="absolute bottom-0 left-1/3 h-80 w-80 rounded-full bg-indigo-500/20 blur-[120px] animate-float"
            style={{ animationDelay: '4.2s' }}
          />

          <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-cyan-400/40 to-transparent" />
          <div className="absolute inset-x-0 top-0 h-24 bg-gradient-to-b from-cyan-400/[0.07] to-transparent" />
        </div>

        {children}
      </body>
    </html>
  );
}