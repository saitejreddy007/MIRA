import { VoiceNav } from './voice-nav';
import { PageHeader } from '@/components/layout/PageHeader';

export default function VoiceLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="px-6 pb-12 max-w-4xl mx-auto">
      <PageHeader
        title="Voice Profile"
        description="Manage MIRA's communication style and train her on your past messages."
      />
      <VoiceNav />
      {children}
    </div>
  );
}
