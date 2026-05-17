import { Link } from "react-router-dom";

export default function NotFoundPage() {
  return (
    <div className="mx-auto grid max-w-xl gap-4">
      <div>
        <div className="text-sm font-medium text-zinc-500">404</div>
        <h1 className="mt-1 text-2xl font-semibold">Page not found</h1>
        <p className="mt-2 text-sm text-zinc-600">The requested route does not exist.</p>
      </div>
      <Link className="inline-flex h-10 w-fit items-center rounded-md bg-zinc-900 px-4 text-sm font-medium text-white" to="/">
        Back to home
      </Link>
    </div>
  );
}
