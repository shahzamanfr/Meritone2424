import React, { useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useSafeBack } from '@/hooks/useSafeBack';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface BackButtonProps {
    onClick?: () => void;
    text?: string;
    className?: string;
}

export const BackButton: React.FC<BackButtonProps> = ({
    onClick,
    text = 'Back',
    className = ''
}) => {
    const safeBack = useSafeBack();
    const navigationAttempted = useRef(false);

    const handleClick = () => {
        if (onClick) {
            onClick();
        } else {
            safeBack();
        }
    };

    return (
        <Button
            variant="ghost"
            onClick={handleClick}
            className={`flex items-center p-2 ${className}`}
            size="sm"
        >
            <ArrowLeft className="w-4 h-4" />
        </Button>
    );
};
