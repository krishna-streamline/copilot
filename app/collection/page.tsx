"use client";
import { Skeleton } from "@/components/ui/skeleton"
import { cn } from "@/lib/utils"
import { useRouter } from "next/navigation";
import { useSearchParams } from "next/navigation";
import ChatHeader from "@/components/page-components/ChatHeader";
import { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card"
import MetricCard from '@/components/page-components/MetricCard';
import DynamicDataTable from '@/components/page-components/DynamicDataTable';
import { MetricMultiView } from '@/components/page-components/MetricMultiView';
import { ScrollArea } from "@/components/ui/scroll-area"
 const columnsMeta = {
    id: { name: "ID" },
    name: { name: "Full Name", display: true },
    UUID: { name: "uuid", display: false }
  }
  
export default function Collections() {
  const router = useRouter();
  const [singleGridColumn, setSingleGridColumn] = useState([])
  const [multiGridColumn, setMultiGridColumn] = useState([])
  const searchParams = useSearchParams();
  const token = searchParams.get("token") || "";
  const collectionId = searchParams.get("collection_id") || "";
  const [collectionData, setCollectionData] = useState({
    title:"",
    description:"",
    main_query:{

    },
    related_queries:{

    }
  })
  const [isLoading, setIsLoading] = useState(false);
  useEffect(()=>{
      localStorage.setItem('auth_token', token)
      if(!token){
        router.replace("/401"); // 👈 Redirect if no token
      }
    },[token,router])
  useEffect(()=>{
    
    const fetchCollections = async() =>{
      setIsLoading(true)
      const res = await fetch(`/api/copilots/collections/${collectionId}/`);
      const collectionDataResp = await res.json();
      const singleGrid = []
      const multiGrid = []
      const keyMetrics = collectionDataResp?.related_queries || []
      keyMetrics.forEach((metrics) => {
        if (metrics?.columns.length === 1) {
          singleGrid.push(metrics);
        } else {
          multiGrid.push(metrics);
        }
      });
      
      setSingleGridColumn(singleGrid)
      setMultiGridColumn(multiGrid)

      setCollectionData(collectionDataResp)
      setIsLoading(false)
    }
    fetchCollections()
  },[collectionId])
  const handleGoHome = () => {
    router.push("/"); // Redirect to home page or login
  };

  return (
    <div className="flex-1 flex flex-col">
      <ChatHeader  title={'Collections'} />
      <ScrollArea>
      <div className="grid p-4 ml-6">
        {isLoading
        ? Array.from({ length: 6 }).map((_, i) => (
            <Card key={i} className="p-4">
              <Skeleton className="h-6 w-2/3 mb-3" />
              <Skeleton className="h-4 w-full mb-2" />
              <Skeleton className="h-4 w-5/6 mb-2" />
              <Skeleton className="h-4 w-1/2" />
            </Card>
          ))
        : (
          <>

          <div className="flex-1 overflow-y-auto w-full px-6 pb-6">
    <div className="grid w-full grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
      {singleGridColumn.map((metric) => {
        const value =
          metric.result && metric.result[0] && Object.values(metric.result[0])
            ? Object.values(metric.result[0])[0]
            : "";
        return (
          <MetricCard
            key={metric.columns[0]}
            title={metric.columns[0]}
            description={metric.explanation}
            value={value}
          />
        );
      })}
    </div>

    <div className="mb-6 space-y-4">
      {multiGridColumn.map((metric, idx) => (
        <MetricMultiView key={idx} metric={metric} />
      ))}
    </div>
    {
      (isLoading) ? (
          <Card className="p-4 text-center text-gray-500 italic">
            Loading ...
          </Card>
        
      ):
      (
        <DynamicDataTable
      title="Title"
      description="Description"
      data={collectionData?.main_query?.result || []}
      columnsMeta={columnsMeta}
    />
      )
    }
    
  </div>
          </>
           

        )
      }
      </div>
      </ScrollArea>
     
      
    </div>
  );
}
