import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import Button from "@/components/common/Button";
import { useAuthStore } from "@/features/auth/hooks/useAuth";

export default function LoginForm() {
  const navigate = useNavigate();
  const token = useAuthStore((state) => state.token);
  const setToken = useAuthStore((state) => state.setToken);
  const clearToken = useAuthStore((state) => state.clearToken);

  const [input, setInput] = useState("");
  const canSave = useMemo(() => input.trim().length > 0, [input]);

  return (
    <div className="rounded-lg border border-zinc-200 bg-white p-5 shadow-sm">
      <label className="text-sm font-medium text-zinc-700">JWT token</label>
      <textarea
        value={input}
        onChange={(event) => setInput(event.target.value)}
        rows={5}
        className="mt-2 w-full resize-none rounded-md border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-900 outline-none focus:border-zinc-400"
        placeholder="Paste token here..."
      />

      <div className="mt-4 flex flex-wrap items-center gap-2">
        <Button
          type="button"
          disabled={!canSave}
          onClick={() => {
            setToken(input.trim());
            setInput("");
            navigate("/");
          }}
        >
          Save token
        </Button>

        <Button
          type="button"
          onClick={() => {
            clearToken();
            setInput("");
          }}
          variant="secondary"
        >
          Clear token
        </Button>

        {token ? (
          <div className="ml-auto text-xs text-zinc-500">Current token: {token.slice(0, 16)}...</div>
        ) : (
          <div className="ml-auto text-xs text-zinc-500">No token</div>
        )}
      </div>
    </div>
  );
}
