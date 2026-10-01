/**
 * Code Block Extension
 * Tiptap extension definition for code blocks with language selection and line wrapping
 * 
 * Features:
 * - Language attribute with parseHTML/renderHTML for serialization fidelity
 * - Line wrap attribute for text wrapping toggle state
 * - Full round-trip serialization with data-language and data-wrap attributes
 * - Integrates with CodeBlockNodeView via ReactNodeViewRenderer
 * 
 * Serialization Output:
 * <pre data-language="javascript" data-wrap="true" class="nomad-code-block ...">
 *   <code class="language-javascript">...</code>
 * </pre>
 * 
 * @requirements 5.1, 11.5
 */

import { CodeBlock } from '@tiptap/extension-code-block';
import { mergeAttributes } from '@tiptap/core';
import { ReactNodeViewRenderer } from '@tiptap/react';
import { CodeBlockNodeView } from './CodeBlockNodeView';

/**
 * Code Block extension options
 * Allows consumers to customize HTML attributes on the rendered <pre> element
 */
export interface CustomCodeBlockOptions {
  HTMLAttributes?: Record<string, any>;
}

/**
 * Tiptap Extension: CustomCodeBlock
 * Extends the default CodeBlock with language selection, line wrap toggle,
 * and enhanced serialization attributes (data-language, data-wrap)
 * 
 * Attributes:
 * - language: Selected code language (default: 'javascript')
 * - wrapLines: Whether text should wrap or scroll (default: false)
 */
export const CustomCodeBlock = CodeBlock.extend<CustomCodeBlockOptions>({
  name: 'codeBlock',

  addAttributes() {
    return {
      ...this.parent?.(),
      language: {
        default: 'javascript',
        parseHTML: (element: HTMLElement) => {
          // Parse data-language attribute first
          const dataLang = element.getAttribute('data-language');
          if (dataLang) {
            return dataLang;
          }

          // Fallback: parse language from code element's class
          const codeEl = element.querySelector('code');
          if (codeEl) {
            const match = codeEl.className.match(/language-([a-z0-9_-]+)/i);
            if (match) {
              return match[1];
            }
          }

          return 'javascript';
        },
        renderHTML: (attributes: any) => ({
          'data-language': attributes.language || 'javascript',
        }),
      },
      wrapLines: {
        default: false,
        parseHTML: (element: HTMLElement) => {
          return element.getAttribute('data-wrap') === 'true';
        },
        renderHTML: (attributes: any) => ({
          'data-wrap': attributes.wrapLines ? 'true' : 'false',
        }),
      },
    };
  },

  renderHTML({ node, HTMLAttributes }) {
    const lang = node.attrs.language || 'javascript';
    const wrap = node.attrs.wrapLines ? 'true' : 'false';

    return [
      'pre',
      mergeAttributes(this.options.HTMLAttributes || {}, HTMLAttributes, {
        'data-language': lang,
        'data-wrap': wrap,
        class: `nomad-code-block rounded-lg p-4 font-mono text-xs bg-zinc-950 text-zinc-100 ${
          node.attrs.wrapLines ? 'whitespace-pre-wrap break-words' : 'whitespace-pre overflow-x-auto'
        }`,
      }),
      [
        'code',
        {
          class: lang ? `language-${lang}` : undefined,
          'data-language': lang,
        },
        0,
      ],
    ];
  },

  addNodeView() {
    return ReactNodeViewRenderer(CodeBlockNodeView);
  },
});
