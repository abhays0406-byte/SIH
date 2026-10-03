"use client";
import { useParams } from "next/navigation";
import VerificationWorkspace from "../../components/workspace/VerificationWorkspace";

export default function WorkspacePage() {
  const { bidderId } = useParams<{ bidderId: string }>();
  return <VerificationWorkspace bidderId={bidderId} companyName="TechBuild Solutions Pvt Ltd" />;
}
