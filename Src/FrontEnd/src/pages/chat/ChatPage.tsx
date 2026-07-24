import { HubConnection, HubConnectionBuilder, HubConnectionState, LogLevel } from "@microsoft/signalr";
import { Car, CheckCheck, MessageSquare, Send, Wifi, WifiOff } from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Link, useParams } from "react-router-dom";
import Button from "@/components/common/Button";
import LoadingSpinner from "@/components/common/LoadingSpinner";
import { getAuthUser, getToken, useAuthStore } from "@/features/auth/hooks/useAuth";
import {
  getChatMessages,
  getChatRooms,
  getOrCreateChatRoomByBooking,
  markChatRoomAsRead,
  sendChatMessage,
} from "@/features/chat/chatService";
import type { ChatMessage, ChatMessageCreatedPayload, ChatRoom } from "@/features/chat/types";
import { getApiBaseUrl, getApiErrorMessage } from "@/services/apiClient";

function formatTime(value: string) {
  const date = new Date(value);
  const now = new Date();
  const isToday =
    date.getDate() === now.getDate() &&
    date.getMonth() === now.getMonth() &&
    date.getFullYear() === now.getFullYear();

  if (isToday) {
    return new Intl.DateTimeFormat("vi-VN", { hour: "2-digit", minute: "2-digit" }).format(date);
  }
  return new Intl.DateTimeFormat("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

function getAvatarInitials(name: string) {
  return name
    .split(" ")
    .map((word) => word[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

function moveRoomToTop(rooms: ChatRoom[], room: ChatRoom, unreadCount?: number) {
  const existing = rooms.find((item) => item.id === room.id);
  const nextRoom = {
    ...(existing ?? room),
    ...room,
    unreadCount: unreadCount ?? existing?.unreadCount ?? room.unreadCount,
  };

  return [nextRoom, ...rooms.filter((item) => item.id !== room.id)].sort(
    (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime(),
  );
}

function appendMessage(messages: ChatMessage[], message: ChatMessage) {
  if (messages.some((item) => item.id === message.id)) {
    return messages;
  }

  return [...messages, message].sort((a, b) => new Date(a.sentAt).getTime() - new Date(b.sentAt).getTime());
}

export default function ChatPage() {
  const { bookingId } = useParams<{ bookingId?: string }>();
  const user = useAuthStore((state) => state.user);
  const [rooms, setRooms] = useState<ChatRoom[]>([]);
  const [selectedRoomId, setSelectedRoomId] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [draft, setDraft] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isLoadingRooms, setIsLoadingRooms] = useState(true);
  const [isLoadingMessages, setIsLoadingMessages] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [connectionReady, setConnectionReady] = useState(false);
  const connectionRef = useRef<HubConnection | null>(null);
  const selectedRoomRef = useRef<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);

  const selectedRoom = useMemo(
    () => rooms.find((room) => room.id === selectedRoomId) ?? null,
    [rooms, selectedRoomId],
  );

  const otherParticipant = useMemo(() => {
    if (!selectedRoom || !user) return null;
    return selectedRoom.participants.find((participant) => participant.userId !== user.userId) ?? null;
  }, [selectedRoom, user]);

  const bookingDetailPath = selectedRoom
    ? user?.userId === selectedRoom.ownerId
      ? `/owner/bookings/${selectedRoom.bookingId}`
      : `/customer/bookings/${selectedRoom.bookingId}`
    : "/chat";

  useEffect(() => {
    selectedRoomRef.current = selectedRoomId;
  }, [selectedRoomId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages.length, selectedRoomId]);

  const loadRooms = useCallback(async () => {
    setIsLoadingRooms(true);
    setError(null);
    try {
      const [roomPage, bookingRoom] = await Promise.all([
        getChatRooms({ page: 1, pageSize: 30 }),
        bookingId ? getOrCreateChatRoomByBooking(Number(bookingId)) : Promise.resolve(null),
      ]);

      const nextRooms = bookingRoom ? moveRoomToTop(roomPage.items, bookingRoom, 0) : roomPage.items;
      setRooms(nextRooms);
      setSelectedRoomId((current) => bookingRoom?.id ?? current ?? nextRooms[0]?.id ?? null);
    } catch (err) {
      setError(getApiErrorMessage(err, "Không thể tải danh sách chat."));
    } finally {
      setIsLoadingRooms(false);
    }
  }, [bookingId]);

  useEffect(() => {
    void loadRooms();
  }, [loadRooms]);

  useEffect(() => {
    if (!selectedRoomId) {
      setMessages([]);
      return;
    }

    let isMounted = true;
    setIsLoadingMessages(true);
    setError(null);

    getChatMessages(selectedRoomId, { page: 1, pageSize: 50 })
      .then(async (page) => {
        if (!isMounted) return;
        setMessages(page.items);
        const updated = await markChatRoomAsRead(selectedRoomId);
        if (!isMounted) return;
        setRooms((current) => moveRoomToTop(current, updated, 0));
      })
      .catch((err) => {
        if (isMounted) setError(getApiErrorMessage(err, "Không thể tải tin nhắn."));
      })
      .finally(() => {
        if (isMounted) setIsLoadingMessages(false);
      });

    return () => {
      isMounted = false;
    };
  }, [selectedRoomId]);

  useEffect(() => {
    const token = getToken();
    const currentUser = getAuthUser();
    if (!token || !currentUser) return;

    const connection = new HubConnectionBuilder()
      .withUrl(`${getApiBaseUrl()}/hubs/chat`, {
        accessTokenFactory: () => getToken() ?? "",
      })
      .withAutomaticReconnect()
      .configureLogging(LogLevel.Warning)
      .build();

    connectionRef.current = connection;

    connection.on("chat.messageCreated", (payload: ChatMessageCreatedPayload) => {
      const activeRoomId = selectedRoomRef.current;
      const isActiveRoom = payload.message.roomId === activeRoomId;
      const isIncoming = payload.message.senderId !== currentUser.userId;

      if (isActiveRoom) {
        setMessages((current) => appendMessage(current, payload.message));
        void markChatRoomAsRead(payload.message.roomId).then((updated) => {
          setRooms((current) => moveRoomToTop(current, updated, 0));
        }).catch(() => undefined);
      }

      setRooms((current) => {
        const existing = current.find((room) => room.id === payload.room.id);
        const unreadCount = isActiveRoom
          ? 0
          : (existing?.unreadCount ?? payload.room.unreadCount ?? 0) + (isIncoming ? 1 : 0);
        return moveRoomToTop(current, payload.room, unreadCount);
      });
    });

    connection.on("chat.roomUpdated", (room: ChatRoom) => {
      setRooms((current) => moveRoomToTop(current, room, room.id === selectedRoomRef.current ? 0 : room.unreadCount));
    });

    connection.onreconnecting(() => setConnectionReady(false));
    connection.onreconnected(() => {
      setConnectionReady(true);
      const activeRoomId = selectedRoomRef.current;
      if (activeRoomId) {
        void connection.invoke("JoinRoom", activeRoomId).catch(() => undefined);
      }
    });
    connection.onclose(() => setConnectionReady(false));

    connection
      .start()
      .then(() => setConnectionReady(true))
      .catch(() => setConnectionReady(false));

    return () => {
      setConnectionReady(false);
      connection.off("chat.messageCreated");
      connection.off("chat.roomUpdated");
      void connection.stop();
      connectionRef.current = null;
    };
  }, []);

  useEffect(() => {
    const connection = connectionRef.current;
    if (!selectedRoomId || !connectionReady || connection?.state !== HubConnectionState.Connected) return;

    void connection.invoke("JoinRoom", selectedRoomId).catch(() => undefined);
    return () => {
      void connection.invoke("LeaveRoom", selectedRoomId).catch(() => undefined);
    };
  }, [connectionReady, selectedRoomId]);

  async function handleSend() {
    if (!selectedRoomId || !draft.trim() || isSending) return;
    setIsSending(true);
    setError(null);
    const content = draft.trim();
    try {
      const sent = await sendChatMessage(selectedRoomId, { content });
      setDraft("");
      if (textareaRef.current) {
        textareaRef.current.style.height = "auto";
      }
      setMessages((current) => appendMessage(current, sent));
      setRooms((current) => {
        const room = current.find((item) => item.id === selectedRoomId);
        if (!room) return current;
        return moveRoomToTop(current, {
          ...room,
          lastMessage: { text: sent.content, senderId: sent.senderId, sentAt: sent.sentAt },
          updatedAt: sent.sentAt,
        }, 0);
      });
    } catch (err) {
      setError(getApiErrorMessage(err, "Không thể gửi tin nhắn."));
    } finally {
      setIsSending(false);
    }
  }

  function handleTextareaChange(event: React.ChangeEvent<HTMLTextAreaElement>) {
    setDraft(event.target.value);
    event.target.style.height = "auto";
    event.target.style.height = `${Math.min(event.target.scrollHeight, 120)}px`;
  }

  return (
    <div className="mx-auto flex h-[calc(100vh-7rem)] min-h-[620px] max-w-6xl flex-col gap-4">
      {/* Page header */}
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.14em] text-brand-700">Chat realtime</p>
          <h1 className="mt-1 text-2xl font-bold text-slate-950">Tin nhắn booking</h1>
        </div>
        <div className="flex items-center gap-3">
          {/* Connection status */}
          <span
            className={[
              "flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium",
              connectionReady
                ? "bg-emerald-50 text-emerald-700"
                : "bg-slate-100 text-slate-500",
            ].join(" ")}
          >
            {connectionReady ? <Wifi className="h-3.5 w-3.5" /> : <WifiOff className="h-3.5 w-3.5" />}
            {connectionReady ? "Đang kết nối" : "Đang tải..."}
          </span>
          {selectedRoom?.bookingId ? (
            <Link to={bookingDetailPath}>
              <Button variant="secondary" size="sm">Xem booking</Button>
            </Link>
          ) : null}
        </div>
      </header>

      {error ? (
        <div className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>
      ) : null}

      <div className="grid min-h-0 flex-1 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm lg:grid-cols-[320px_1fr]">
        {/* Room list sidebar */}
        <aside className="flex min-h-0 flex-col border-b border-slate-200 bg-slate-50 lg:border-b-0 lg:border-r">
          <div className="border-b border-slate-200 px-4 py-3.5">
            <p className="text-sm font-semibold text-slate-900">Cuộc trò chuyện</p>
            <p className="mt-0.5 text-xs text-slate-500">{rooms.length} phòng chat</p>
          </div>
          <div className="flex-1 overflow-y-auto p-2">
            {isLoadingRooms ? (
              <div className="flex h-32 items-center justify-center">
                <LoadingSpinner />
              </div>
            ) : rooms.length === 0 ? (
              <div className="mt-8 flex flex-col items-center gap-2 px-4 text-center">
                <div className="flex h-14 w-14 items-center justify-center rounded-full bg-slate-100">
                  <MessageSquare className="h-7 w-7 text-slate-300" />
                </div>
                <p className="text-sm font-medium text-slate-600">Chưa có phòng chat</p>
                <p className="text-xs text-slate-400">Mở chi tiết booking để bắt đầu chat</p>
              </div>
            ) : (
              rooms.map((room) => {
                const participant = room.participants.find((item) => item.userId !== user?.userId);
                const isActive = room.id === selectedRoomId;
                const initials = getAvatarInitials(participant?.fullName ?? "?");
                return (
                  <button
                    key={room.id}
                    type="button"
                    onClick={() => setSelectedRoomId(room.id)}
                    className={[
                      "mb-1 w-full rounded-lg border px-3 py-3 text-left transition-all duration-150",
                      isActive
                        ? "border-brand-200 bg-white shadow-sm"
                        : "border-transparent hover:border-slate-200 hover:bg-white",
                    ].join(" ")}
                  >
                    <div className="flex items-start gap-3">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-brand-500 to-violet-600 text-sm font-semibold text-white shadow-sm">
                        {initials}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center justify-between gap-2">
                          <p className="truncate text-sm font-semibold text-slate-900">
                            {participant?.fullName ?? "Người dùng"}
                          </p>
                          {room.unreadCount > 0 ? (
                            <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-brand-600 px-1.5 text-[11px] font-bold text-white">
                              {room.unreadCount}
                            </span>
                          ) : null}
                        </div>
                        <p className="mt-0.5 truncate text-[11px] font-medium text-slate-400">
                          Booking {room.bookingCode}
                        </p>
                        <p className="mt-0.5 truncate text-xs text-slate-500">
                          {room.lastMessage?.text ?? "Chưa có tin nhắn"}
                        </p>
                      </div>
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </aside>

        {/* Chat area */}
        <section className="flex min-h-0 flex-col">
          {selectedRoom ? (
            <>
              {/* Chat header */}
              <div className="flex items-center justify-between gap-3 border-b border-slate-200 bg-white px-4 py-3">
                <div className="flex min-w-0 items-center gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-slate-400 to-slate-600 text-sm font-semibold text-white shadow-sm">
                    {getAvatarInitials(otherParticipant?.fullName ?? "?")}
                  </div>
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-slate-950">
                      {otherParticipant?.fullName ?? "Người dùng"}
                    </p>
                    <p className="truncate text-xs text-slate-500">
                      {selectedRoom.bookingCode}
                      {selectedRoom.vehicleName ? ` · ${selectedRoom.vehicleName}` : ""}
                    </p>
                  </div>
                </div>
                {selectedRoom.vehicleId ? (
                  <div className="hidden items-center gap-1.5 rounded-lg bg-slate-50 px-3 py-1.5 text-xs font-medium text-slate-600 sm:flex">
                    <Car className="h-3.5 w-3.5" />
                    Xe #{selectedRoom.vehicleId}
                  </div>
                ) : null}
              </div>

              {/* Messages */}
              <div className="min-h-0 flex-1 space-y-2 overflow-y-auto bg-[#f7f8fc] px-4 py-4">
                {isLoadingMessages ? (
                  <div className="flex h-full items-center justify-center">
                    <LoadingSpinner />
                  </div>
                ) : messages.length === 0 ? (
                  <div className="flex h-full flex-col items-center justify-center gap-2 text-center">
                    <div className="flex h-16 w-16 items-center justify-center rounded-full bg-white shadow-sm">
                      <MessageSquare className="h-8 w-8 text-slate-300" />
                    </div>
                    <p className="text-sm font-medium text-slate-500">Chưa có tin nhắn</p>
                    <p className="text-xs text-slate-400">Hãy bắt đầu trao đổi về booking này</p>
                  </div>
                ) : (
                  messages.map((message, index) => {
                    const isMine = message.senderId === user?.userId;
                    const prevMessage = messages[index - 1];
                    const showAvatar =
                      !isMine &&
                      (index === 0 || prevMessage?.senderId !== message.senderId);

                    return (
                      <div
                        key={message.id}
                        className={`flex items-end gap-2 ${isMine ? "justify-end" : "justify-start"}`}
                      >
                        {!isMine ? (
                          <div
                            className={[
                              "flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-[10px] font-bold text-white shadow-sm",
                              showAvatar
                                ? "bg-gradient-to-br from-brand-500 to-violet-600"
                                : "invisible",
                            ].join(" ")}
                          >
                            {getAvatarInitials(message.senderName)}
                          </div>
                        ) : null}
                        <div className={`max-w-[72%] ${isMine ? "" : ""}`}>
                          {showAvatar && !isMine ? (
                            <p className="mb-1 ml-1 text-[11px] font-semibold text-slate-500">{message.senderName}</p>
                          ) : null}
                          <div
                            className={[
                              "rounded-2xl px-4 py-2.5 shadow-sm",
                              isMine
                                ? "rounded-br-sm bg-brand-600 text-white"
                                : "rounded-bl-sm bg-white text-slate-800",
                            ].join(" ")}
                          >
                            <p className="whitespace-pre-wrap break-words text-sm leading-relaxed">{message.content}</p>
                            <div className={`mt-1 flex items-center gap-1 ${isMine ? "justify-end" : "justify-end"}`}>
                              <p className={`text-[10px] ${isMine ? "text-brand-200" : "text-slate-400"}`}>
                                {formatTime(message.sentAt)}
                              </p>
                              {isMine && message.isRead ? (
                                <CheckCheck className="h-3 w-3 text-brand-200" />
                              ) : null}
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Input area */}
              <div className="border-t border-slate-200 bg-white p-3">
                <div className="flex items-end gap-2">
                  <textarea
                    ref={textareaRef}
                    value={draft}
                    onChange={handleTextareaChange}
                    onKeyDown={(event) => {
                      if (event.key === "Enter" && !event.shiftKey) {
                        event.preventDefault();
                        void handleSend();
                      }
                    }}
                    rows={1}
                    maxLength={2000}
                    placeholder="Nhập tin nhắn... (Enter để gửi, Shift+Enter xuống dòng)"
                    className="min-h-10 flex-1 resize-none rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm outline-none transition-colors focus:border-brand-400 focus:bg-white focus:ring-2 focus:ring-brand-100"
                    style={{ maxHeight: "120px" }}
                  />
                  <Button
                    onClick={handleSend}
                    isLoading={isSending}
                    disabled={!draft.trim()}
                    className="h-10 w-10 shrink-0 rounded-xl !p-0"
                  >
                    <Send className="h-4 w-4" />
                  </Button>
                </div>
                {draft.length > 1800 ? (
                  <p className="mt-1 text-right text-xs text-slate-400">{draft.length}/2000</p>
                ) : null}
              </div>
            </>
          ) : (
            <div className="flex h-full flex-col items-center justify-center gap-3 text-center">
              <div className="flex h-20 w-20 items-center justify-center rounded-full bg-slate-50 shadow-sm">
                <MessageSquare className="h-10 w-10 text-slate-300" />
              </div>
              <div>
                <p className="text-sm font-semibold text-slate-600">Chọn một cuộc trò chuyện</p>
                <p className="mt-1 text-xs text-slate-400">
                  Hoặc mở từ chi tiết booking để bắt đầu chat
                </p>
              </div>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
