import React from 'react';

export interface PresenceBannerProps {
    otherEditors: string[];
    isConcurrent?: boolean;
    className?: string;
}

export const PresenceBanner: React.FC<PresenceBannerProps> = ({
    otherEditors,
    isConcurrent,
}) => {
    if (!isConcurrent || !otherEditors || otherEditors.length === 0) {
        return null;
    }

    return (
        <div className="bg-amber-500/10 border-b border-amber-500/30 text-amber-300 px-4 py-2 text-xs flex items-center justify-between">
            <span>Több szerkesztő dolgozik ezen a tartalmon: {otherEditors.join(', ')}</span>
        </div>
    );
};

export default PresenceBanner;
