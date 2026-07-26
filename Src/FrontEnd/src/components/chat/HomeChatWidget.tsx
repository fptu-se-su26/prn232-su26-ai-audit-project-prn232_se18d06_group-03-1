import { ChevronLeft, Heart, MessageCircle, Send, X } from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { useAuthStore } from "@/features/auth/hooks/useAuth";
import {
  getChatMessages,
  getChatRooms,
  markChatRoomAsRead,
  sendChatMessage,
} from "@/features/chat/chatService";
import type { ChatMessage, ChatRoom } from "@/features/chat/types";
import { usePresenceStore } from "@/features/presence/usePresence";
import { getApiErrorMessage } from "@/services/apiClient";
import { getFavoriteVehicles } from "@/features/vehicles/services/favoriteVehicleService";
import type { VehicleListItemResponse } from "@/features/vehicles/types";

function formatTime(value: string) {
  return new Intl.DateTimeFormat("vi-VN", {
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}

function formatPresence(isOnline: boolean, lastSeenAt?: string | null) {
  if (isOnline) return "Đang hoạt động";
  if (!lastSeenAt) return "Ngoại tuyến";

  const minutes = Math.max(0, Math.floor((Date.now() - new Date(lastSeenAt).getTime()) / 60_000));
  if (minutes < 1) return "Vừa mới hoạt động";
  if (minutes < 60) return `Hoạt động ${minutes} phút trước`;
  if (minutes < 1_440) return `Hoạt động ${Math.floor(minutes / 60)} giờ trước`;
  return `Hoạt động ${Math.floor(minutes / 1_440)} ngày trước`;
}

export default function HomeChatWidget() {
  const user = useAuthStore((state) => state.user);
  const presenceUsers = usePresenceStore((state) => state.users);
  const hydratePresenceUsers = usePresenceStore((state) => state.hydrateUsers);
  const [isOpen, setIsOpen] = useState(false);
  const [rooms, setRooms] = useState<ChatRoom[]>([]);
  const [selectedRoomId, setSelectedRoomId] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [draft, setDraft] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [favoritesOpen, setFavoritesOpen] = useState(false);
  const [favorites, setFavorites] = useState<VehicleListItemResponse[]>([]);
  const [favoritesLoading, setFavoritesLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const canChat = Boolean(user?.roles.some((role) => role === "Customer" || role === "Owner"));

  const selectedRoom = useMemo(
    () => rooms.find((room) => room.id === selectedRoomId) ?? null,
    [rooms, selectedRoomId],
  );
  const participant = selectedRoom?.participants.find((item) => item.userId !== user?.userId);
  const participantPresence = participant
    ? presenceUsers[participant.userId] ?? {
        isOnline: participant.isOnline,
        lastSeenAt: participant.lastSeenAt ?? null,
      }
    : null;

  const loadMessages = useCallback(async (roomId: string, showLoading = true) => {
    if (showLoading) setIsLoading(true);
    try {
      const page = await getChatMessages(roomId, { page: 1, pageSize: 50 });
      setMessages(page.items);
      await markChatRoomAsRead(roomId);
    } catch (err) {
      if (showLoading) setError(getApiErrorMessage(err, "Không thể tải tin nhắn."));
    } finally {
      if (showLoading) setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!isOpen || !canChat || rooms.length > 0) return;
    setIsLoading(true);
    setError(null);
    getChatRooms({ page: 1, pageSize: 20 })
      .then((page) => {
        setRooms(page.items);
        hydratePresenceUsers(
          page.items.flatMap((room) =>
            room.participants.map((item) => ({
              userId: item.userId,
              isOnline: item.isOnline,
              lastSeenAt: item.lastSeenAt ?? null,
            })),
          ),
        );
        setSelectedRoomId(page.items.length === 1 ? page.items[0].id : null);
      })
      .catch((err) => setError(getApiErrorMessage(err, "Không thể tải danh sách trò chuyện.")))
      .finally(() => setIsLoading(false));
  }, [canChat, hydratePresenceUsers, isOpen, rooms.length]);

  useEffect(() => {
    if (!isOpen || !selectedRoomId) return;
    void loadMessages(selectedRoomId);
    const timer = window.setInterval(() => void loadMessages(selectedRoomId, false), 5000);
    return () => window.clearInterval(timer);
  }, [isOpen, loadMessages, selectedRoomId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  async function handleSend() {
    if (!selectedRoomId || !draft.trim() || isSending) return;
    setIsSending(true);
    setError(null);
    try {
      const message = await sendChatMessage(selectedRoomId, { content: draft.trim() });
      setMessages((current) =>
        current.some((item) => item.id === message.id) ? current : [...current, message],
      );
      setDraft("");
    } catch (err) {
      setError(getApiErrorMessage(err, "Không thể gửi tin nhắn."));
    } finally {
      setIsSending(false);
    }
  }

  async function toggleFavorites() {
    const next = !favoritesOpen;
    setFavoritesOpen(next);
    setIsOpen(false);
    if (!next) return;
    setFavoritesLoading(true);
    try {
      const result = await getFavoriteVehicles(1, 5);
      setFavorites(result.items);
    } catch {
      setFavorites([]);
    } finally {
      setFavoritesLoading(false);
    }
  }

  return (
    <>
      {isOpen ? (
        <section className="fixed bottom-24 left-4 right-4 z-50 flex h-[min(560px,70vh)] flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl sm:left-auto sm:right-7 sm:w-[390px] dark:border-neutral-700 dark:bg-neutral-900">
          <header className="flex items-center justify-between bg-gradient-to-r from-brand-600 to-violet-600 px-4 py-3 text-white">
            <div className="flex min-w-0 items-center gap-2">
              {selectedRoomId && rooms.length > 1 ? (
                <button
                  type="button"
                  onClick={() => setSelectedRoomId(null)}
                  aria-label="Quay lại danh sách trò chuyện"
                  className="rounded-full p-1.5 transition hover:bg-white/15"
                >
                  <ChevronLeft className="h-5 w-5" />
                </button>
              ) : null}
              <div className="min-w-0">
                <p className="truncate text-sm font-bold">
                  {participant?.fullName ?? "Tin nhắn MoveVN"}
                </p>
                <p className="truncate text-xs text-white/75">
                  {selectedRoom
                    ? formatPresence(
                        participantPresence?.isOnline ?? false,
                        participantPresence?.lastSeenAt,
                      )
                    : rooms.length > 0
                      ? `${rooms.length} cuộc trò chuyện`
                      : "Trao đổi nhanh ngay tại đây"}
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              aria-label="Đóng cửa sổ tin nhắn"
              className="rounded-full p-2 transition hover:bg-white/15"
            >
              <X className="h-5 w-5" />
            </button>
          </header>

          {!user ? (
            <div className="flex flex-1 flex-col items-center justify-center gap-3 p-8 text-center">
              <MessageCircle className="h-12 w-12 text-brand-500" />
              <p className="font-semibold text-slate-900 dark:text-white">Đăng nhập để xem tin nhắn</p>
              <p className="text-sm text-slate-500">Bạn có thể trò chuyện trực tiếp với chủ xe hoặc khách thuê.</p>
              <Link to="/login" className="rounded-lg bg-brand-600 px-5 py-2 text-sm font-semibold text-white hover:bg-brand-700">
                Đăng nhập
              </Link>
            </div>
          ) : !canChat ? (
            <div className="flex flex-1 items-center justify-center p-8 text-center text-sm text-slate-500">
              Tính năng chat hiện dành cho khách thuê và chủ xe.
            </div>
          ) : rooms.length === 0 && !isLoading ? (
            <div className="flex flex-1 flex-col items-center justify-center gap-2 p-8 text-center">
              <MessageCircle className="h-12 w-12 text-slate-300" />
              <p className="font-semibold text-slate-700 dark:text-slate-200">Chưa có cuộc trò chuyện</p>
              <p className="text-sm text-slate-500">Phòng chat sẽ xuất hiện sau khi bạn có booking.</p>
            </div>
          ) : !selectedRoomId ? (
            <div className="min-h-0 flex-1 overflow-y-auto bg-slate-50 p-2 dark:bg-neutral-950">
              {isLoading ? (
                <p className="py-8 text-center text-sm text-slate-400">Đang tải...</p>
              ) : (
                rooms.map((room) => {
                  const other = room.participants.find((item) => item.userId !== user.userId);
                  const presence = other
                    ? presenceUsers[other.userId] ?? {
                        isOnline: other.isOnline,
                        lastSeenAt: other.lastSeenAt ?? null,
                      }
                    : null;
                  return (
                    <button
                      key={room.id}
                      type="button"
                      onClick={() => setSelectedRoomId(room.id)}
                      className="mb-1 flex w-full items-center gap-3 rounded-xl border border-transparent bg-white p-3 text-left shadow-sm transition hover:border-brand-200 hover:bg-brand-50 dark:bg-neutral-900 dark:hover:border-brand-700 dark:hover:bg-neutral-800"
                    >
                      <div className="relative shrink-0">
                        <div className="flex h-11 w-11 items-center justify-center rounded-full bg-gradient-to-br from-brand-500 to-violet-600 font-bold text-white">
                          {(other?.fullName ?? "?").trim().charAt(0).toUpperCase()}
                        </div>
                        <span
                          className={`absolute bottom-0 right-0 h-3 w-3 rounded-full border-2 border-white ${
                            presence?.isOnline ? "bg-emerald-500" : "bg-slate-300"
                          }`}
                        />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center justify-between gap-2">
                          <p className="truncate text-sm font-semibold text-slate-900 dark:text-white">
                            {other?.fullName ?? "Người dùng"}
                          </p>
                          {room.unreadCount > 0 ? (
                            <span className="flex min-h-5 min-w-5 items-center justify-center rounded-full bg-brand-600 px-1.5 text-[11px] font-bold text-white">
                              {room.unreadCount}
                            </span>
                          ) : null}
                        </div>
                        <p className={`truncate text-xs ${
                          presence?.isOnline ? "text-emerald-600" : "text-slate-400"
                        }`}>
                          {formatPresence(presence?.isOnline ?? false, presence?.lastSeenAt)}
                        </p>
                        <p className="truncate text-[11px] text-slate-400">Booking {room.bookingCode}</p>
                        <p className="mt-0.5 truncate text-xs text-slate-500">
                          {room.lastMessage?.text ?? "Chưa có tin nhắn"}
                        </p>
                      </div>
                    </button>
                  );
                })
              )}
            </div>
          ) : (
            <>
              <div className="flex-1 space-y-2 overflow-y-auto bg-slate-50 p-3 dark:bg-neutral-950">
                {isLoading ? (
                  <p className="py-8 text-center text-sm text-slate-400">Đang tải...</p>
                ) : messages.map((message) => {
                  const isMine = message.senderId === user.userId;
                  return (
                    <div key={message.id} className={`flex ${isMine ? "justify-end" : "justify-start"}`}>
                      <div className={`max-w-[82%] rounded-2xl px-3 py-2 text-sm shadow-sm ${
                        isMine
                          ? "rounded-br-sm bg-brand-600 text-white"
                          : "rounded-bl-sm bg-white text-slate-800 dark:bg-neutral-800 dark:text-slate-100"
                      }`}>
                        <p className="whitespace-pre-wrap break-words">{message.content}</p>
                        <p className={`mt-1 text-right text-[10px] ${isMine ? "text-white/70" : "text-slate-400"}`}>
                          {formatTime(message.sentAt)}
                        </p>
                      </div>
                    </div>
                  );
                })}
                <div ref={messagesEndRef} />
              </div>

              {error ? <p className="px-3 pt-2 text-xs text-red-600">{error}</p> : null}
              <div className="flex items-center gap-2 border-t border-slate-200 p-3 dark:border-neutral-700">
                <input
                  value={draft}
                  onChange={(event) => setDraft(event.target.value)}
                  onKeyDown={(event) => {
                    if (event.key === "Enter") void handleSend();
                  }}
                  maxLength={2000}
                  placeholder="Nhập tin nhắn..."
                  className="min-w-0 flex-1 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm outline-none focus:border-brand-400 dark:border-neutral-700 dark:bg-neutral-800"
                />
                <button
                  type="button"
                  onClick={() => void handleSend()}
                  disabled={!draft.trim() || isSending}
                  aria-label="Gửi tin nhắn"
                  className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-600 text-white transition hover:bg-brand-700 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <Send className="h-4 w-4" />
                </button>
              </div>
            </>
          )}
        </section>
      ) : null}

      {favoritesOpen ? (
        <section className="fixed bottom-[9.5rem] left-4 right-4 z-50 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl sm:left-auto sm:right-7 sm:w-[360px] dark:border-neutral-700 dark:bg-neutral-900">
          <header className="flex items-center justify-between border-b border-slate-100 px-4 py-3 dark:border-neutral-800">
            <div className="flex items-center gap-2">
              <Heart className="h-5 w-5 fill-rose-500 text-rose-500" />
              <div>
                <p className="text-sm font-bold text-slate-900 dark:text-white">Xe yêu thích</p>
                <p className="text-xs text-slate-500">Danh sách bạn đã lưu</p>
              </div>
            </div>
            <button type="button" onClick={() => setFavoritesOpen(false)} className="rounded-full p-1.5 text-slate-400 hover:bg-slate-100 dark:hover:bg-neutral-800" aria-label="Đóng xe yêu thích">
              <X className="h-4 w-4" />
            </button>
          </header>

          <div className="max-h-72 overflow-y-auto p-2">
            {favoritesLoading ? (
              <p className="py-8 text-center text-sm text-slate-400">Đang tải...</p>
            ) : favorites.length === 0 ? (
              <div className="py-8 text-center">
                <Heart className="mx-auto h-9 w-9 text-slate-200" />
                <p className="mt-2 text-sm font-semibold text-slate-600 dark:text-slate-300">Chưa có xe yêu thích</p>
                <Link to="/vehicle" onClick={() => setFavoritesOpen(false)} className="mt-3 inline-flex text-sm font-semibold text-brand-600 hover:text-brand-700">
                  Khám phá xe
                </Link>
              </div>
            ) : (
              favorites.map((vehicle) => (
                <Link
                  key={vehicle.id}
                  to={`/vehicle/${vehicle.id}`}
                  onClick={() => setFavoritesOpen(false)}
                  className="flex items-center gap-3 rounded-xl p-2 transition hover:bg-slate-50 dark:hover:bg-neutral-800"
                >
                  <div className="h-14 w-20 shrink-0 overflow-hidden rounded-lg bg-slate-100">
                    {vehicle.featuredImage ? <img src={vehicle.featuredImage} alt="" className="h-full w-full object-cover" /> : null}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold text-slate-900 dark:text-white">{vehicle.brandName} {vehicle.modelName} {vehicle.year}</p>
                    <p className="mt-1 text-xs font-semibold text-brand-600">{new Intl.NumberFormat("vi-VN").format(vehicle.pricePerDay)}đ/ngày</p>
                  </div>
                </Link>
              ))
            )}
          </div>

          <Link
            to="/customer/favorites"
            onClick={() => setFavoritesOpen(false)}
            className="flex h-11 items-center justify-center border-t border-slate-100 text-sm font-bold text-brand-600 transition hover:bg-brand-50 dark:border-neutral-800 dark:hover:bg-neutral-800"
          >
            Xem tất cả xe yêu thích
          </Link>
        </section>
      ) : null}

      {user?.roles.includes("Customer") && !isOpen ? (
        <button
          type="button"
          onClick={() => void toggleFavorites()}
          aria-label="Mở danh sách xe yêu thích"
          title="Xe yêu thích"
          className={`group fixed bottom-[5.75rem] right-6 z-50 flex h-12 w-12 items-center justify-center rounded-full border text-rose-500 shadow-[0_10px_26px_-8px_rgba(244,63,94,0.55)] transition duration-200 hover:-translate-y-1 hover:shadow-[0_14px_30px_-8px_rgba(244,63,94,0.65)] focus:outline-none focus-visible:ring-4 focus-visible:ring-rose-100 sm:bottom-[6.5rem] sm:right-8 dark:border-rose-500/20 dark:text-rose-400 ${favoritesOpen ? "border-rose-200 bg-rose-50" : "border-rose-100 bg-white hover:bg-rose-50 dark:bg-neutral-900"}`}
        >
          {favoritesOpen ? <X className="h-5.5 w-5.5" /> : <Heart className="h-5.5 w-5.5 fill-current" />}
        </button>
      ) : null}

      <button
        type="button"
        onClick={() => {
          setFavoritesOpen(false);
          setIsOpen((current) => !current);
        }}
        aria-label={isOpen ? "Đóng tin nhắn" : "Mở tin nhắn"}
        title="Tin nhắn"
        className="group fixed bottom-5 right-5 z-50 flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br from-brand-500 to-violet-600 text-white shadow-[0_12px_30px_-8px_rgba(124,58,237,0.75)] transition duration-200 hover:-translate-y-1 hover:shadow-[0_16px_34px_-8px_rgba(124,58,237,0.85)] focus:outline-none focus-visible:ring-4 focus-visible:ring-brand-200 sm:bottom-7 sm:right-7"
      >
        {isOpen ? <X className="h-6 w-6" /> : <MessageCircle className="h-6 w-6" strokeWidth={2.25} />}
      </button>
    </>
  );
}
