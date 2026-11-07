import { createFileRoute } from '@tanstack/react-router';
import { DisciplinesPage } from '@/features/disciplines/components/disciplines-page';

export const Route = createFileRoute('/disciplines/')({ component: DisciplinesPage });
