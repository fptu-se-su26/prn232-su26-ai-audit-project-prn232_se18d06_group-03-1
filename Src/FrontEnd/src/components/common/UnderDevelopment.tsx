import { Construction } from "lucide-react";

export default function UnderDevelopment({ title = "Tính năng đang phát triển", description = "Tính năng này hiện đang được xây dựng và sẽ sớm ra mắt." }) {
  return (
    <div className="flex flex-col items-center justify-center py-24">
      <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-2xl bg-amber-100">
        <Construction className="h-10 w-10 text-amber-600" />
      </div>
      <h2 className="mb-2 text-xl font-bold text-slate-900">{title}</h2>
      <p className="max-w-md text-center text-sm text-slate-500">{description}</p>
    </div>
  );
}
