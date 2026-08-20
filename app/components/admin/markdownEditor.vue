<script setup lang="ts">
import type { EditorToolbarItem } from "@nuxt/ui"

/**
 * The rich-text field for admin-authored copy. `content-type="markdown"` means
 * the value bound here *is* Markdown — what goes in the database is the same
 * text an editor could read, not serialized HTML or a ProseMirror JSON blob.
 * `BaseMarkdown` renders it back on the public site.
 *
 * Mentions and images are off: there is nobody to mention, and there is no
 * upload pipeline yet, so an image button would only offer a broken URL prompt.
 */
const model = defineModel<string>({ default: "" })

defineProps<{ placeholder?: string }>()

const items: EditorToolbarItem[][] = [
  [
    {
      kind: "heading",
      level: 2,
      icon: "i-material-symbols-format-h2",
      tooltip: { text: "Judul bagian" },
    },
    {
      kind: "heading",
      level: 3,
      icon: "i-material-symbols-format-h3",
      tooltip: { text: "Sub-judul" },
    },
  ],
  [
    {
      kind: "mark",
      mark: "bold",
      icon: "i-material-symbols-format-bold",
      tooltip: { text: "Tebal" },
    },
    {
      kind: "mark",
      mark: "italic",
      icon: "i-material-symbols-format-italic",
      tooltip: { text: "Miring" },
    },
    {
      kind: "mark",
      mark: "strike",
      icon: "i-material-symbols-format-strikethrough",
      tooltip: { text: "Coret" },
    },
  ],
  [
    {
      kind: "bulletList",
      icon: "i-material-symbols-format-list-bulleted",
      tooltip: { text: "Daftar poin" },
    },
    {
      kind: "orderedList",
      icon: "i-material-symbols-format-list-numbered",
      tooltip: { text: "Daftar bernomor" },
    },
    {
      kind: "blockquote",
      icon: "i-material-symbols-format-quote",
      tooltip: { text: "Kutipan" },
    },
  ],
  [
    {
      kind: "link",
      icon: "i-material-symbols-link-rounded",
      tooltip: { text: "Tautan" },
    },
    {
      kind: "clearFormatting",
      icon: "i-material-symbols-format-clear-rounded",
      tooltip: { text: "Hapus format" },
    },
  ],
  [
    {
      kind: "undo",
      icon: "i-material-symbols-undo-rounded",
      tooltip: { text: "Batalkan" },
    },
    {
      kind: "redo",
      icon: "i-material-symbols-redo-rounded",
      tooltip: { text: "Ulangi" },
    },
  ],
]
</script>

<template>
  <UEditor
    v-slot="{ editor }"
    v-model="model"
    content-type="markdown"
    :placeholder="placeholder"
    :image="false"
    :mention="false"
    class="overflow-hidden rounded-lg ring ring-accented focus-within:ring-2 focus-within:ring-primary"
    :ui="{ content: 'max-h-80 overflow-y-auto p-3', base: 'min-h-40 focus:outline-none' }"
  >
    <UEditorToolbar
      :editor="editor"
      :items="items"
      class="border-b border-default bg-elevated/50 px-1.5 py-1"
    />
  </UEditor>
</template>
