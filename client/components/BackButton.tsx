import React from 'react';
import { useNavigate } from 'react-router-dom';
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
    const navigate = useNavigate();

    const handleClick = () => {
        if (onClick) {
            onClick();
        } else {
            navigate(-1);
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
