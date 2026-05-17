import LoginForm from "@/features/auth/components/LoginForm";

export default function LoginPage() {
  return (
    <div className="mx-auto grid max-w-xl gap-6">
      <div>
        <h1 className="text-2xl font-semibold">Login</h1>
        <p className="mt-2 text-sm text-zinc-600">Save a JWT token locally while backend auth endpoints are being connected.</p>
      </div>
      <LoginForm />
    </div>
  );
}
