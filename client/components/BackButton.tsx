import React, { useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
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
    const location = useLocation();
    const navigationAttempted = useRef(false);

    const handleClick = () => {
        if (onClick) {
            onClick();
        } else {
            // Store current path
            const currentPath = location.pathname;

            // Try to go back
            navigate(-1);

            // Set a timeout to check if navigation actually happened
            // If we're still on the same page after a short delay, go to homepage
            setTimeout(() => {
                if (window.location.pathname === currentPath && !navigationAttempted.current) {
                    navigationAttempted.current = true;
                    navigate('/');
                }
            }, 100);
        }
    };

    // Reset the flag when location changes
    useEffect(() => {
        navigationAttempted.current = false;
    }, [location]);

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
