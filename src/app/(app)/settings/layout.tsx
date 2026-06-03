import { SettingsNav } from './settings-nav';
import { PageHeader } from '@/components/layout/PageHeader';
import { WhiteMirrorAttribution } from '@/components/brand/WhiteMirrorAttribution';

export default function SettingsLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="px-6 pb-12 max-w-3xl">
      <PageHeader
        title="Settings"
        description="Manage your business profile and account"
      />
      <SettingsNav />
      {children}
      
      <div className="mt-12 pt-8 border-t border-border flex flex-col sm:flex-row items-center justify-between gap-4">
        <p className="text-xs text-muted-foreground">MIRA Settings &middot; Version 1.0.0</p>
        <WhiteMirrorAttribution />
      </div>
    </div>
  );
}
