import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

i18n
    .use(initReactI18next)
    .init({
        lng: 'hu',
        fallbackLng: 'hu',
        resources: {
            hu: {
                common: {},
                editor: {
                    richTextUpdate: {
                        toolbar: {
                            // Text formatting
                            bold: 'Félkövér',
                            italic: 'Dőlt',
                            underline: 'Aláhúzott',
                            strikethrough: 'Áthúzott',
                            code: 'Kód',
                            superscript: 'Felső index',
                            subscript: 'Alsó index',
                            link: 'Link',
                            link_prompt: 'URL megadása:',
                            
                            // Block formatting
                            paragraph: 'Bekezdés',
                            heading_1: 'Főcím (H1)',
                            heading_2: 'Alcím (H2)',
                            heading_3: 'Szövegcím (H3)',
                            heading_4: 'Szövegcím (H4)',
                            heading_5: 'Szövegcím (H5)',
                            heading_6: 'Szövegcím (H6)',
                            blockquote: 'Idézet',
                            bullet_list: 'Felsorolás',
                            ordered_list: 'Számozott lista',
                            code_block: 'Kódblokk',
                            
                            // Insert
                            insert_table: 'Táblázat beszúrása',
                            insert_math: 'Matematikai képlet beszúrása',
                            insert_inline_math: 'Inline matematika beszúrása',
                            insert_image: 'Kép beszúrása',
                            image_url: 'Kép URL:',
                            insert_video: 'Videó beszúrása',
                            video_url: 'Videó URL:',
                            insert_audio: 'Audió beszúrása',
                            audio_url: 'Audió URL:',
                        },
                        code: {
                            language: 'Programozási nyelv',
                            enableWrap: 'Sortörés bekapcsolása',
                            disableWrap: 'Sortörés kikapcsolása',
                            copy: 'Kód másolása',
                            delete: 'Kódblokk törlése',
                        },
                        math: {
                            // Display and inline mode labels
                            display: 'Blokk',
                            inline: 'Inline',
                            display_desc: 'Külön sorban, középre igazítva',
                            inline_desc: 'Folyószövegbe ágyazva',
                            
                            // Editor UI labels
                            formula_editor: 'Matematikai képlet szerkesztő',
                            inline_editor_title: 'Inline Matematikai szerkesztő',
                            latex_syntax: 'KaTeX / LaTeX szintaxis',
                            latex_code: 'LaTeX kifejezés',
                            preview: 'Előnézet',
                            display_mode: 'displayMode: blokk',
                            inline_mode: 'displayMode: inline',
                            empty_formula: 'Üres képlet — kattints a szerkesztéshez',
                            no_preview: 'Írj be egy kifejezést...',
                            
                            // Buttons
                            edit: 'Képlet szerkesztése',
                            copy: 'LaTeX másolása',
                            copied: 'Másolva!',
                            delete: 'Törlés',
                            save: 'Mentés',
                            cancel: 'Mégse',
                            clear_field: 'Mező törlése',
                            save_shortcut: 'Ctrl+Enter a mentéshez',
                            copy_latex: 'LaTeX másolása vágólapra',
                            copy_label: 'LaTeX másolása',
                            copied_label: 'Másolva!',
                            
                            // Placeholder
                            placeholder: 'pl. E = m c^2  vagy  \\min J = \\sum_{t=1}^T (P_t \\cdot \\lambda_t)',
                            placeholder_inline: 'pl. \\alpha, \\sum_{i=1}^{n}, vagy x^2',
                            
                            // Symbol categories
                            categories: {
                                basic: 'Alapok',
                                operators: 'Operátorok',
                                relations: 'Relációk',
                                greek: 'Görög',
                                format: 'Formázás',
                                delimiters: 'Délimitátorok',
                                functions: 'Függvények',
                            },
                            
                            // Legacy keys (for compatibility)
                            symbol_categories: 'Szimbólumkategóriák',
                            insert_symbol: 'Szimbólum beszúrása',
                            no_symbols_available: 'Nincs elérhető szimbólum',
                        },
                    },
                },
            },
            en: {
                common: {},
                editor: {
                    richTextUpdate: {
                        toolbar: {
                            // Text formatting
                            bold: 'Bold',
                            italic: 'Italic',
                            underline: 'Underline',
                            strikethrough: 'Strikethrough',
                            code: 'Code',
                            superscript: 'Superscript',
                            subscript: 'Subscript',
                            link: 'Link',
                            link_prompt: 'Enter URL:',
                            
                            // Block formatting
                            paragraph: 'Paragraph',
                            heading_1: 'Heading 1',
                            heading_2: 'Heading 2',
                            heading_3: 'Heading 3',
                            heading_4: 'Heading 4',
                            heading_5: 'Heading 5',
                            heading_6: 'Heading 6',
                            blockquote: 'Blockquote',
                            bullet_list: 'Bullet List',
                            ordered_list: 'Ordered List',
                            code_block: 'Code Block',
                            
                            // Insert
                            insert_table: 'Insert Table',
                            insert_math: 'Insert Math Formula',
                            insert_inline_math: 'Insert Inline Math',
                            insert_image: 'Insert Image',
                            image_url: 'Image URL:',
                            insert_video: 'Insert Video',
                            video_url: 'Video URL:',
                            insert_audio: 'Insert Audio',
                            audio_url: 'Audio URL:',
                        },
                        code: {
                            language: 'Programming language',
                            enableWrap: 'Enable line wrapping',
                            disableWrap: 'Disable line wrapping',
                            copy: 'Copy code',
                            delete: 'Delete code block',
                        },
                        math: {
                            // Display and inline mode labels
                            display: 'Block',
                            inline: 'Inline',
                            display_desc: 'Displayed on a separate line, centered',
                            inline_desc: 'Embedded in flowing text',
                            
                            // Editor UI labels
                            formula_editor: 'Math Formula Editor',
                            inline_editor_title: 'Inline Math Editor',
                            latex_syntax: 'KaTeX / LaTeX Syntax',
                            latex_code: 'LaTeX Expression',
                            preview: 'Preview',
                            display_mode: 'displayMode: block',
                            inline_mode: 'displayMode: inline',
                            empty_formula: 'Empty formula — click to edit',
                            no_preview: 'Enter an expression...',
                            
                            // Buttons
                            edit: 'Edit formula',
                            copy: 'Copy LaTeX',
                            copied: 'Copied!',
                            delete: 'Delete',
                            save: 'Save',
                            cancel: 'Cancel',
                            clear_field: 'Clear field',
                            save_shortcut: 'Ctrl+Enter to save',
                            copy_latex: 'Copy LaTeX to clipboard',
                            copy_label: 'Copy LaTeX',
                            copied_label: 'Copied!',
                            
                            // Placeholder
                            placeholder: 'e.g. E = m c^2  or  \\min J = \\sum_{t=1}^T (P_t \\cdot \\lambda_t)',
                            placeholder_inline: 'e.g. \\alpha, \\sum_{i=1}^{n}, or x^2',
                            
                            // Symbol categories
                            categories: {
                                basic: 'Basic',
                                operators: 'Operators',
                                relations: 'Relations',
                                greek: 'Greek',
                                format: 'Formatting',
                                delimiters: 'Delimiters',
                                functions: 'Functions',
                            },
                            
                            // Legacy keys (for compatibility)
                            symbol_categories: 'Symbol categories',
                            insert_symbol: 'Insert symbol',
                            no_symbols_available: 'No symbols available',
                        },
                    },
                },
            },
        },
        interpolation: {
            escapeValue: false,
        },
    });

export default i18n;
