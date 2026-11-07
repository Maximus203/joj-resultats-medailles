import { createFileRoute } from '@tanstack/react-router';

function Home() {
  return (
    <div className="flex flex-col items-start gap-4">
      <h1 className="text-3xl font-semibold">Jeux Olympiques de la Jeunesse, Dakar 2026</h1>
      <p className="text-muted-foreground">Ton application commence ici.</p>
    </div>
  );
}

export const Route = createFileRoute('/')({ component: Home });
