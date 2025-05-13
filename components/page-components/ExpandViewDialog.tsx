
  import { Drawer, DrawerContent,DrawerHeader,DrawerTitle,DrawerDescription } from '@/components/ui/drawer';
  import { useEffect, useState } from 'react';
 import MetricCard from './MetricCard';
import { ScrollArea } from '@/components/ui/scroll-area';
import DynamicDataTable from './DynamicDataTable';
import { MetricMultiView } from './MetricMultiView';
import AddToCollectionButton from './AddToCollectionButton';
 import { Card } from "@/components/ui/card";

  type ExpandViewDialogProps = {
    chat_id: string | number;
    id: string | number;
    open: boolean;
    setOpen: (open: boolean) => void;
  };
  const columnsMeta = {
  UUID: {
    name: 'UUID',
    customCell: (value) => <strong className="text-blue-600">{value}</strong>,
  },
  status: {
    name: 'Status',
    customCell: (value) => (
      <span className={`px-2 py-1 rounded text-xs ${value === 'active' ? 'bg-green-200 text-green-800' : 'bg-red-200 text-red-800'}`}>
        {value}
      </span>
    ),
  },
  score: {
    name: 'Score',
    customCell: (value) => (
      <span>
        {value} {value > 100 && '🔥'}
      </span>
    ),
  },
  ID: {
    name: 'ID',
    customCell: (value) => (
      <span>
        {value}
      </span>
    ),
    customHeader: () => <span className="uppercase">ID</span>,
  },
  COUNTRYID: {
    name: 'COUNTRY ID',
    customCell: (value) => (
      <span>
        {value}
      </span>
    ),
    customHeader: () => <span className="uppercase">COUNTRY ID</span>,
  },
  CITY: {
    name: 'CITY',
    customCell: (value) => (
      <span>
        {value}
      </span>
    ),
    customHeader: () => <span className="uppercase">CITY</span>,
  },
  DONOTDISTURBENABLED: {
    name: "Don't Disturb Enabled",
    customCell: (value) => (
      <span>
        {value}
      </span>
    ),
    customHeader: () => <span className="uppercase">Don't Disturb Enabled</span>,
  },
  IPADDRESS: {
    name: 'IPADDRESS',
    customCell: (value) => (
      <span>
        {value}
      </span>
    ),
    customHeader: () => <span className="uppercase">Ip Address</span>,
  },
  LASTENROLLEDDATE: {
    name: 'LASTENROLLEDDATE',
    customCell: (value) => (
      <span>
        {value}
      </span>
    ),
    customHeader: () => <span className="uppercase">Last Enrolled Date</span>,
  },
  LASTINVENTORYUPDATEDATE: {
    name: 'LASTINVENTORYUPDATEDATE',
    customCell: (value) => (
      <span>
        {value}
      </span>
    ),
    customHeader: () => <span className="uppercase">Last Inventory Update Date</span>,
  },
  MANAGED: {
    name: 'MANAGED',
    customCell: (value) => (
      <span>
        {value}
      </span>
    ),
    customHeader: () => <span className="uppercase">MANAGED</span>,
  },
  OSBUILD: {
    name: 'OSBUILD',
    customCell: (value) => (
      <span>
        {value}
      </span>
    ),
    customHeader: () => <span className="uppercase">OS BUILD</span>,
  },
  OSVERSION: {
    name: 'OSVERSION',
    customCell: (value) => (
      <span>
        {value}
      </span>
    ),
    customHeader: () => <span className="uppercase">OS VERSION</span>,
  },
  HARDWAREDEVICEID: {
    name: 'HARDWAREDEVICEID',
    customCell: (value) => (
      <span>
        {value}
      </span>
    ),
    customHeader: () => <span className="uppercase">Hardward Device Id</span>,
  },
  MODEL: {
    name: 'MODEL',
    customCell: (value) => (
      <span>
        {value}
      </span>
    ),
    customHeader: () => <span className="uppercase">MODEL</span>,
  },
  MODELNUMBER: {
    name: 'MODELNUMBER',
    customCell: (value) => (
      <span>
        {value}
      </span>
    ),
    customHeader: () => <span className="uppercase">MODEL NUMBER</span>,
  },
  DEVICE_MODEL: {
    name: 'DEVICE_MODEL',
    customCell: (value) => (
      <span>
        {value}
      </span>
    ),
    customHeader: () => <span className="uppercase">DEVICE MODEL</span>,
  },
  SERIALNUMBER: {
    name: 'SERIALNUMBER',
    customCell: (value) => (
      <span>
        {value}
      </span>
    ),
    customHeader: () => <span className="uppercase">Serial Number</span>,
  },
  WIFIMACADDRESS: {
    name: 'WIFIMACADDRESS',
    customCell: (value) => (
      <span>
        {value}
      </span>
    ),
    customHeader: () => <span className="uppercase">WIFI MAC ADDRESS</span>,
  },
  BATTERYLEVEL: {
    name: 'BATTERYLEVEL',
    customCell: (value) => (
      <span>
        {value}
      </span>
    ),
    customHeader: () => <span className="uppercase">BATTERY LEVEL</span>,
  },
  LOSTMODEENABLED: {
    name: 'LOSTMODEENABLED',
    customCell: (value) => (
      <span>
        {value}
      </span>
    ),
    customHeader: () => <span className="uppercase">LOST MODE ENABLED</span>,
  },
  USERNAME: {
    name: 'USERNAME',
    customCell: (value) => (
      <span>
        {value}
      </span>
    ),
    customHeader: () => <span className="uppercase">USERNAME</span>,
  },
  STORE: {
    name: 'STORE',
    customCell: (value) => (
      <span>
        {value}
      </span>
    ),
    customHeader: () => <span className="uppercase">STORE</span>,
  },
  ENV: {
    name: 'ENV',
    customCell: (value) => (
      <span>
        {value}
      </span>
    ),
    customHeader: () => <span className="uppercase">ENV</span>,
  },
  TYPE: {
    name: 'TYPE',
    customCell: (value) => (
      <span>
        {value}
      </span>
    ),
    customHeader: () => <span className="uppercase">TYPE</span>,
  },
  PROFILES: {
    name: 'PROFILES',
    customCell: (value) => (
      <span>
        {value}
      </span>
    ),
    customHeader: () => <span className="uppercase">PROFILES</span>,
  },
  SNAPSHOT_TIME: {
    name: 'SNAPSHOT_TIME',
    customCell: (value) => (
      <span>
        {value}
      </span>
    ),
    customHeader: () => <span className="uppercase">SNAPSHOT TIME</span>,
  },
  TIMEZONE: {
    name: 'TIMEZONE',
    customCell: (value) => (
      <span>
        {value}
      </span>
    ),
    customHeader: () => <span className="uppercase">TIMEZONE</span>,
  },
  OS_STATUS: {
    name: 'OS_STATUS',
    customCell: (value) => (
      <span>
        {value}
      </span>
    ),
    customHeader: () => <span className="uppercase">OS STATUS</span>,
  },
  OFFLINE_STATUS: {
    name: 'OFFLINE_STATUS',
    customCell: (value) => (
      <span>
        {value}
      </span>
    ),
    customHeader: () => <span className="uppercase">OFFLINE STATUS</span>,
  },
  CERTIFICATE_STATUS: {
    name: 'CERTIFICATE_STATUS',
    customCell: (value) => (
      <span>
        {value}
      </span>
    ),
    customHeader: () => <span className="uppercase">CERTIFICATE STATUS</span>,
  },
  CERTIFICATES: {
    name: 'CERTIFICATES',
    customCell: (value) => (
      <span>
        {value}
      </span>
    ),
    customHeader: () => <span className="uppercase">CERTIFICATES</span>,
  },
  EXPIRED_CERTIFICATES: {
    name: 'EXPIRED_CERTIFICATES',
    customCell: (value) => (
      <span>
        {value}
      </span>
    ),
    customHeader: () => <span className="uppercase">EXPIRED CERTIFICATES</span>,
  },
  APPLICATION_STATUS: {
    name: 'APPLICATION_STATUS',
    customCell: (value) => (
      <span>
        {value}
      </span>
    ),
    customHeader: () => <span className="uppercase">APPLICATION STATUS</span>,
  },
  APPLICATIONS: {
    name: 'APPLICATIONS',
    customCell: (value) => (
      <span>
        {value}
      </span>
    ),
    customHeader: () => <span className="uppercase">APPLICATIONS</span>,
  },
  DEVICE_HEALTH_STATUS: {
    name: 'DEVICE_HEALTH_STATUS',
    customCell: (value) => (
      <span>
        {value}
      </span>
    ),
    customHeader: () => <span className="uppercase">DEVICE HEALTH STATUS</span>,
  },
  DEVICEID: {
    name: 'DEVICEID',
    customCell: (value) => (
      <span>
        {value}
      </span>
    ),
    customHeader: () => <span className="uppercase">DEVICEID</span>,
  },
  BATTERY_STATUS: {
    name: 'BATTERY_STATUS',
    customCell: (value) => (
      <span>
        {value}
      </span>
    ),
    customHeader: () => <span className="uppercase">BATTERY STATUS</span>,
  },
  EXPIREDCERTCOUNT: {
    name: 'EXPIREDCERTCOUNT',
    customCell: (value) => (
      <span>
        {value}
      </span>
    ),
    customHeader: () => <span className="uppercase">Expired Certificates Count</span>,
  },
  OUTDATEDAPPSCOUNT: {
    name: 'OUTDATEDAPPSCOUNT',
    customCell: (value) => (
      <span>
        {value}
      </span>
    ),
    customHeader: () => <span className="uppercase">OUTDATED APPS COUNT</span>,
  },
  PROFILES: {
    name: 'PROFILES',
    customCell: (value) => (
      <span>
        {value}
      </span>
    ),
    customHeader: () => <span className="uppercase">PROFILES</span>,
  },
  PROFILES: {
    name: 'PROFILES',
    customCell: (value) => (
      <span>
        {value}
      </span>
    ),
    customHeader: () => <span className="uppercase">PROFILES</span>,
  },

  
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
  