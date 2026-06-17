import { Link } from "react-router-dom";
import Card from "@/components/ui/Card";
import { useAuthStore } from "@/features/auth/hooks/useAuth";
import { getApiBaseUrl } from "@/services/apiClient";

export default function HomePage() {
  const token = useAuthStore((state) => state.token);
  const user = useAuthStore((state) => state.user);
  const isStaff = user?.roles.includes("Staff") || user?.roles.includes("Admin");

  return (
    <div className="grid gap-6">
      <section className="grid gap-2">
        <h1 className="text-2xl font-semibold">Home</h1>
        <p className="text-sm text-zinc-600">Frontend structure is ready for feature-based development.</p>
      </section>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <div className="text-sm font-medium text-zinc-500">API Base URL</div>
          <div className="mt-1 break-all text-base font-semibold">{getApiBaseUrl()}</div>
        </Card>

        <Card>
          <div className="text-sm font-medium text-zinc-500">Auth Token</div>
          <div className="mt-1 text-base font-semibold">{token ? `${token.slice(0, 16)}...` : "No token saved"}</div>
          <div className="mt-2 text-sm text-zinc-600">
            {user ? `${user.fullName} • ${user.roles.join(", ")}` : "Profile will load after token validation."}
          </div>
          <Link className="mt-4 inline-flex text-sm font-medium text-zinc-900 underline" to="/login">
            Open login
          </Link>
        </Card>
      </div>

      {isStaff ? (
        <Card>
          <div className="text-sm font-medium text-zinc-500">Staff Workspace</div>
          <div className="mt-3 flex flex-wrap gap-3 text-sm">
            <Link className="rounded-md bg-zinc-900 px-3 py-2 text-white" to="/staff">
              Open staff queue
            </Link>
          </div>
        </Card>
      ) : null}
    </div>
  );
}
