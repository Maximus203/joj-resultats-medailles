import { createRootRoute, Link, Outlet } from '@tanstack/react-router';
import { buttonVariants } from '@/components/ui/button';

function RootLayout() {
  return (
    <div className="mx-auto flex min-h-screen max-w-3xl flex-col gap-6 p-6">
      <header className="flex items-center justify-between gap-4">
        <Link to="/" className="text-lg font-semibold">
          JOJ Dakar 2026
        </Link>
      </header>
      <main className="flex flex-col gap-6">
        <Outlet />
      </main>
    </div>
  );
}

function NotFound() {
  return (
    <div className="flex flex-col items-start gap-4">
      <h1 className="text-2xl font-semibold">Page introuvable</h1>
      <Link to="/" className={buttonVariants()}>
        Retour à l’accueil
      </Link>
    </div>
  );
}

export const Route = createRootRoute({ component: RootLayout, notFoundComponent: NotFound });
