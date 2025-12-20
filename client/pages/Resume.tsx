import { useEffect } from "react";
import { useNavigate } from "react-router-dom";

export default function ResumePage() {
  const navigate = useNavigate();

  useEffect(() => {
    // Always redirect to landing page
    navigate("/resume/landing");
  }, [navigate]);

  return null;
}
