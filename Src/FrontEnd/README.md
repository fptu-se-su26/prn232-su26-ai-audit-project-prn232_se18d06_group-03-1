# CookingCommunicate Frontend

Frontend nằm tại `Src/FrontEnd`, sử dụng React, TypeScript, Vite, Tailwind CSS, Axios và Zustand.

## Mục Đích

Dự án frontend được tổ chức theo hướng feature-based architecture để code dễ đọc, dễ mở rộng và tránh trộn lẫn logic giao diện, API và state.

- `components`: chứa component dùng lại ở nhiều nơi.
- `pages`: chứa các màn hình gắn với route.
- `features`: chứa logic theo từng nghiệp vụ, ví dụ `auth`.
- `services`: chứa cấu hình dùng chung để gọi API.
- `routes`: khai báo route và route guard.
- `hooks`, `utils`, `constants`: chứa logic dùng chung, không phụ thuộc riêng vào một feature.

## Cài Đặt Và Chạy Dự Án

```bash
pnpm install
pnpm dev
```

Nếu PowerShell chặn `pnpm`, dùng:

```bash
pnpm.cmd dev
```

Build và kiểm tra TypeScript:

```bash
pnpm.cmd run build
pnpm.cmd run check
```

## Cấu Hình Môi Trường

Tạo file `.env` từ `.env.example`:

```env
VITE_API_BASE_URL=http://localhost:5171
```

`VITE_API_BASE_URL` là base URL của backend API. Nếu không khai báo, frontend sẽ dùng giá trị mặc định trong `src/constants/appConstants.ts`.

## Cấu Trúc Thư Mục

```text
FrontEnd/
|-- public/
|   `-- vite.svg
|-- src/
|   |-- assets/
|   |   |-- images/
|   |   `-- icons/
|   |-- components/
|   |   |-- common/
|   |   |-- layout/
|   |   `-- ui/
|   |-- pages/
|   |   |-- admin/
|   |   |-- HomePage.tsx
|   |   |-- LoginPage.tsx
|   |   |-- RegisterPage.tsx
|   |   `-- NotFoundPage.tsx
|   |-- features/
|   |   `-- auth/
|   |       |-- components/
|   |       |-- hooks/
|   |       |-- services/
|   |       `-- types.ts
|   |-- services/
|   |-- hooks/
|   |-- routes/
|   |-- utils/
|   |-- constants/
|   |-- styles/
|   |-- App.tsx
|   `-- main.tsx
|-- .env
|-- .env.example
|-- index.html
|-- package.json
|-- vite.config.ts
|-- tailwind.config.js
|-- postcss.config.js
`-- README.md
```

Hiện tại chưa tạo `products` và `users` theo yêu cầu. Khi cần thêm feature mới, tạo trong `src/features/<feature-name>`.

## Hướng Dẫn Code Theo Từng Folder

### `src/assets`

Chứa file tĩnh như ảnh, icon, font.

- `assets/images`: ảnh minh họa, banner, thumbnail.
- `assets/icons`: icon riêng của dự án nếu không dùng được icon library.

Không đặt component React vào folder này.

### `src/components/common`

Chứa component dùng chung và không gắn với nghiệp vụ cụ thể.

Ví dụ:

- `Button.tsx`
- `Input.tsx`
- `Modal.tsx`
- `Loading.tsx`

Quy ước: component trong folder này nên nhận props rõ ràng, không tự gọi API, không đọc Zustand store nếu không thật sự cần.

### `src/components/ui`

Chứa component UI nhỏ, thuần hiển thị, ví dụ `Card.tsx`.

Dùng folder này cho các primitive UI hoặc wrapper style. Nếu component có logic nghiệp vụ, đưa vào `features/<feature>/components`.

### `src/components/layout`

Chứa layout của ứng dụng:

- `Header.tsx`
- `Sidebar.tsx`
- `Footer.tsx`
- `MainLayout.tsx`

Layout chỉ nên quản lý bố cục chung. Nội dung từng trang nằm trong `pages`.

### `src/pages`

Mỗi file trong `pages` đại diện cho một route hoặc một màn hình.

Ví dụ:

- `/` dùng `HomePage.tsx`
- `/login` dùng `LoginPage.tsx`
- `/register` dùng `RegisterPage.tsx`
- `/admin` dùng `admin/DashboardPage.tsx`

Page có thể import component từ `features`, `components`, `services`, nhưng không nên chứa quá nhiều logic API phức tạp. Logic API nên nằm trong `features/<feature>/services`.

### `src/features`

Chứa code theo nghiệp vụ. Mỗi feature nên có cấu trúc:

```text
features/auth/
|-- components/
|-- services/
|-- hooks/
`-- types.ts
```

Quy ước:

- `components`: component riêng của feature.
- `services`: hàm gọi API của feature.
- `hooks`: Zustand store hoặc custom hook riêng của feature.
- `types.ts`: type/interface của feature.

Ví dụ auth đang dùng Zustand tại `features/auth/hooks/useAuth.ts`.

### `src/services`

Chứa cấu hình API dùng chung.

File chính:

- `apiClient.ts`: tạo axios instance, gắn `baseURL`, gắn token vào header.
- `endpoints.ts`: nơi tập trung các endpoint string nếu muốn dùng lại.

Không viết logic nghiệp vụ dài trong `services` chung. Logic như login, register, get profile nên nằm trong `features/auth/services/authService.ts`.

### `src/routes`

Chứa cấu hình route:

- `AppRoutes.tsx`: khai báo tất cả route.
- `ProtectedRoute.tsx`: chặn route cần đăng nhập.

Khi thêm route mới, import page vào `AppRoutes.tsx` và khai báo trong `<Routes>`.

### `src/hooks`

Chứa custom hook dùng chung cho nhiều feature, ví dụ `useDebounce.ts`.

Nếu hook chỉ dùng cho một feature, đặt trong `features/<feature>/hooks`.

### `src/utils`

Chứa hàm tiện ích không phụ thuộc React, ví dụ:

- `formatDate.ts`
- `validation.ts`

Utils nên là pure function, dễ test và dễ dùng lại.

### `src/constants`

Chứa hằng số dùng chung của app, ví dụ:

- `APP_NAME`
- `DEFAULT_API_BASE_URL`

Không đặt dữ liệu thay đổi theo user/session vào constants.

### `src/styles`

Chứa CSS global. File hiện tại là `styles/index.css`, được import trong `main.tsx`.

Style riêng của component nên ưu tiên Tailwind class trực tiếp trong component.

## Cách Fetch API Bằng Axios

Toàn bộ request nên đi qua `apiClient` trong `src/services/apiClient.ts`.

`apiClient` đã cấu hình:

- `baseURL` lấy từ `VITE_API_BASE_URL`.
- Header `Accept: application/json`.
- Tự động thêm `Authorization: Bearer <token>` nếu token tồn tại trong Zustand auth store.

### Ví Dụ GET

Tạo service trong feature:

```ts
// src/features/auth/services/authService.ts
import { apiClient } from "@/services/apiClient";

export async function getProfile() {
  const res = await apiClient.get("/auth/profile");
  return res.data;
}
```

Dùng trong component hoặc page:

```tsx
import { useEffect, useState } from "react";
import { getProfile } from "@/features/auth/services/authService";

export default function ProfilePage() {
  const [profile, setProfile] = useState<unknown>(null);

  useEffect(() => {
    getProfile().then(setProfile);
  }, []);

  return <pre>{JSON.stringify(profile, null, 2)}</pre>;
}
```

### Ví Dụ POST

```ts
import { apiClient } from "@/services/apiClient";

type LoginPayload = {
  email: string;
  password: string;
};

type LoginResponse = {
  token: string;
};

export async function login(payload: LoginPayload) {
  const res = await apiClient.post<LoginResponse>("/auth/login", payload);
  return res.data;
}
```

### Xử Lý Loading Và Error

Với component đơn giản, có thể dùng `useState`:

```tsx
const [loading, setLoading] = useState(false);
const [error, setError] = useState<string | null>(null);

async function handleSubmit() {
  setLoading(true);
  setError(null);

  try {
    const data = await login({ email, password });
    setToken(data.token);
  } catch (err) {
    setError(err instanceof Error ? err.message : "Request failed");
  } finally {
    setLoading(false);
  }
}
```

Khi app lớn hơn, có thể tách thành custom hook trong `features/<feature>/hooks`.

## Cách Dùng Zustand

Auth store nằm tại:

```text
src/features/auth/hooks/useAuth.ts
```

Dùng trong component:

```tsx
import { useAuthStore } from "@/features/auth/hooks/useAuth";

const token = useAuthStore((state) => state.token);
const setToken = useAuthStore((state) => state.setToken);
const clearToken = useAuthStore((state) => state.clearToken);
```

Quy ước:

- Store riêng của feature đặt trong `features/<feature>/hooks`.
- Chỉ đưa state cần dùng chung vào Zustand.
- State cục bộ của form, modal, filter nhỏ nên dùng `useState`.

## Quy Ước Import

Dự án dùng alias:

```ts
import Button from "@/components/common/Button";
import { apiClient } from "@/services/apiClient";
```

Ưu tiên alias `@/` thay cho relative import dài như `../../../`.

## Ghi Chú Dev Proxy

Trong `vite.config.ts`, dev server proxy:

- `/api` -> `http://localhost:5171`
- `/swagger` -> `http://localhost:5171`

Proxy này chỉ dùng khi develop. Khi build production, app sẽ gọi theo `VITE_API_BASE_URL`.
