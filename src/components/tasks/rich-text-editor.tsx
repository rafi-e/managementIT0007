"use client";

import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Placeholder from "@tiptap/extension-placeholder";
import { Bold, Italic, List, ListOrdered } from "lucide-react";
import { cn } from "@/lib/utils";
import { Toggle } from "@/components/ui/toggle";

interface RichTextEditorProps {
  content: string;
  onChange: (html: string) => void;
  placeholder?: string;
}

export function RichTextEditor({ content, onChange, placeholder }: RichTextEditorProps) {
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: false,
      }),
      Placeholder.configure({
        placeholder: placeholder || "Add a description...",
      }),
    ],
    content: content || "",
    onUpdate: ({ editor }) => {
      const html = editor.getHTML();
      onChange(html === "<p></p>" ? "" : html);
    },
    editorProps: {
      attributes: {
        class:
          "tiptap min-h-[120px] w-full px-3 py-2 text-sm focus-visible:outline-none prose prose-sm max-w-none dark:prose-invert",
      },
    },
    immediatelyRender: false,
  });

  if (!editor) {
    return (
      <div className="min-h-[120px] w-full rounded-lg border border-input bg-transparent px-3 py-2 text-sm" />
    );
  }

  const toggleButton = (
    isActive: boolean,
    onClick: () => void,
    icon: React.ReactNode,
    label: string
  ) => (
    <Toggle
      size="sm"
      pressed={isActive}
      onPressedChange={onClick}
      aria-label={label}
      className="h-8 w-8 data-[state=on]:bg-accent data-[state=on]:text-accent-foreground"
    >
      {icon}
    </Toggle>
  );

  return (
    <div className="min-h-[120px] w-full rounded-lg border border-input bg-transparent shadow-sm focus-within:ring-1 focus-within:ring-ring overflow-hidden">
      {editor && (
        <div className="flex items-center gap-0.5 border-b border-input px-2 py-1.5">
          {toggleButton(
            editor.isActive("bold"),
            () => editor.chain().focus().toggleBold().run(),
            <Bold className="h-4 w-4" />,
            "Bold"
          )}
          {toggleButton(
            editor.isActive("italic"),
            () => editor.chain().focus().toggleItalic().run(),
            <Italic className="h-4 w-4" />,
            "Italic"
          )}
          <span className="w-px h-5 bg-border mx-1" />
          {toggleButton(
            editor.isActive("bulletList"),
            () => editor.chain().focus().toggleBulletList().run(),
            <List className="h-4 w-4" />,
            "Bullet List"
          )}
          {toggleButton(
            editor.isActive("orderedList"),
            () => editor.chain().focus().toggleOrderedList().run(),
            <ListOrdered className="h-4 w-4" />,
            "Ordered List"
          )}
        </div>
      )}
      <EditorContent editor={editor} />
    </div>
  );
}
