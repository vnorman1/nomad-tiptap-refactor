export function escapeAttribute(str: string): string {
    if (!str) return '';
    return str
        .replace(/&/g, '&amp;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;');
}

export function escapeHTML(str: string): string {
    if (!str) return '';
    return str
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
}

export function sanitizeHTML(html: string): string {
    if (!html || typeof html !== 'string') return '';
    // Basic DOM-based sanitization
    if (typeof document === 'undefined') return html;
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, 'text/html');
    
    // Remove dangerous tags
    const scripts = doc.querySelectorAll('script, style, iframe:not([src*="youtube"]):not([src*="vimeo"]):not([src*="google"])');
    scripts.forEach(s => s.remove());
    
    // Remove dangerous event attributes
    const all = doc.querySelectorAll('*');
    all.forEach(el => {
        for (let i = el.attributes.length - 1; i >= 0; i--) {
            const attr = el.attributes[i];
            if (attr.name.startsWith('on') || attr.value.startsWith('javascript:')) {
                el.removeAttribute(attr.name);
            }
        }
    });
    
    return doc.body.innerHTML;
}

export function sanitizeMarkdownInput(markdown: string): string {
    if (typeof markdown !== 'string') return '';
    return markdown
        .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
        .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, '')
        .replace(/<!--[\s\S]*?-->/g, '')
        .replace(/\bon\w+\s*=\s*(['"])[^'"]*\1/gi, '')
        .replace(/javascript:/gi, '')
        .replace(/vbscript:/gi, '');
}

export default {
    escapeHTML,
    escapeAttribute,
    sanitizeHTML,
    sanitizeMarkdownInput,
};
