"use client";

import { useRouter } from "next/navigation";
import { useSearchParams } from "next/navigation";
import ChatHeader from "@/components/page-components/ChatHeader";
import { useEffect, useState } from "react";
export default function UnauthorizedPage() {
  const router = useRouter();

  const searchParams = useSearchParams();
  const token = searchParams.get("token") || "";
  const collection_id = searchParams.get("collection_id") || "";
  useEffect(()=>{
      localStorage.setItem('auth_token', token)
      if(!token){
        router.replace("/401"); // 👈 Redirect if no token
      }
    },[token,router])
  const handleGoHome = () => {
    router.push("/"); // Redirect to home page or login
  };

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      <ChatHeader  title={'Collections'} />
      <h1 className="text-5xl font-bold">{collection_id}</h1>
      
    </div>
  );
}
