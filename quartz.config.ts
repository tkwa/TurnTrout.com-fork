import { QuartzConfig } from "./quartz/cfg"
import * as Plugin from "./quartz/plugins"

const latteColors = {
  rosewater: "#dc8a78",
  flamingo: "#dd7878",
  pink: "#ea76cb",
  mauve: "#8839ef",
  red: "#d20f39",
  maroon: "#e64553",
  peach: "#fe640b",
  yellow: "#df8e1d",
  green: "#40a02b",
  teal: "#179299",
  sky: "#04a5e5",
  sapphire: "#209fb5",
  blue: "#1e66f5",
  lavender: "#7287fd",
  text: "#4c4f69",
  "subtext-1": "#5c5f77",
  "subtext-0": "#6c6f85",
  "overlay-2": "#7c7f93",
  "overlay-1": "#8c8fa1",
  "overlay-0": "#9ca0b0",
  "surface-2": "#acb0be",
  "surface-1": "#bcc0cc",
  "surface-0": "#ccd0da",
  base: "#eff1f5",
  mantle: "#e6e9ef",
  crust: "#dce0e8",
}

const frappeColors = {
  rosewater: "#f2d5cf",
  pink: "#f4b8e4",
  mauve: "#ca9ee6",
  red: "#e78284",
  maroon: "#ea999c",
  peach: "#ef9f76",
  yellow: "#e5c890",
  green: "#a6d189",
  teal: "#81c8be",
  sky: "#99d1db",
  sapphire: "#85c1dc",
  blue: "#8caaee",
  lavender: "#babbf1",
  text: "#c6d0f5",
  "subtext-1": "#b5bfe2",
  "subtext-0": "#a5adce",
  "overlay-2": "#949cbb",
  "overlay-1": "#838ba7",
  "overlay-0": "#737994",
  "surface-2": "#626880",
  "surface-1": "#51576d",
  "surface-0": "#414559",
  base: "#303446",
  mantle: "#292c3c",
  crust: "#232634",
}

/**
 * Quartz 4.0 Configuration
 *
 * See https://quartz.jzhao.xyz/configuration for more information.
 */
const config: QuartzConfig = {
  configuration: {
    pageTitle: "The Pond",
    enableSPA: true,
    enablePopovers: true,
    analytics: {
      provider: "null", // No analytics
    },
    locale: "en-US",
    baseUrl: "turntrout.com",
    ignorePatterns: ["private", "templates", ".obsidian"],
    defaultDateType: "published", // What to display on listings
    theme: {
      cdnCaching: true,
      typography: {},
      colors: {
        darkMode: {
          light: frappeColors["base"],
          lightgray: frappeColors["overlay-0"],
          gray: frappeColors["overlay-2"],
          darkgray: frappeColors["text"],
          dark: frappeColors["subtext-1"],
          secondary: frappeColors["blue"],
          tertiary: frappeColors["sky"],
          highlight: "#949cbb30", // frappeColors["overlay-2"] at 20% opacity
        },
        lightMode: {
          light: latteColors["base"],
          lightgray: latteColors["overlay-0"],
          gray: latteColors["overlay-2"],
          darkgray: latteColors["text"],
          dark: latteColors["subtext-1"],
          secondary: latteColors["blue"],
          tertiary: latteColors["sky"],
          highlight: "#7c7f9324", // latteColors["overlay-2"] at 20% opacity
        },
      },
    },
  },
  plugins: {
    transformers: [
      Plugin.FrontMatter(),
      Plugin.CreatedModifiedDate({
        priority: ["frontmatter", "filesystem"],
      }),
      Plugin.Latex({ renderEngine: "katex" }),
      Plugin.SyntaxHighlighting({
        theme: {
          light: "github-light",
          dark: "github-dark",
        },
        keepBackground: false,
      }),
      Plugin.ObsidianFlavoredMarkdown({ enableInHtmlEmbed: true }),
      Plugin.GitHubFlavoredMarkdown(),
      Plugin.TableOfContents(),
      Plugin.CrawlLinks({ markdownLinkResolution: "shortest" }),
      Plugin.Description(),
      Plugin.TagAcronyms(),
      Plugin.LinkTextPunctuation(),
      Plugin.AddFavicons(),
      Plugin.TroutOrnamentHr(),
      Plugin.RemarkMinusReplace(),
      // Plugin.TagEmojiPlugin(),
    ],
    filters: [Plugin.ExplicitPublish()],
    emitters: [
      Plugin.AliasRedirects(),
      Plugin.ComponentResources(),
      Plugin.ContentPage(),
      Plugin.FolderPage(),

      // emits dedicated pages for each tag used in the content
      Plugin.TagPage(),
      Plugin.ContentIndex({
        enableSiteMap: true,
        enableRSS: true,
      }),
      Plugin.Assets(),
      Plugin.Static(),
      Plugin.NotFoundPage(),
    ],
  },
}

export default config
