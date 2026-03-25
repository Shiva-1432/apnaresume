import TicketDetails from '@/components/TicketDetails';

interface TicketPageProps {
  params: {
    ticketId: string;
  };
}

export default function TicketDetailsPage({ params }: TicketPageProps) {
  return (
    <div className="py-10 sm:py-14 max-w-4xl mx-auto">
      <TicketDetails ticketId={params.ticketId} />
    </div>
  );
}
