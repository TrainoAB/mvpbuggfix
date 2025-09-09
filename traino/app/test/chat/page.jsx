'use client';
import Navigation from '@/app/components/Menus/Navigation';
import ChatOverview from '@/app/components/Chat/ChatOverview/ChatOverview';

export default function Chat() {
  return (
    <main>
      <Navigation />
      <ChatOverview />
    </main>
  );
}
