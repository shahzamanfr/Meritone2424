import React, { useState } from 'react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Mail, AlertCircle, CheckCircle } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';

export const EmailVerificationNotice: React.FC = () => {
    const { user } = useAuth();
    const [isResending, setIsResending] = useState(false);
    const [resendStatus, setResendStatus] = useState<'idle' | 'success' | 'error'>('idle');

    const handleResendVerification = async () => {
        if (!user?.email) return;

        setIsResending(true);
        setResendStatus('idle');

        try {
            const { error } = await supabase.auth.resend({
                type: 'signup',
                email: user.email,
            });

            if (error) {
                setResendStatus('error');
                console.error('Error resending verification email:', error);
            } else {
                setResendStatus('success');
            }
        } catch (error) {
            setResendStatus('error');
            console.error('Unexpected error:', error);
        } finally {
            setIsResending(false);
        }
    };

    return (
        <Alert className="border-amber-200 bg-amber-50">
            <AlertCircle className="h-4 w-4 text-amber-600" />
            <AlertTitle className="text-amber-900 font-semibold">Email Verification Required</AlertTitle>
            <AlertDescription className="text-amber-800">
                <p className="mb-3">
                    Please verify your email address to access this feature. Check your inbox for a verification link.
                </p>

                {resendStatus === 'success' ? (
                    <div className="flex items-center gap-2 text-green-700 bg-green-50 px-3 py-2 rounded-md border border-green-200">
                        <CheckCircle className="h-4 w-4" />
                        <span className="text-sm">Verification email sent! Check your inbox.</span>
                    </div>
                ) : resendStatus === 'error' ? (
                    <div className="flex flex-col gap-2">
                        <p className="text-red-700 text-sm">Failed to resend verification email. Please try again later.</p>
                        <Button
                            onClick={handleResendVerification}
                            disabled={isResending}
                            size="sm"
                            variant="outline"
                            className="w-fit border-amber-300 text-amber-900 hover:bg-amber-100"
                        >
                            <Mail className="h-4 w-4 mr-2" />
                            Try Again
                        </Button>
                    </div>
                ) : (
                    <Button
                        onClick={handleResendVerification}
                        disabled={isResending}
                        size="sm"
                        variant="outline"
                        className="border-amber-300 text-amber-900 hover:bg-amber-100"
                    >
                        <Mail className="h-4 w-4 mr-2" />
                        {isResending ? 'Sending...' : 'Resend Verification Email'}
                    </Button>
                )}
            </AlertDescription>
        </Alert>
    );
};
