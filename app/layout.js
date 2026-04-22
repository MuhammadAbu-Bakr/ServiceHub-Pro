import './globals.css';
import Providers from './providers';

export const metadata = {
  title: {
    default: 'ServiceHub Pro — Find & Hire Top Freelancers',
    template: '%s | ServiceHub Pro',
  },
  description:
    'ServiceHub Pro connects businesses with top-rated freelancers. Post jobs, find talent, and grow your business with our modern service marketplace.',
  keywords: ['freelance', 'jobs', 'hire', 'services', 'marketplace'],
  openGraph: {
    type: 'website',
    locale: 'en_US',
    title: 'ServiceHub Pro',
    description: 'The modern marketplace for professional services.',
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" className="dark">
      <body className="min-h-screen bg-surface text-slate-200 font-sans antialiased">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
