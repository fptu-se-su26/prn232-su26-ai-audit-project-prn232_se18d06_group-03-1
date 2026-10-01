import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type CSSProperties,
  type PointerEvent as ReactPointerEvent,
} from "react";

const DEFAULTS = {
  durationMs: 600,
  ease: "easeInOut" as EaseName,
  imageFit: "cover" as "cover" | "contain",
  cursorSize: 60,
  arrowType: "default" as "default" | "image",
  cursorColor: "#000000",
  cursorBg: true,
  cursorBackground: "#FFFFFF",
  borderRadius: 0,
  dots: true,
  dotSize: 8,
  dotX: 0,
  dotY: 150,
  dotActive: "#FFFFFF",
  dotInactive: "rgba(255,255,255,0.4)",
};

type EaseName = "linear" | "easeIn" | "easeOut" | "easeInOut";
type Side = "left" | "right" | "none";

function easeToCss(ease: EaseName | number[] | undefined): string {
  if (Array.isArray(ease) && ease.length === 4) return `cubic-bezier(${ease.join(",")})`;
  switch (ease) {
    case "linear":
      return "linear";
    case "easeIn":
      return "cubic-bezier(0.42, 0, 1, 1)";
    case "easeOut":
      return "cubic-bezier(0, 0, 0.58, 1)";
    case "easeInOut":
    default:
      return "cubic-bezier(0.42, 0, 0.58, 1)";
  }
}

function resolveImageSrc(image: unknown): string | undefined {
  if (!image) return undefined;
  if (typeof image === "string") return image.trim() || undefined;
  if (typeof image === "object") {
    const obj = image as { src?: unknown; srcSet?: unknown };
    if (typeof obj.src === "string" && obj.src.trim()) return obj.src;
    if (typeof obj.srcSet === "string" && obj.srcSet.trim()) return obj.srcSet;
  }
  return undefined;
}

type SlideState = {
  from: number;
  to: number;
  dir: 1 | -1;
  run: boolean;
};

interface DotOptions {
  size?: number;
  active?: string;
  inactive?: string;
  x?: number;
  y?: number;
}

interface TransitionOptions {
  type?: string;
  stiffness?: number;
  damping?: number;
  mass?: number;
  duration?: number;
  ease?: EaseName | number[];
}

interface CursorNavProps {
  images?: unknown[];
  imageFit?: "cover" | "contain";
  transition?: TransitionOptions;
  cursorSize?: number;
  arrowType?: "default" | "image";
  arrowImage?: unknown;
  arrowImageLeft?: unknown;
  cursorColor?: string;
  cursorBg?: boolean;
  cursorBackground?: string;
  borderRadius?: number;
  dots?: boolean;
  dotOptions?: DotOptions;
  style?: CSSProperties;
  /** Lặp vô hạn: hết slide cuối tự quay về đầu (mặc định false như bản gốc). */
  loop?: boolean;
  /** Tự động trượt (mặc định false như bản gốc). */
  autoplay?: boolean;
  autoplayIntervalMs?: number;
  autoplayPaused?: boolean;
  onIndexChange?: (index: number) => void;
}

export default function CursorNav(props: CursorNavProps) {
  const {
    images = [],
    imageFit = DEFAULTS.imageFit,
    transition = {
      type: "tween",
      stiffness: 800,
      damping: 60,
      mass: 1,
      duration: 0.6,
      ease: "easeInOut",
    },
    cursorSize = DEFAULTS.cursorSize,
    arrowType = DEFAULTS.arrowType,
    arrowImage = { src: "", alt: "" },
    arrowImageLeft = { src: "", alt: "" },
    cursorColor = DEFAULTS.cursorColor,
    cursorBg = DEFAULTS.cursorBg,
    cursorBackground = DEFAULTS.cursorBackground,
    borderRadius = DEFAULTS.borderRadius,
    dots = DEFAULTS.dots,
    dotOptions = {
      size: DEFAULTS.dotSize,
      active: DEFAULTS.dotActive,
      inactive: DEFAULTS.dotInactive,
      x: DEFAULTS.dotX,
      y: DEFAULTS.dotY,
    },
    style,
    loop = false,
    autoplay = false,
    autoplayIntervalMs = 5000,
    autoplayPaused = false,
    onIndexChange,
  } = props;

  const dotSize = dotOptions?.size ?? DEFAULTS.dotSize;
  const dotX = dotOptions?.x ?? DEFAULTS.dotX;
  const dotY = dotOptions?.y ?? DEFAULTS.dotY;
  const dotActive = dotOptions?.active ?? DEFAULTS.dotActive;
  const dotInactive = dotOptions?.inactive ?? DEFAULTS.dotInactive;

  const arrowSrcRight = resolveImageSrc(arrowImage);
  const arrowSrcLeft = resolveImageSrc(arrowImageLeft);
  const useArrowImage = arrowType === "image" && !!(arrowSrcRight || arrowSrcLeft);

  const durationMs =
    typeof transition?.duration === "number" ? transition.duration * 1000 : DEFAULTS.durationMs;
  const ease = easeToCss(transition?.ease ?? DEFAULTS.ease);

  const sources = images.map(resolveImageSrc).filter(Boolean) as string[];
  const count = sources.length;

  const containerRef = useRef<HTMLDivElement>(null);
  const [index, setIndex] = useState(0);
  const [slide, setSlide] = useState<SlideState | null>(null);
  const slidingRef = useRef(false);
  const pointerRef = useRef<{ relX: number; width: number } | null>(null);

  const [cursorSide, setCursorSide] = useState<Side>("none");
  const [cursorPos, setCursorPos] = useState({ x: 0, y: 0 });

  useEffect(() => {
    if (index > count - 1) setIndex(Math.max(0, count - 1));
  }, [count, index]);

  useEffect(() => {
    onIndexChange?.(index);
  }, [index, onIndexChange]);

  const sideFor = useCallback(
    (relX: number, width: number, atIndex: number): Side => {
      if (width <= 0 || count <= 1) return "none";
      const wantPrev = relX < width / 2;
      if (loop) return wantPrev ? "left" : "right";
      if (wantPrev) return atIndex > 0 ? "left" : "none";
      return atIndex < count - 1 ? "right" : "none";
    },
    [count, loop],
  );

  const startSlide = useCallback(
    (dir: 1 | -1) => {
      if (slidingRef.current || count <= 1) return;
      let to = index + dir;
      if (to < 0 || to >= count) {
        if (!loop) return;
        to = (to + count) % count;
      }
      slidingRef.current = true;
      setSlide({ from: index, to, dir, run: false });
    },
    [index, count, loop],
  );

  // Autoplay loop vô hạn cho banner khuyến mãi (pause khi hover/focus).
  useEffect(() => {
    if (!autoplay || autoplayPaused || count <= 1 || slide) return;
    const timer = window.setInterval(() => {
      startSlide(1);
    }, autoplayIntervalMs);
    return () => window.clearInterval(timer);
  }, [autoplay, autoplayPaused, count, slide, autoplayIntervalMs, startSlide]);

  useEffect(() => {
    if (!slide) return;
    if (!slide.run) {
      let raf2 = 0;
      const raf1 = requestAnimationFrame(() => {
        raf2 = requestAnimationFrame(() => setSlide((s) => (s ? { ...s, run: true } : s)));
      });
      return () => {
        cancelAnimationFrame(raf1);
        cancelAnimationFrame(raf2);
      };
    }
    const t = setTimeout(() => {
      const committed = slide.to;
      setIndex(committed);
      setSlide(null);
      slidingRef.current = false;
      const p = pointerRef.current;
      if (p) setCursorSide(sideFor(p.relX, p.width, committed));
    }, durationMs + 40);
    return () => clearTimeout(t);
  }, [slide, durationMs, sideFor]);

  const handlePointerMove = useCallback(
    (e: ReactPointerEvent<HTMLDivElement>) => {
      const el = containerRef.current;
      if (!el) return;
      const rect = el.getBoundingClientRect();
      const relX = e.clientX - rect.left;
      const relY = e.clientY - rect.top;
      pointerRef.current = { relX, width: rect.width };
      setCursorPos({ x: relX, y: relY });
      setCursorSide(sideFor(relX, rect.width, index));
    },
    [sideFor, index],
  );

  const handlePointerLeave = useCallback(() => {
    pointerRef.current = null;
    setCursorSide("none");
  }, []);

  const handleClick = useCallback(
    (e: ReactPointerEvent<HTMLDivElement>) => {
      // Bỏ qua click từ CTA overlay (nút "Săn mã ngay") để không trượt slide nhầm.
      if ((e.target as HTMLElement).closest("[data-cursor-cta]")) return;
      const el = containerRef.current;
      if (!el || slidingRef.current) return;
      const rect = el.getBoundingClientRect();
      const relX = e.clientX - rect.left;
      const side = sideFor(relX, rect.width, index);
      if (side === "left") startSlide(-1);
      else if (side === "right") startSlide(1);
    },
    [sideFor, index, startSlide],
  );

  const activeIndex = slide?.run ? slide.to : slide ? slide.from : index;

  const layerTransform = (role: "from" | "to"): string => {
    if (!slide) return "translateX(0%)";
    const { dir, run } = slide;
    if (role === "to") {
      const start = dir === 1 ? "100%" : "-100%";
      return run ? "translateX(0%)" : `translateX(${start})`;
    }
    const end = dir === 1 ? "-100%" : "100%";
    return run ? `translateX(${end})` : "translateX(0%)";
  };

  const layerTransition = (run: boolean) => (run ? `transform ${durationMs}ms ${ease}` : "none");

  const imageLayer = (src: string, transform: string, transitionCss: string, key: string) => (
    <div
      key={key}
      style={{
        position: "absolute",
        inset: 0,
        transform,
        transition: transitionCss,
        willChange: "transform",
        backgroundImage: `url("${src}")`,
        backgroundSize: imageFit === "contain" ? "contain" : "cover",
        backgroundPosition: "center",
        backgroundRepeat: "no-repeat",
      }}
    />
  );

  if (count === 0) {
    return (
      <div
        style={{
          position: "relative",
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "rgba(136,85,255,0.1)",
          color: "rgb(153,102,255)",
          fontFamily: "Inter, sans-serif",
          fontSize: 12,
          fontWeight: 600,
          textAlign: "center",
          padding: 16,
          borderRadius: `${borderRadius}px`,
          boxSizing: "border-box",
          ...style,
        }}
      >
        Add images to enable cursor navigation
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      onPointerMove={handlePointerMove}
      onPointerLeave={handlePointerLeave}
      onClick={handleClick}
      style={{
        ...style,
        position: "relative",
        width: "100%",
        height: "100%",
        overflow: "hidden",
        borderRadius: `${borderRadius}px`,
        cursor: cursorSide === "none" ? "default" : "none",
        userSelect: "none",
        touchAction: "manipulation",
      }}
    >
      <div
        style={{
          position: "absolute",
          inset: 0,
          overflow: "hidden",
          borderRadius: `${borderRadius}px`,
        }}
      >
        {slide ? (
          <>
            {imageLayer(sources[slide.from], layerTransform("from"), layerTransition(slide.run), "from")}
            {imageLayer(sources[slide.to], layerTransform("to"), layerTransition(slide.run), "to")}
          </>
        ) : (
          imageLayer(sources[index], "translateX(0%)", "none", "single")
        )}
      </div>

      {cursorSide !== "none" && (
        <div
          style={{
            position: "absolute",
            left: cursorPos.x,
            top: cursorPos.y,
            width: cursorSize,
            height: cursorSize,
            transform: "translate(-50%, -50%)",
            borderRadius: "50%",
            background: !useArrowImage && cursorBg ? cursorBackground : "transparent",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            pointerEvents: "none",
            backdropFilter: !useArrowImage && cursorBg ? "blur(2px)" : "none",
            WebkitBackdropFilter: !useArrowImage && cursorBg ? "blur(2px)" : "none",
          }}
        >
          {useArrowImage ? (
            <img
              src={cursorSide === "left" ? (arrowSrcLeft ?? arrowSrcRight) : (arrowSrcRight ?? arrowSrcLeft)}
              alt=""
              draggable={false}
              style={{
                width: cursorSize,
                height: cursorSize,
                objectFit: "contain",
                transform:
                  cursorSide === "left"
                    ? arrowSrcLeft
                      ? "none"
                      : "scaleX(-1)"
                    : arrowSrcRight
                      ? "none"
                      : "scaleX(-1)",
                pointerEvents: "none",
              }}
            />
          ) : (
            <svg
              width={cursorSize * 0.42}
              height={cursorSize * 0.42}
              viewBox="0 0 24 24"
              fill="none"
              stroke={cursorColor}
              strokeWidth={2.5}
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <polyline points={cursorSide === "right" ? "9 6 15 12 9 18" : "15 6 9 12 15 18"} />
            </svg>
          )}
        </div>
      )}

      {dots && count > 1 && (
        <div
          style={{
            position: "absolute",
            left: "50%",
            top: "50%",
            transform: `translate(calc(-50% + ${dotX}px), calc(-50% + ${dotY}px))`,
            display: "flex",
            gap: 8,
            pointerEvents: "none",
          }}
        >
          {sources.map((_, i) => (
            <span
              key={i}
              style={{
                width: dotSize,
                height: dotSize,
                borderRadius: "50%",
                background: i === activeIndex ? dotActive : dotInactive,
                transition: `background ${durationMs}ms ${ease}`,
              }}
            />
          ))}
        </div>
      )}
    </div>
  );
}
