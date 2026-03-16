interface EscrowStatusBadgeProps {
  escrowStatus: 'reserved' | 'released' | null;
}

export default function EscrowStatusBadge({ escrowStatus }: EscrowStatusBadgeProps) {
  if (escrowStatus === null) return null;

  if (escrowStatus === 'reserved') {
    return (
      <span className="bg-yellow-100 border border-yellow-200 text-yellow-700 text-xs font-bold px-2 py-1 rounded-full">
        Pagamento Reservado
      </span>
    );
  }

  return (
    <span className="bg-green-100 border border-green-200 text-green-700 text-xs font-bold px-2 py-1 rounded-full">
      Pagamento Liberado
    </span>
  );
}
