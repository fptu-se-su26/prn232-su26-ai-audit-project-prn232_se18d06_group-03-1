import { MessageCircle, Send, X } from "lucide-react";
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
import { getApiErrorMessage } from "@/services/apiClient";

function formatTime(value: string) {
  return new Intl.DateTimeFormat("vi-VN", {
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}

export default function HomeChatWidget() {
  const user = useAuthStore((state) => state.user);
  const [isOpen, setIsOpen] = useState(false);
  const [rooms, setRooms] = useState<ChatRoom[]>([]);
  const [selectedRoomId, setSelectedRoomId] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [draft, setDraft] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const canChat = Boolean(user?.roles.some((role) => role === "Customer" || role === "Owner"));

  const selectedRoom = useMemo(
    () => rooms.find((room) => room.id === selectedRoomId) ?? null,
    [rooms, selectedRoomId],
  );
  const participant = selectedRoom?.participants.find((item) => item.userId !== user?.userId);

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
        setSelectedRoomId(page.items[0]?.id ?? null);
      })
      .catch((err) => setError(getApiErrorMessage(err, "Không thể tải danh sách trò chuyện.")))
      .finally(() => setIsLoading(false));
  }, [canChat, isOpen, rooms.length]);

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

  return (
    <>
      {isOpen ? (
        <section className="fixed bottom-24 left-4 right-4 z-50 flex h-[min(560px,70vh)] flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl sm:left-auto sm:right-7 sm:w-[390px] dark:border-neutral-700 dark:bg-neutral-900">
          <header className="flex items-center justify-between bg-gradient-to-r from-brand-600 to-violet-600 px-4 py-3 text-white">
            <div>
              <p className="text-sm font-bold">Tin nhắn MoveVN</p>
              <p className="text-xs text-white/75">
                {participant?.fullName ?? "Trao đổi nhanh ngay tại đây"}
              </p>
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
          ) : (
            <>
              {rooms.length > 1 ? (
                <select
                  value={selectedRoomId ?? ""}
                  onChange={(event) => setSelectedRoomId(event.target.value)}
                  className="m-3 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm outline-none focus:border-brand-400 dark:border-neutral-700 dark:bg-neutral-800"
                >
                  {rooms.map((room) => {
                    const other = room.participants.find((item) => item.userId !== user.userId);
                    return <option key={room.id} value={room.id}>{other?.fullName ?? "Người dùng"} · {room.bookingCode}</option>;
                  })}
                </select>
              ) : null}

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

      <button
        type="button"
        onClick={() => setIsOpen((current) => !current)}
        aria-label={isOpen ? "Đóng tin nhắn" : "Mở tin nhắn"}
        title="Tin nhắn"
        className="group fixed bottom-5 right-5 z-50 flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br from-brand-500 to-violet-600 text-white shadow-[0_12px_30px_-8px_rgba(124,58,237,0.75)] transition duration-200 hover:-translate-y-1 hover:shadow-[0_16px_34px_-8px_rgba(124,58,237,0.85)] focus:outline-none focus-visible:ring-4 focus-visible:ring-brand-200 sm:bottom-7 sm:right-7"
      >
        {isOpen ? <X className="h-6 w-6" /> : <MessageCircle className="h-6 w-6" strokeWidth={2.25} />}
      </button>
    </>
  );
}
