import { Link } from "react-router";
import { Home, ArrowLeft } from "lucide-react";
import { Button } from "../../ui/button";

export function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gray-50 px-4 dark:bg-gray-900">
      <p className="text-sm font-medium text-indigo-600 dark:text-indigo-400">404</p>
      <h1 className="mt-2 text-3xl font-bold tracking-tight text-gray-900 dark:text-white">
        Page not found
      </h1>
      <p className="mt-3 max-w-md text-center text-gray-500 dark:text-gray-400">
        This route does not exist in the PG Management app. Check the URL or return to the dashboard.
      </p>
      <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
        <Button asChild variant="default">
          <Link to="/">
            <Home className="mr-2 h-4 w-4" />
            Go to dashboard
          </Link>
        </Button>
        <Button variant="outline" onClick={() => window.history.back()}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Go back
        </Button>
      </div>
    </div>
  );
}
