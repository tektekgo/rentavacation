import { useFairValueScore } from '@/hooks/useFairValueScore';
import { FairValueBadge } from './FairValueBadge';

interface ListingFairValueBadgeProps {
  listingId: string;
}

export function ListingFairValueBadge({ listingId }: ListingFairValueBadgeProps) {
  const { data, isLoading } = useFairValueScore(listingId);
  return <FairValueBadge tier={data?.tier} isLoading={isLoading} />;
}
