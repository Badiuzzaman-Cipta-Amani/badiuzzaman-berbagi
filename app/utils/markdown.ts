import DOMPurify from "dompurify"
import { marked } from "marked"

/**
 * Campaign copy is authored in the admin editor and stored as Markdown, so the
 * public page has to render it rather than print it.
 *
 * The output is sanitized even though only signed-in admins can write it: the
 * editor round-trips pasted content, and a stored-XSS hole that needs an admin
 * account to open is still a hole. The allow-list is deliberately the set of
 * tags the editor's toolbar can actually produce — anything else is a paste
 * artefact and is dropped.
 */

marked.use({
  gfm: true,
  // Authors type single newlines expecting a line break, not a joined paragraph.
  breaks: true,
})

const ALLOWED_TAGS = [
  "p",
  "br",
  "strong",
  "em",
  "s",
  "code",
  "pre",
  "blockquote",
  "ul",
  "ol",
  "li",
  "h1",
  "h2",
  "h3",
  "h4",
  "hr",
  "a",
  "img",
]

export function renderMarkdown(source: string | null | undefined): string {
  if (!source) return ""

  const html = marked.parse(source, { async: false }) as string

  return DOMPurify.sanitize(html, {
    ALLOWED_TAGS,
    ALLOWED_ATTR: ["href", "title", "target", "rel", "src", "alt"],
    // `javascript:` and friends never survive; only web and mail links do.
    ALLOWED_URI_REGEXP: /^(?:https?:|mailto:|tel:|\/)/i,
  })
}

/**
 * A one-line preview for cards and table rows, where a rendered heading or list
 * would be noise. Strips the syntax rather than rendering it.
 */
export function stripMarkdown(source: string | null | undefined): string {
  if (!source) return ""

  return source
    .replace(/```[\s\S]*?```/g, " ")
    .replace(/!\[[^\]]*\]\([^)]*\)/g, " ")
    .replace(/\[([^\]]*)\]\([^)]*\)/g, "$1")
    .replace(/^\s{0,3}#{1,6}\s+/gm, "")
    .replace(/^\s{0,3}>\s?/gm, "")
    .replace(/^\s*[-*+]\s+/gm, "")
    .replace(/^\s*\d+\.\s+/gm, "")
    .replace(/[*_~`]/g, "")
    .replace(/\s+/g, " ")
    .trim()
}
