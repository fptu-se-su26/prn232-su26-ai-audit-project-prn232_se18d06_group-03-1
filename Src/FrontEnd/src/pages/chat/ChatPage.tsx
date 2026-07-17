import { HubConnection, HubConnectionBuilder, HubConnectionState, LogLevel } from "@microsoft/signalr";
import { Car, MessageSquare, Send, UserRound } from "lucide-react";
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
  return new Intl.DateTimeFormat("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
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
      setError(getApiErrorMessage(err, "Khong the tai danh sach chat."));
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
        if (isMounted) setError(getApiErrorMessage(err, "Khong the tai tin nhan."));
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
      setError(getApiErrorMessage(err, "Khong the gui tin nhan."));
    } finally {
      setIsSending(false);
    }
  }

  return (
    <div className="mx-auto flex h-[calc(100vh-7rem)] min-h-[620px] max-w-6xl flex-col gap-4">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.14em] text-brand-700">Chat realtime</p>
          <h1 className="mt-1 text-2xl font-bold text-slate-950">Tin nhan booking</h1>
        </div>
        {selectedRoom?.bookingId ? (
          <Link to={bookingDetailPath}>
            <Button variant="secondary" size="sm">Xem booking</Button>
          </Link>
        ) : null}
      </header>

      {error ? (
        <div className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>
      ) : null}

      <div className="grid min-h-0 flex-1 overflow-hidden rounded-md border border-slate-200 bg-white lg:grid-cols-[320px_1fr]">
        <aside className="min-h-0 border-b border-slate-200 bg-slate-50 lg:border-b-0 lg:border-r">
          <div className="border-b border-slate-200 px-4 py-3">
            <p className="text-sm font-semibold text-slate-900">Cuoc tro chuyen</p>
            <p className="text-xs text-slate-500">{rooms.length} phong chat</p>
          </div>
          <div className="max-h-64 overflow-y-auto p-2 lg:max-h-none lg:h-[calc(100%-57px)]">
            {isLoadingRooms ? (
              <div className="flex h-32 items-center justify-center"><LoadingSpinner /></div>
            ) : rooms.length === 0 ? (
              <div className="rounded-md border border-dashed border-slate-200 bg-white px-4 py-8 text-center text-sm text-slate-500">
                Chua co phong chat.
              </div>
            ) : (
              rooms.map((room) => {
                const participant = room.participants.find((item) => item.userId !== user?.userId);
                const isActive = room.id === selectedRoomId;
                return (
                  <button
                    key={room.id}
                    type="button"
                    onClick={() => setSelectedRoomId(room.id)}
                    className={[
                      "mb-2 w-full rounded-md border px-3 py-3 text-left transition-colors",
                      isActive ? "border-brand-300 bg-white shadow-sm" : "border-transparent bg-transparent hover:bg-white",
                    ].join(" ")}
                  >
                    <div className="flex items-start gap-3">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-brand-100 text-brand-700">
                        <UserRound className="h-5 w-5" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center justify-between gap-2">
                          <p className="truncate text-sm font-semibold text-slate-900">{participant?.fullName ?? "Nguoi dung"}</p>
                          {room.unreadCount > 0 ? (
                            <span className="rounded-full bg-brand-700 px-2 py-0.5 text-xs font-semibold text-white">{room.unreadCount}</span>
                          ) : null}
                        </div>
                        <p className="mt-1 truncate text-xs text-slate-500">Booking {room.bookingCode}</p>
                        <p className="mt-1 truncate text-xs text-slate-600">{room.lastMessage?.text ?? "Chua co tin nhan"}</p>
                      </div>
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </aside>

        <section className="flex min-h-0 flex-col">
          {selectedRoom ? (
            <>
              <div className="flex items-center justify-between gap-3 border-b border-slate-200 px-4 py-3">
                <div className="flex min-w-0 items-center gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-slate-100 text-slate-600">
                    <UserRound className="h-5 w-5" />
                  </div>
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-slate-950">{otherParticipant?.fullName ?? "Nguoi dung"}</p>
                    <p className="truncate text-xs text-slate-500">
                      Booking {selectedRoom.bookingCode}
                      {selectedRoom.vehicleName ? ` - ${selectedRoom.vehicleName}` : ""}
                    </p>
                  </div>
                </div>
                <div className="hidden items-center gap-2 rounded-md bg-slate-50 px-3 py-2 text-xs font-medium text-slate-600 sm:flex">
                  <Car className="h-4 w-4" />
                  Xe #{selectedRoom.vehicleId}
                </div>
              </div>

              <div className="min-h-0 flex-1 space-y-3 overflow-y-auto bg-slate-50 px-4 py-4">
                {isLoadingMessages ? (
                  <div className="flex h-full items-center justify-center"><LoadingSpinner /></div>
                ) : messages.length === 0 ? (
                  <div className="flex h-full items-center justify-center text-center text-sm text-slate-500">
                    <div>
                      <MessageSquare className="mx-auto mb-2 h-8 w-8 text-slate-300" />
                      Chua co tin nhan. Hay bat dau trao doi ve booking nay.
                    </div>
                  </div>
                ) : (
                  messages.map((message) => {
                    const isMine = message.senderId === user?.userId;
                    return (
                      <div key={message.id} className={`flex ${isMine ? "justify-end" : "justify-start"}`}>
                        <div className={`max-w-[78%] rounded-md px-4 py-2 shadow-sm ${isMine ? "bg-brand-700 text-white" : "bg-white text-slate-800"}`}>
                          {!isMine ? <p className="mb-1 text-xs font-semibold text-slate-500">{message.senderName}</p> : null}
                          <p className="whitespace-pre-wrap break-words text-sm">{message.content}</p>
                          <p className={`mt-1 text-right text-[11px] ${isMine ? "text-brand-100" : "text-slate-400"}`}>{formatTime(message.sentAt)}</p>
                        </div>
                      </div>
                    );
                  })
                )}
                <div ref={messagesEndRef} />
              </div>

              <div className="border-t border-slate-200 bg-white p-3">
                <div className="flex gap-2">
                  <textarea
                    value={draft}
                    onChange={(event) => setDraft(event.target.value)}
                    onKeyDown={(event) => {
                      if (event.key === "Enter" && !event.shiftKey) {
                        event.preventDefault();
                        void handleSend();
                      }
                    }}
                    rows={1}
                    maxLength={2000}
                    placeholder="Nhap tin nhan..."
                    className="min-h-10 flex-1 resize-none rounded-md border border-slate-300 px-3 py-2 text-sm outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500"
                  />
                  <Button onClick={handleSend} isLoading={isSending} disabled={!draft.trim()}>
                    <Send className="h-4 w-4" /> Gui
                  </Button>
                </div>
              </div>
            </>
          ) : (
            <div className="flex h-full items-center justify-center text-center text-sm text-slate-500">
              <div>
                <MessageSquare className="mx-auto mb-2 h-10 w-10 text-slate-300" />
                Chon mot phong chat hoac mo tu chi tiet booking.
              </div>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
