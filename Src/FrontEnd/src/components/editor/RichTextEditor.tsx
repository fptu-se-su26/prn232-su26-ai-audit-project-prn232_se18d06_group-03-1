import { useCallback, useEffect, useReducer } from "react";
import { useEditor, EditorContent, type Editor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Underline from "@tiptap/extension-underline";
import Link from "@tiptap/extension-link";
import { Bold, Italic, Underline as UnderlineIcon, List, ListOrdered, Link as LinkIcon, Heading1, Heading2, Heading3 } from "lucide-react";

type Props = {
  content: string;
  onChange: (html: string) => void;
  placeholder?: string;
  showHeadings?: boolean;
};

function ToolbarButton({ onClick, isActive, children }: { onClick: () => void; isActive: boolean; children: React.ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`inline-flex h-8 w-8 items-center justify-center rounded text-sm transition-colors ${
        isActive ? "bg-brand-100 text-brand-700" : "text-slate-500 hover:bg-slate-100"
      }`}
    >
      {children}
    </button>
  );
}

export default function RichTextEditor({ content, onChange, placeholder, showHeadings }: Props) {
  const [, forceRender] = useReducer(x => x + 1, 0);

  const editor = useEditor({
    extensions: [StarterKit.configure({ heading: { levels: showHeadings ? [1, 2, 3] : [] } }), Underline, Link.configure({ openOnClick: false })],
    content,
    onUpdate: ({ editor }) => onChange(editor.getHTML()),
    editorProps: {
      attributes: {
        class: "prose prose-slate max-w-none min-h-[220px] px-3 py-2 text-sm focus:outline-none",
        placeholder: placeholder ?? "",
      },
    },
  });

  useEffect(() => {
    if (!editor) return;
    editor.on("transaction", forceRender);
    return () => void editor.off("transaction", forceRender);
  }, [editor]);

  const setLink = useCallback(() => {
    if (!editor) return;
    const previousUrl = editor.getAttributes("link").href;
    const url = window.prompt("URL:", previousUrl ?? "");
    if (url === null) return;
    if (url === "") {
      editor.chain().focus().extendMarkRange("link").unsetLink().run();
      return;
    }
    editor.chain().focus().extendMarkRange("link").setLink({ href: url }).run();
  }, [editor]);

  if (!editor) return null;

  const run = (fn: (chain: ReturnType<Editor["chain"]>) => ReturnType<Editor["chain"]>) => {
    fn(editor.chain().focus()).run();
  };

  return (
    <div className="overflow-hidden rounded-lg border border-slate-300 bg-white transition-colors focus-within:border-brand-400 focus-within:ring-1 focus-within:ring-brand-400">
      <div className="flex flex-wrap items-center gap-0.5 border-b border-slate-200 bg-slate-50 px-2 py-1.5">
        {showHeadings && (
          <>
            <ToolbarButton onClick={() => run((c) => c.toggleHeading({ level: 1 }))} isActive={editor.isActive("heading", { level: 1 })}>
              <Heading1 className="h-4 w-4" />
            </ToolbarButton>
            <ToolbarButton onClick={() => run((c) => c.toggleHeading({ level: 2 }))} isActive={editor.isActive("heading", { level: 2 })}>
              <Heading2 className="h-4 w-4" />
            </ToolbarButton>
            <ToolbarButton onClick={() => run((c) => c.toggleHeading({ level: 3 }))} isActive={editor.isActive("heading", { level: 3 })}>
              <Heading3 className="h-4 w-4" />
            </ToolbarButton>
            <span className="mx-1 h-5 w-px bg-slate-300" />
          </>
        )}
        <ToolbarButton onClick={() => run((c) => c.toggleBold())} isActive={editor.isActive("bold")}>
          <Bold className="h-4 w-4" />
        </ToolbarButton>
        <ToolbarButton onClick={() => run((c) => c.toggleItalic())} isActive={editor.isActive("italic")}>
          <Italic className="h-4 w-4" />
        </ToolbarButton>
        <ToolbarButton onClick={() => run((c) => c.toggleUnderline())} isActive={editor.isActive("underline")}>
          <UnderlineIcon className="h-4 w-4" />
        </ToolbarButton>
        <span className="mx-1 h-5 w-px bg-slate-300" />
        <ToolbarButton onClick={() => run((c) => c.toggleBulletList())} isActive={editor.isActive("bulletList")}>
          <List className="h-4 w-4" />
        </ToolbarButton>
        <ToolbarButton onClick={() => run((c) => c.toggleOrderedList())} isActive={editor.isActive("orderedList")}>
          <ListOrdered className="h-4 w-4" />
        </ToolbarButton>
        <span className="mx-1 h-5 w-px bg-slate-300" />
        <ToolbarButton onClick={setLink} isActive={editor.isActive("link")}>
          <LinkIcon className="h-4 w-4" />
        </ToolbarButton>

      </div>
      <EditorContent editor={editor} />
    </div>
  );
}
