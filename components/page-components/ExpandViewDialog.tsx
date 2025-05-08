
  import { Drawer, DrawerContent,DrawerHeader,DrawerTitle,DrawerDescription } from '@/components/ui/drawer';
  import { useEffect, useState } from 'react';
  import { Card, CardContent,CardDescription,
    CardHeader,
    CardTitle } from "@/components/ui/card";
import { ScrollArea } from '@/components/ui/scroll-area';
import DynamicDataTable from './DynamicDataTable';
import { MetricMultiView } from './MetricMultiView';
import AddToCollectionButton from './AddToCollectionButton';

type MetricCardProps = {
    title: string;
    description: string;
    value:string
  }
  type ExpandViewDialogProps = {
    chat_id: string | number;
    id: string | number;
    open: boolean;
    setOpen: (open: boolean) => void;
  };
  const columnsMeta = {
    id: { name: "ID" },
    name: { name: "Full Name", display: true },
    UUID: { name: "uuid", display: false }
  }
  const MetricCard = ({ title, description,value }: MetricCardProps) => {
    return (
      <Card className="rounded-xl border border-gray-200 shadow-sm p-6">
        <CardHeader className='px-0'>
        <CardTitle>{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
        <CardContent className="p-1 text-right">
          
          <p className="text-2xl font-semibold text-black mt-2">{value}</p>
        </CardContent>
      </Card>
    );
  };
  const ExpandViewDialog = ({ chat_id, id, open, setOpen }: ExpandViewDialogProps) => {
    
    const [data, setData] = useState<any>({message:'',queries:[]});
    const [loading, setLoading] = useState(true);
    const [singleGridColumn, setSingleGridColumn] = useState([])
    const [mainData, setMainData] = useState([])
    const [multiGridColumn, setMultiGridColumn] = useState([])
 
    useEffect(() => {
        const fetchMessage = async () => {
          setLoading(true);
          const res = await fetch(`/api/copilots/chats/${chat_id}/messages/${id}`);
          const json = await res.json();
          const singleGrid = []
          const multiGrid = []
          const keyMetrics = json?.queries?.related_queries || []
          console.log("keyMetrics:",keyMetrics)
          keyMetrics.forEach((metrics) => {
            if (metrics?.columns.length === 1) {
              singleGrid.push(metrics);
            } else {
              multiGrid.push(metrics);
            }
          });
          
          setSingleGridColumn(singleGrid)
          setMultiGridColumn(multiGrid)

          setData(json);
          setLoading(false);
        };
        if(open){
            fetchMessage();
        }
        
      }, [open]);
      

  const { message, queries } = data;
  
  
  return (
        <Drawer open={open} onOpenChange={setOpen} direction="right">
        
        <DrawerContent className="ml-auto !w-[80vw] !max-w-none h-full rounded-none border-l border-gray-200 px-0 shadow-lg bg-white flex flex-col">
  <DrawerHeader className="px-6 shrink-0 flex flex-row justify-between">
    <div>
    <DrawerTitle>Expand View</DrawerTitle>
    <DrawerDescription>
      Expand View contains all data based on your inputs and key metrics.
    </DrawerDescription>
    </div>
    <AddToCollectionButton chat_id={chat_id} message_id={id} />
  </DrawerHeader>

  {/* ✅ Scrollable body with full width */}
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
      (loading) ? (
          <Card className="p-4 text-center text-gray-500 italic">
            Loading ...
          </Card>
        
      ):
      (
        <DynamicDataTable
      title="Title"
      description="Description"
      data={data?.queries?.main_query || []}
      columnsMeta={columnsMeta}
    />
      )
    }
    
  </div>
</DrawerContent>

      </Drawer>
    );
  };
  
  export default ExpandViewDialog;
  