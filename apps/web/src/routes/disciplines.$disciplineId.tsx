import { createFileRoute } from '@tanstack/react-router';
import { DisciplineDetailPage } from '@/features/disciplines/components/discipline-detail-page';

function DisciplineRoute() {
  const { disciplineId } = Route.useParams();
  return <DisciplineDetailPage id={disciplineId} />;
}

export const Route = createFileRoute('/disciplines/$disciplineId')({ component: DisciplineRoute });
