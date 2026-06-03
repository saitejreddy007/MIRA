import { PageHeader } from '@/components/layout/PageHeader';
import { ComingSoon } from '@/components/coming-soon';

export default function PersonaPage() {
  return (
    <div className="px-6 pb-12">
      <PageHeader
        title="Persona"
        description="Customize who MIRA is when it talks to your clients"
      />
      <ComingSoon
        title="Persona configuration"
        description="Define your AI representative's name, role, personality anchor, and micro-naturalness. The persona layer is launching in Phase 3."
      />
    </div>
  );
}
