import { RichTextFieldRenderer } from './FieldRendererComponents';
import type { FieldRendererProps } from './FieldRendererComponents/types';

// Re-export types for backwards compatibility
export type { FieldRendererProps };

/**
 * FieldRenderer - Streamlined for RichText editing & refactoring
 */
export default function FieldRenderer({
    field,
    value,
    onChange,
    disabled = false,
    hasError = false,
    activeBlockId,
    hideAltEditor,
    currentLanguage,
    instantUpload,
    onSave,
    slotKey,
    itemId,
    isDraftSaving,
    lastDraftSave,
    showDraftRecovery,
    hasPendingDraft,
    pendingDraft,
    onRestoreDraft,
    onDiscardDraft,
}: FieldRendererProps) {
    // Hidden check
    if (field?.hidden) return null;

    const isDisabled = Boolean(disabled || field?.disabled);
    const isReadOnly = Boolean(field?.readOnly);
    const safeValue = value ?? (field?.defaultValue !== undefined ? field?.defaultValue : '');

    const baseProps = {
        field,
        value,
        onChange,
        disabled: isDisabled,
        isDisabled,
        isReadOnly,
        safeValue,
        hasError,
        activeBlockId,
        hideAltEditor,
        currentLanguage,
        instantUpload,
        onSave,
        slotKey,
        itemId,
        isDraftSaving,
        lastDraftSave,
        showDraftRecovery,
        hasPendingDraft,
        pendingDraft,
        onRestoreDraft,
        onDiscardDraft,
    };

    return <RichTextFieldRenderer {...baseProps} />;
}
