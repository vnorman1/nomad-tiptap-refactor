/**
 * Code Block Toolbar Component
 * Toolbar chrome for code block NodeView with language selection, wrap toggle, and copy button
 * 
 * Renders:
 * - Three macOS-style window dots (red, yellow, green)
 * - Language selector dropdown
 * - Line-wrap toggle button
 * - Copy button with success/error feedback
 * - Delete button
 * 
 * @requirements 5.3, 5.4, 5.5, 5.6, 5.8
 */

import React from 'react';
import { useTranslation } from 'react-i18next';
import {
  WrapText,
  Copy,
  CheckCheck,
  Trash2,
  Code2,
  ChevronDown,
} from 'lucide-react';
import { Toolbar_Button } from '../shared/toolbar';
import { SUPPORTED_CODE_LANGUAGES } from './languageSupport';

export interface CodeBlockToolbarProps {
  language: string;
  wrapLines: boolean;
  copied: boolean;
  onLanguageChange: (lang: string) => void;
  onWrapToggle: () => void;
  onCopy: () => void;
  onDelete: () => void;
}

export const CodeBlockToolbar = React.forwardRef<
  HTMLDivElement,
  CodeBlockToolbarProps
>(
  (
    {
      language,
      wrapLines,
      copied,
      onLanguageChange,
      onWrapToggle,
      onCopy,
      onDelete,
    },
    ref
  ) => {
    const { t } = useTranslation(['editor', 'common']);

    return (
      <div
        ref={ref}
        className="flex items-center justify-between px-3.5 py-2 bg-secondary/35 border-b border-border text-xs font-mono select-none"
        contentEditable={false}
      >
        {/* Left: Window Dots & Language Selector */}
        <div className="flex items-center gap-3">
          {/* macOS-style window dots using semantic tokens */}
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-red-500 inline-block shadow-2xs border border-red-700/30" />
            <span className="w-2.5 h-2.5 rounded-full bg-yellow-500 inline-block shadow-2xs border border-yellow-700/30" />
            <span className="w-2.5 h-2.5 rounded-full bg-green-500 inline-block shadow-2xs border border-green-700/30" />
          </div>

          {/* Visual separator */}
          <div className="h-3.5 w-px bg-border" />

          {/* Language Selector */}
          <div className="relative flex items-center">
            <Code2
              size={13}
              className="absolute left-2.5 text-muted-foreground pointer-events-none"
            />
            <select
              value={language}
              onChange={(e) => onLanguageChange(e.target.value)}
              aria-label={t('editor.richTextUpdate.code.language', 'Programming language')}
              className="appearance-none bg-background hover:bg-secondary/60 text-foreground rounded-lg pl-7 pr-7 py-1 text-xs font-mono border border-border focus:outline-none focus:ring-1 focus:ring-primary cursor-pointer transition-all shadow-2xs"
            >
              {SUPPORTED_CODE_LANGUAGES.map((lang) => (
                <option
                  key={lang.id}
                  value={lang.id}
                  className="bg-popover text-popover-foreground"
                >
                  {lang.label}
                </option>
              ))}
            </select>
            <ChevronDown
              size={11}
              className="absolute right-2 text-muted-foreground pointer-events-none"
            />
          </div>
        </div>

        {/* Right: Controls (Wrap lines, Copy code, Delete block) */}
        <div className="flex items-center gap-1.5">
          {/* Line Wrap Toggle */}
          <Toolbar_Button
            icon={<WrapText size={12} />}
            isActive={wrapLines}
            onClick={onWrapToggle}
            title={
              wrapLines
                ? t('editor.richTextUpdate.code.disableWrap', 'Disable line wrapping')
                : t('editor.richTextUpdate.code.enableWrap', 'Enable line wrapping')
            }
            variant="toolbar"
            className={`${
              wrapLines
                ? 'bg-primary text-primary-foreground border-primary font-semibold shadow-xs'
                : 'text-muted-foreground hover:text-foreground bg-background hover:bg-secondary/60 border-border shadow-2xs'
            }`}
          />

          {/* Copy Button */}
          <Toolbar_Button
            icon={copied ? <CheckCheck size={12} /> : <Copy size={12} />}
            onClick={onCopy}
            title={t('editor.richTextUpdate.code.copy', 'Copy code')}
            variant="toolbar"
            className={`${
              copied
                ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/30 font-semibold'
                : 'text-muted-foreground hover:text-foreground bg-background hover:bg-secondary/60 border-border shadow-2xs'
            }`}
          />

          {/* Delete Button */}
          <Toolbar_Button
            icon={<Trash2 size={12} />}
            onClick={onDelete}
            title={t('editor.richTextUpdate.code.delete', 'Delete code block')}
            variant="toolbar"
            className="p-1.5 text-muted-foreground hover:text-red-500 hover:bg-red-500/10 border border-transparent hover:border-red-500/20"
          />
        </div>
      </div>
    );
  }
);

CodeBlockToolbar.displayName = 'CodeBlockToolbar';
