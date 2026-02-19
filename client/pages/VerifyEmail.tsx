import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Mail, ArrowRight, RefreshCw, LogOut } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/lib/supabase";
import { useToast } from "@/hooks/use-toast";

export default function VerifyEmail() {
    const { user, signOut } = useAuth();
    const [loading, setLoading] = useState(false);
    const [resendTime, setResendTime] = useState(0);
    const navigate = useNavigate();
    const { toast } = useToast();

    const handleResend = async () => {
        if (!user?.email) return;
        setLoading(true);
        try {
            const { error } = await supabase.auth.resend({
                type: 'signup',
                email: user.email,
                options: {
                    emailRedirectTo: `${window.location.origin}/auth/callback`
                }
            });

            if (error) {
                toast({
                    title: "Error",
                    description: error.message,
                    variant: "destructive"
                });
            } else {
                toast({
                    title: "Verification Sent",
                    description: "A new verification link has been sent to your email."
                });
                setResendTime(60);
                const timer = setInterval(() => {
                    setResendTime((prev) => {
                        if (prev <= 1) {
                            clearInterval(timer);
                            return 0;
                        }
                        return prev - 1;
                    });
                }, 1000);
            }
        } catch (err) {
            toast({
                title: "Error",
                description: "Failed to resend verification email.",
                variant: "destructive"
            });
        } finally {
            setLoading(false);
        }
    };

    const handleRefresh = () => {
        window.location.reload();
    };

    const handleLogout = async () => {
        await signOut();
        navigate("/");
    };

    return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
            <Card className="w-full max-w-md shadow-lg border-t-4 border-t-primary">
                <CardHeader className="text-center">
                    <div className="mx-auto mb-4 w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center">
                        <Mail className="w-8 h-8 text-primary" />
                    </div>
                    <CardTitle className="text-2xl font-bold">Verification Required</CardTitle>
                    <CardDescription>
                        You're almost there! Please verify your email to access MeritOne.
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                    <div className="text-center space-y-2">
                        <p className="text-sm text-gray-600">
                            We've sent a link to <strong className="text-gray-900">{user?.email}</strong>.
                            Please check your inbox (and spam folder) to complete your registration.
                        </p>
                    </div>

                    <Alert className="bg-blue-50 border-blue-200">
                        <AlertDescription className="text-blue-800 text-xs">
                            <strong>Tip:</strong> If you've already verified your email in another tab, click the <strong>"I've Verified"</strong> button below to refresh your session.
                        </AlertDescription>
                    </Alert>

                    <div className="grid grid-cols-1 gap-3">
                        <Button
                            onClick={handleRefresh}
                            className="w-full bg-green-600 hover:bg-green-700 h-11"
                        >
                            <RefreshCw className="w-4 h-4 mr-2" />
                            I've Verified My Email
                        </Button>

                        <Button
                            variant="outline"
                            onClick={handleResend}
                            disabled={loading || resendTime > 0}
                            className="w-full h-11"
                        >
                            {resendTime > 0 ? `Resend in ${resendTime}s` : "Resend Verification Email"}
                        </Button>

                        <Button
                            variant="ghost"
                            onClick={handleLogout}
                            className="w-full text-gray-500 hover:text-red-600"
                        >
                            <LogOut className="w-4 h-4 mr-2" />
                            Sign Out
                        </Button>
                    </div>

                    <p className="text-[10px] text-center text-gray-400">
                        Need help? Contact support@meritone.in
                    </p>
                </CardContent>
            </Card>
        </div>
    );
}
