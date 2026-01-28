import { useEffect } from "react";
import { useNavigate } from "react-router-dom";

export default function ResumePage() {
  const navigate = useNavigate();

  useEffect(() => {
    // Always redirect to landing page (replace to prevent back button loop)
    navigate("/resume/landing", { replace: true });
  }, [navigate]);

  return null;
}
