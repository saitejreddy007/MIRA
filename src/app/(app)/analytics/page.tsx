import { PageHeader } from '@/components/layout/PageHeader';
import { ComingSoon } from '@/components/coming-soon';

export default function AnalyticsPage() {
  return (
    <div className="px-6 pb-12">
      <PageHeader
        title="Analytics"
        description="Recovery rates, voice evolution, and behavioral insights"
      />
      <ComingSoon
        title="Recovery intelligence"
        description="Detailed analytics on recovery rates, average days-to-payment, voice evolution, and cross-client learning will land in Phase 5."
      />
    </div>
  );
}
