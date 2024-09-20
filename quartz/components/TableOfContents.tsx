/**
 * This file implements the TableOfContents component for Quartz.
 * It renders a table of contents based on the headings in the current page,
 * supporting small caps and LaTeX rendering.
 */

import { QuartzComponent, QuartzComponentConstructor, QuartzComponentProps } from "./types"
import { createLogger } from "../plugins/transformers/logger_utils"
import modernStyle from "./styles/toc.scss"
import { RootContent, Parent, Text, Element } from "hast"
import { replaceSCInNode } from "../plugins/transformers/tagacronyms"
import { TocEntry } from "../plugins/transformers/toc"
// @ts-expect-error
import script from "./scripts/toc.inline"
import katex from "katex"
import { fromHtml } from "hast-util-from-html"

/**
 * Processes small caps in the given text and adds it to the parent node.
 * @param text - The text to process.
 * @param parent - The parent node to add the processed text to.
 */
function processSmallCaps(text: string, parent: Parent): void {
  const textNode = { type: "text", value: text } as Text
  parent.children.push(textNode)
  replaceSCInNode(textNode, 0, parent)
}

/**
 * Processes LaTeX content and adds it to the parent node as a KaTeX-rendered span.
 * @param latex - The LaTeX content to process.
 * @param parent - The parent node to add the processed LaTeX to.
 */
function processKatex(latex: string, parent: Parent): void {
  const html = katex.renderToString(latex, { throwOnError: false })
  const katexNode = {
    type: "element",
    tagName: "span",
    properties: { className: ["katex-toc"] },
    children: [{ type: "raw", value: html }],
  } as Element
  parent.children.push(katexNode)
}

const logger = createLogger("TableOfContents")
/**
 * TableOfContents component for rendering a table of contents.
 *
 * @param props - The component props.
 * @param props.fileData - Data for the current file.
 * @returns The rendered table of contents or null if disabled.
 */
const TableOfContents: QuartzComponent = ({ fileData }: QuartzComponentProps) => {
  logger.info(`Rendering TableOfContents for file: ${fileData.filePath}`)

  if (!fileData.toc || fileData.frontmatter?.toc === "false") {
    logger.info(
      `TableOfContents skipped for ${fileData.filePath}: no TOC data or disabled in frontmatter`,
    )
    return null
  }

  const title = fileData.frontmatter?.title
  logger.debug(`Title for TOC: ${title}`)

  const toc = buildNestedList(fileData.toc!, 0, 0)

  return (
    <div id="table-of-contents" className="desktop-only">
      <h6 className="toc-title">
        <a href="#">{title}</a>
      </h6>
      <div id="toc-content">
        <ul className="overflow ">{toc}</ul>
      </div>
    </div>
  )
}


/**
 * Recursively builds a nested list for the table of contents.
 *
 * @param entries - The TOC entries to process.
 * @param currentIndex - The current index in the entries array.
 * @param currentDepth - The current depth in the TOC hierarchy.
 * @returns A tuple containing an array of JSX elements and the next index to process.
 */
export function buildNestedList(
  entries: TocEntry[],
  currentIndex: number = 0,
  currentDepth: number = entries[0]?.depth || 0
): [JSX.Element[], number] {
  const listItems: JSX.Element[] = [];
  const totalEntries = entries.length;
  let index = currentIndex;

  while (index < totalEntries) {
    const entry = entries[index];

    if (entry.depth < currentDepth) {
      break;
    } else if (entry.depth > currentDepth) {
      const [nestedListItems, nextIndex] = buildNestedList(entries, index, entry.depth);
      if (listItems.length > 0) {
        const lastItem = listItems[listItems.length - 1];
        listItems[listItems.length - 1] = 
          <li key={`li-${index}`}>
            {lastItem.props.children}
            <ul key={`ul-${index}`}>{nestedListItems}</ul>
          </li>
      } else {
        listItems.push(
          <li key={`li-${index}`}>
            <ul key={`ul-${index}`}>{nestedListItems}</ul>
          </li>
        );
      }
      index = nextIndex;
    } else {
      listItems.push(<li key={`li-${index}`}>{toJSXListItem(entry)}</li>);
      index++;
    }
  }

  return [listItems, index];
}

/**
 * Generates the table of contents as a nested list.
 *
 * @param entries - The TOC entries to process.
 * @returns A JSX element representing the nested TOC.
 */
export function addListItem(entries: TocEntry[]): JSX.Element {
  logger.debug(`addListItem called with ${entries.length} entries`);

  const [listItems] = buildNestedList(entries);
  logger.debug(`Returning ${listItems.length} JSX elements`);
  return <ul>{listItems}</ul>;
}


/**
 * Converts a TocEntry to a JSX list item element.
 */
function toJSXListItem(entry: TocEntry): JSX.Element {
  const entryParent: Parent = processTocEntry(entry);
  return (
    <a href={`#${entry.slug}`} data-for={entry.slug}>
      {entryParent.children.map(elementToJsx)}
    </a>
  );
}


/**
 * Processes small caps and LaTeX in a TOC entry.
 *
 * @param entry - The TOC entry to process.
 * @returns A Parent object representing the processed entry.
 */
function processTocEntry(entry: TocEntry): Parent {
  logger.debug(`Processing TOC entry: ${entry.text}`)
  const parent = { type: "element", tagName: "span", properties: {}, children: [] } as Parent

  // Split the text by LaTeX delimiters
  const parts = entry.text.split(/(\$[^$]+\$)/g)

  parts.forEach((part) => {
    if (part.startsWith("$") && part.endsWith("$")) {
      // LaTeX expression
      const latex = part.slice(1, -1)
      processKatex(latex, parent)
    } else {
      // Parse as HTML and process
      const htmlAst = fromHtml(part, { fragment: true })
      processHtmlAst(htmlAst, parent)
    }
  })

  return parent
}

/**
 * Processes the HTML AST, handling text nodes and elements recursively.
 *
 * @param htmlAst - The HTML AST to process.
 * @param parent - The parent node to add processed nodes to.
 */
function processHtmlAst(htmlAst: any, parent: Parent): void {
  htmlAst.children.forEach((node: any) => {
    if (node.type === "text") {
      processSmallCaps(node.value, parent)
    } else if (node.type === "element") {
      const newElement = {
        type: "element",
        tagName: node.tagName,
        properties: { ...node.properties },
        children: [],
      } as Element
      parent.children.push(newElement)
      processHtmlAst(node, newElement)
    }
  })
}

/**
 * Converts a HAST element to a JSX element.
 *
 * @param elt - The HAST element to convert.
 * @returns The converted JSX element.
 */
function elementToJsx(elt: RootContent): JSX.Element {
  logger.debug(`Converting element to JSX: ${JSON.stringify(elt)}`)

  switch (elt.type) {
    case "text":
      return <>{elt.value}</>
    case "element":
      if (elt.tagName === "abbr") {
        const abbrText = (elt.children[0] as Text).value
        const className = (elt.properties?.className as string[])?.join(" ") || ""
        return <abbr className={className}>{abbrText}</abbr>
      } else if (elt.tagName === "span") {
        if ((elt.properties?.className as string[])?.includes("katex-toc")) {
          return (
            <span
              className="katex-toc"
              dangerouslySetInnerHTML={{ __html: (elt.children[0] as { value: string }).value }}
            />
          )
        } else {
          // Handle other span elements (e.g., those created by processSmallCaps)
          return <span>{elt.children.map(elementToJsx)}</span>
        }
      }
      // Add more cases here as needed for other element types you expect
      break

    case "comment":
    case "doctype":
      // These types are typically ignored in JSX rendering
      return <></>

    default:
      // Gracefully handle unexpected node types
      logger.warn(`Unexpected node type encountered: ${elt.type}`)
      return <></>
  }

  // This should never be reached due to the switch cases, but TypeScript requires it
  return <></>
}

TableOfContents.css = modernStyle
TableOfContents.afterDOMLoaded = script

export default ((_opts?: any): QuartzComponent => {
  logger.info("TableOfContents component initialized")
  return TableOfContents
}) satisfies QuartzComponentConstructor
