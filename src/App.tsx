import { useState, useEffect } from 'react';
import FieldRenderer from './components/fields/FieldRenderer';
import type { FieldConfig } from './config/admin.config';
import { ThemeProvider, useTheme } from './context/ThemeContext';
import { UIProvider } from './context/UIContext';
import { LanguageProvider } from './context/LanguageContext';
import { Sun, Moon } from 'lucide-react';

const INITIAL_CONTENT = `
<h1>Rich Text Editor Showcase</h1>
<p>Welcome to the refactor workbench for <strong>CMS</strong>'s modular Tiptap editor. This document contains all supported typographic formatting, mathematical notations, code snippets, tables, and media blocks.</p>

<hr />

<h2>1. Inline Formatting &amp; Typography</h2>
<p>
    You can easily combine <strong>bold</strong>, <em>italic</em>, <u>underline</u>, <s>strikethrough</s>, and <mark>highlighted</mark> text. 
    It also supports <code>inline code snippets</code>, clickable <a href="https://tiptap.dev">hyperlinks</a>, as well as chemical &amp; mathematical scripts like H<sub>2</sub>O and E = mc<sup>2</sup>.
</p>

<p style="text-align: center;"><em>Centered paragraph with stylistic flair.</em></p>
<p style="text-align: right;"><small>Right-aligned citation or metadata note.</small></p>

<hr />

<h2>2. Lists &amp; Blockquotes</h2>
<ul>
    <li>Unordered item with sub-points:
        <ul>
            <li>Nested bullet hierarchy</li>
            <li>Smooth keyboard indent / outdent</li>
        </ul>
    </li>
    <li>Clean line spacing and bullet alignment</li>
</ul>

<ol>
    <li>First sequential step</li>
    <li>Second operational phase</li>
    <li>Final deployment milestone</li>
</ol>

<blockquote>
    "Simplicity is prerequisite for reliability. Software engineering is the art of structuring complexity into effortless clarity."
</blockquote>

<hr />

<h2>3. Code &amp; Mathematics</h2>
<p>Multi-line code blocks with syntax highlighting support:</p>
<pre><code class="language-typescript">interface ExtensionSchema {
    name: string;
    priority: number;
    renderHTML: (props: any) => [string, Record<string, any>, ...any[]];
}

export const createExtension = (schema: ExtensionSchema) => ({
    ...schema,
    active: true,
});</code></pre>

<p>Inline formula: $f(x) = \\sigma(W x + b)$, and standalone block equation rendered with KaTeX:</p>
<p>$$\\mathcal{L}_{total} = \\frac{1}{N}\\sum_{i=1}^{N} \\left( y_i - \\hat{y}_i \\right)^2 + \\lambda \\|\\mathbf{w}\\|_2^2$$</p>

<hr />

<h2>4. Tables &amp; Data Grids</h2>
<table>
    <thead>
        <tr>
            <th>Module</th>
            <th>Type</th>
            <th>Status</th>
            <th>Throughput</th>
        </tr>
    </thead>
    <tbody>
        <tr>
            <td>RichText Core</td>
            <td>Tiptap Extension</td>
            <td><strong>Optimized</strong></td>
            <td>60 FPS</td>
        </tr>
        <tr>
            <td>KaTeX Math</td>
            <td>Virtual NodeView</td>
            <td><strong>Active</strong></td>
            <td>&lt; 2ms render</td>
        </tr>
        <tr>
            <td>Table Manager</td>
            <td>Custom Prosemirror</td>
            <td><strong>Ready</strong></td>
            <td>Dynamic rows/cols</td>
        </tr>
    </tbody>
</table>

<hr />

<h2>5. Media Assets</h2>
<p>Responsive image integration with caption and ALT text handling:</p>
<img src="https://images.unsplash.com/photo-1517694712202-14dd9538aa97?w=1000&auto=format&fit=crop&q=80" alt="Code editor on laptop screen with warm ambient lighting" />
`;

const sampleField: FieldConfig = {
    id: 'content',
    label: '',
    type: 'richtext',
};

function EditorView() {
    const { theme, toggleTheme } = useTheme();
    const [content, setContent] = useState<string>(INITIAL_CONTENT);

    // Sync theme class to document root
    useEffect(() => {
        const root = document.documentElement;
        if (theme === 'dark') {
            root.classList.add('dark');
        } else {
            root.classList.remove('dark');
        }
    }, [theme]);

    return (
        <div className="h-screen w-screen overflow-hidden bg-background text-foreground flex flex-col items-center justify-center p-4 sm:p-6 select-none transition-colors duration-150">
            {/* Minimalist Floating Theme Toggle */}
            <button
                onClick={toggleTheme}
                className="fixed top-4 right-4 z-50 p-2 rounded-lg border border-border bg-card/80 hover:bg-muted text-muted-foreground hover:text-foreground transition-colors shadow-xs cursor-pointer"
                title={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
            >
                {theme === 'dark' ? <Sun size={15} /> : <Moon size={15} />}
            </button>

            {/* Compact Editor Container (Identical to Blocks Editor) */}
            <div className="w-full max-w-[760px] flex flex-col select-text">
                {/* Minimalist Block Header */}
                <div className="flex items-center gap-2 mb-2 px-1 text-[11px] font-mono tracking-[0.2em] text-muted-foreground/80 uppercase">
                    <span className="w-1.5 h-1.5 rounded-full bg-foreground/50" />
                    <span>RICH TEXT</span>
                </div>

                {/* Editor Surface */}
                <div className="w-full rounded-xl border border-border bg-card shadow-sm overflow-hidden flex flex-col max-h-[84vh]">
                    <div className="overflow-y-auto flex-1 p-2 sm:p-3">
                        <FieldRenderer
                            field={sampleField}
                            value={content}
                            onChange={(val: any) => setContent(val)}
                            slotKey="refactor_slot"
                            itemId="demo_item"
                        />
                    </div>
                </div>
            </div>
        </div>
    );
}

export default function App() {
    return (
        <ThemeProvider>
            <UIProvider>
                <LanguageProvider>
                    <EditorView />
                </LanguageProvider>
            </UIProvider>
        </ThemeProvider>
    );
}
