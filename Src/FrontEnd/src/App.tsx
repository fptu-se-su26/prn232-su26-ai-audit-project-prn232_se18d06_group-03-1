import { BrowserRouter } from "react-router-dom";
import ToastViewport from "@/components/common/ToastViewport";
import AppRoutes from "@/routes/AppRoutes";

export default function App() {
  return (
    <BrowserRouter>
      <AppRoutes />
      <ToastViewport />
    </BrowserRouter>
  );
}
