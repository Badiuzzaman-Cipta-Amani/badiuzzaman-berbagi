/**
 * Touch-first surface: every control the thumb lands on defaults to `xl`, which
 * clears the 44px target. Set here once so no component has to restate it.
 */
const TOUCH = { defaultVariants: { size: "xl" as const } }

export default defineAppConfig({
  ui: {
    colors: {
      primary: "primary",
      neutral: "slate",
      // Stable meanings across the app: red is only ever "running out of time"
      // or destructive, emerald only ever "verified / target met".
      success: "emerald",
      warning: "amber",
      error: "red",
      info: "sky",
    },

    button: TOUCH,
    input: TOUCH,
    inputMenu: TOUCH,
    inputNumber: TOUCH,
    inputTags: TOUCH,
    select: TOUCH,
    selectMenu: TOUCH,
    textarea: TOUCH,
    checkbox: TOUCH,
    radioGroup: TOUCH,
    formField: TOUCH,
    tabs: TOUCH,

    /**
     * The dismiss button is absolutely positioned over the header, and the
     * header reserves no room for it — so a two-line title/description runs
     * underneath the button. `pe-16` clears the `end-4` inset plus the 44px
     * touch target every control in this app defaults to.
     */
    modal: {
      slots: { header: "pe-16" },
    },
    slideover: {
      slots: { header: "pe-16" },
    },

    badge: {
      defaultVariants: { size: "md" as const },
    },

    progress: {
      defaultVariants: { size: "lg" as const },
    },

    /**
     * Data tables read at arm's length on a desktop, so the body text sits on
     * `text-base` rather than the `text-sm` Nuxt UI ships — the same "one notch
     * up" move `main.css` makes to the ramp itself.
     *
     * The head is tinted with the brand navy instead of the default black-on-
     * white: on a screen that is mostly table, an untinted head reads as another
     * row rather than as the thing that names the columns.
     */
    table: {
      slots: {
        th: "bg-primary-50 text-primary-800 text-sm font-bold tracking-wide py-3.5 first:rounded-s-lg last:rounded-e-lg",
        td: "text-base py-4",
        separator: "bg-primary-100",
      },
    },

    /**
     * Cards carry most of the back office. The extra step of padding is what
     * keeps a stat, a filter bar, and a table from touching their own borders.
     */
    card: {
      slots: {
        header: "p-5 sm:p-6",
        body: "p-5 sm:p-6",
        footer: "p-5 sm:p-6",
      },
    },
  },
})
