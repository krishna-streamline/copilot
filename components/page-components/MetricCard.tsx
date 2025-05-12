 import { Card, CardContent,CardDescription,
    CardHeader,
    CardTitle } from "@/components/ui/card";
    type MetricCardProps = {
    title: string;
    description: string;
    value:string
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

  export default MetricCard