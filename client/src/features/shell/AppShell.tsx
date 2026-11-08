import type { ReactNode } from 'react';
import { Footer } from './Footer';
import { Header } from './Header';
import { Tabs } from './Tabs';

export function AppShell({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-dvh flex-col">
      <div className="sticky top-0 z-20 border-b border-line bg-surface">
        <Header />
        <Tabs className="mx-auto hidden w-full max-w-360 gap-1 px-4 sm:flex lg:hidden" />
      </div>
      <main className="mx-auto w-full max-w-360 flex-1 px-3 pt-3 pb-24 sm:px-4 sm:pb-6">{children}</main>
      <Footer />
      <Tabs className="fixed inset-x-0 bottom-0 z-20 flex border-t border-line bg-surface pb-[env(safe-area-inset-bottom)] sm:hidden" />
    </div>
  );
}
