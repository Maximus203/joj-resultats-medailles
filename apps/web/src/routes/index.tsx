import { createFileRoute, Link } from '@tanstack/react-router';
import { buttonVariants } from '@/components/ui/button';

function Home() {
  return (
    <div className="flex flex-col items-start gap-4">
      <h1 className="text-3xl font-semibold">Jeux Olympiques de la Jeunesse, Dakar 2026</h1>
      <p className="text-muted-foreground">Application d’exemple du bootcamp Claude Code.</p>
      <Link to="/disciplines" className={buttonVariants()}>
        Voir les disciplines
      </Link>
    </div>
  );
}

export const Route = createFileRoute('/')({ component: Home });
