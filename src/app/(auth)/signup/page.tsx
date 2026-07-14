import type { Metadata } from "next";
import { SignupForm } from "@/components/auth/SignupForm";

export const metadata: Metadata = {
  title: "Sign up — SMW Dashboard",
};

export default function SignupPage() {
  return <SignupForm />;
}
