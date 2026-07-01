import { useEffect, useState } from "react";
import { Link } from "react-router";
import { ExternalLink } from "lucide-react";
import { Button } from "../../ui/button";
import { API_BASE_URL } from "../../../lib/apiConfig";

function getApiDocsUrl() {
  return `${API_BASE_URL}/docs`;
}

export function DocsRedirect() {
  const [docsUrl] = useState(getApiDocsUrl);

  useEffect(() => {
    window.location.replace(docsUrl);
  }, [docsUrl]);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gray-50 px-4 dark:bg-gray-900">
      <div className="w-12 h-12 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mb-4" />
      <p className="text-gray-700 dark:text-gray-200 font-medium">Redirecting to API documentation...</p>
      <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
        If you are not redirected automatically, open the backend Swagger UI directly.
      </p>
      <Button asChild variant="outline" className="mt-6">
        <a href={docsUrl} target="_blank" rel="noreferrer">
          <ExternalLink className="mr-2 h-4 w-4" />
          Open API docs
        </a>
      </Button>
      <Button asChild variant="link" className="mt-2">
        <Link to="/">Back to app</Link>
      </Button>
    </div>
  );
}
