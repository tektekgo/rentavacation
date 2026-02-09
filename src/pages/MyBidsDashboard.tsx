// My Bids Dashboard - For travelers to track their bids and travel requests

import { useState } from 'react';
import { Link } from 'react-router-dom';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { useAuth } from '@/contexts/AuthContext';
import { useMyBids, useMyTravelRequests, useProposalsForRequest, useUpdateProposalStatus } from '@/hooks/useBidding';
import { VerifiedOwnerBadge } from '@/components/RoleBadge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { 
  Gavel, 
  Send, 
  MapPin, 
  Calendar, 
  Clock,
  DollarSign,
  MessageSquare,
  Check,
  X,
  Eye,
  Home,
} from 'lucide-react';
import { format, formatDistanceToNow } from 'date-fns';
import type { TravelRequest, TravelProposalWithDetails } from '@/types/bidding';

const STATUS_COLORS = {
  pending: 'bg-warning',
  accepted: 'bg-success',
  rejected: 'bg-muted',
  expired: 'bg-muted',
  withdrawn: 'bg-muted',
  open: 'bg-primary',
  closed: 'bg-muted',
  fulfilled: 'bg-success',
  cancelled: 'bg-destructive',
};

const MyBidsDashboard = () => {
  const { user } = useAuth();
  const { data: myBids, isLoading: bidsLoading } = useMyBids();
  const { data: myRequests, isLoading: requestsLoading } = useMyTravelRequests();

  const [selectedRequest, setSelectedRequest] = useState<TravelRequest | null>(null);
  const [proposalsDialogOpen, setProposalsDialogOpen] = useState(false);

  if (!user) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="container mx-auto px-4 py-24 text-center">
          <h1 className="text-2xl font-bold mb-4">Please sign in</h1>
          <Button asChild>
            <Link to="/login">Sign In</Link>
          </Button>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <section className="pt-24 pb-12">
        <div className="container mx-auto px-4">
          <h1 className="font-display text-3xl font-bold mb-2">My Bidding Activity</h1>
          <p className="text-muted-foreground mb-8">
            Track your bids, travel requests, and proposals
          </p>

          <Tabs defaultValue="bids" className="space-y-6">
            <TabsList>
              <TabsTrigger value="bids" className="gap-2">
                <Gavel className="h-4 w-4" />
                My Bids
                {myBids && myBids.length > 0 && (
                  <Badge variant="secondary" className="ml-1">{myBids.length}</Badge>
                )}
              </TabsTrigger>
              <TabsTrigger value="requests" className="gap-2">
                <Send className="h-4 w-4" />
                My Travel Requests
                {myRequests && myRequests.length > 0 && (
                  <Badge variant="secondary" className="ml-1">{myRequests.length}</Badge>
                )}
              </TabsTrigger>
            </TabsList>

            {/* My Bids Tab */}
            <TabsContent value="bids" className="space-y-4">
              {bidsLoading ? (
                <div className="space-y-4">
                  {[...Array(3)].map((_, i) => (
                    <Card key={i}>
                      <CardContent className="p-6">
                        <Skeleton className="h-20 w-full" />
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : myBids && myBids.length > 0 ? (
                <div className="space-y-4">
                  {myBids.map((bid) => (
                    <Card key={bid.id}>
                      <CardContent className="p-6">
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <Badge className={STATUS_COLORS[bid.status]}>
                                {bid.status.replace('_', ' ')}
                              </Badge>
                              {bid.counter_offer_amount && (
                                <Badge variant="outline">
                                  Counter offer: ${bid.counter_offer_amount.toLocaleString()}
                                </Badge>
                              )}
                            </div>
                            <h3 className="font-semibold text-lg">
                              {bid.listing?.property?.resort_name}
                            </h3>
                            <p className="text-sm text-muted-foreground flex items-center gap-1">
                              <MapPin className="h-3 w-3" />
                              {bid.listing?.property?.location}
                            </p>
                            <div className="flex items-center gap-4 mt-2 text-sm">
                              <span className="flex items-center gap-1">
                                <Calendar className="h-3 w-3" />
                                {format(new Date(bid.listing?.check_in_date || ''), 'MMM d')} - 
                                {format(new Date(bid.listing?.check_out_date || ''), 'MMM d, yyyy')}
                              </span>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="text-sm text-muted-foreground">Your bid</p>
                            <p className="text-2xl font-bold">${bid.bid_amount.toLocaleString()}</p>
                            <p className="text-xs text-muted-foreground mt-1">
                              {formatDistanceToNow(new Date(bid.created_at), { addSuffix: true })}
                            </p>
                          </div>
                        </div>
                        {bid.message && (
                          <div className="mt-4 p-3 bg-muted/50 rounded-lg text-sm">
                            <p className="text-muted-foreground">Your message:</p>
                            <p>{bid.message}</p>
                          </div>
                        )}
                        {bid.counter_offer_message && (
                          <div className="mt-2 p-3 bg-accent/10 rounded-lg text-sm">
                            <p className="text-muted-foreground">Owner's response:</p>
                            <p>{bid.counter_offer_message}</p>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : (
                <Card className="border-dashed">
                  <CardContent className="flex flex-col items-center justify-center py-16">
                    <Gavel className="h-12 w-12 text-muted-foreground mb-4" />
                    <h3 className="text-lg font-semibold mb-2">No bids yet</h3>
                    <p className="text-muted-foreground text-center mb-4">
                      Start bidding on properties to get great deals
                    </p>
                    <Button asChild>
                      <Link to="/bidding">Browse Biddable Listings</Link>
                    </Button>
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            {/* My Travel Requests Tab */}
            <TabsContent value="requests" className="space-y-4">
              {requestsLoading ? (
                <div className="space-y-4">
                  {[...Array(3)].map((_, i) => (
                    <Card key={i}>
                      <CardContent className="p-6">
                        <Skeleton className="h-20 w-full" />
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : myRequests && myRequests.length > 0 ? (
                <div className="space-y-4">
                  {myRequests.map((request) => (
                    <Card key={request.id}>
                      <CardContent className="p-6">
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <Badge className={STATUS_COLORS[request.status]}>
                                {request.status}
                              </Badge>
                            </div>
                            <h3 className="font-semibold text-lg">{request.destination_location}</h3>
                            <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
                              <span className="flex items-center gap-1">
                                <Calendar className="h-3 w-3" />
                                {format(new Date(request.check_in_date), 'MMM d')} - 
                                {format(new Date(request.check_out_date), 'MMM d, yyyy')}
                              </span>
                              <span>{request.guest_count} guests</span>
                              <span>{request.bedrooms_needed} BR</span>
                            </div>
                            {request.budget_preference !== 'undisclosed' && (
                              <p className="text-sm mt-2">
                                <DollarSign className="h-3 w-3 inline" />
                                Budget: {request.budget_preference === 'range' 
                                  ? `$${request.budget_min?.toLocaleString()} - $${request.budget_max?.toLocaleString()}`
                                  : `Up to $${request.budget_max?.toLocaleString()}`
                                }
                              </p>
                            )}
                          </div>
                          <div className="text-right">
                            <p className="text-sm text-muted-foreground flex items-center gap-1 justify-end">
                              <Clock className="h-3 w-3" />
                              Expires {formatDistanceToNow(new Date(request.proposals_deadline), { addSuffix: true })}
                            </p>
                            <Button 
                              variant="outline" 
                              size="sm" 
                              className="mt-2"
                              onClick={() => {
                                setSelectedRequest(request);
                                setProposalsDialogOpen(true);
                              }}
                            >
                              <Eye className="h-4 w-4 mr-1" />
                              View Proposals
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : (
                <Card className="border-dashed">
                  <CardContent className="flex flex-col items-center justify-center py-16">
                    <Send className="h-12 w-12 text-muted-foreground mb-4" />
                    <h3 className="text-lg font-semibold mb-2">No travel requests yet</h3>
                    <p className="text-muted-foreground text-center mb-4">
                      Post your vacation needs and let verified owners come to you
                    </p>
                    <Button asChild>
                      <Link to="/bidding">Explore Marketplace</Link>
                    </Button>
                  </CardContent>
                </Card>
              )}
            </TabsContent>
          </Tabs>
        </div>
      </section>

      {/* Proposals Dialog */}
      {selectedRequest && (
        <ProposalsDialog
          request={selectedRequest}
          open={proposalsDialogOpen}
          onOpenChange={setProposalsDialogOpen}
        />
      )}

      <Footer />
    </div>
  );
};

// Proposals Dialog
interface ProposalsDialogProps {
  request: TravelRequest;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

function ProposalsDialog({ request, open, onOpenChange }: ProposalsDialogProps) {
  const { data: proposals, isLoading } = useProposalsForRequest(request.id);
  const updateStatus = useUpdateProposalStatus();

  const handleAccept = async (proposalId: string) => {
    await updateStatus.mutateAsync({ proposalId, status: 'accepted' });
  };

  const handleReject = async (proposalId: string) => {
    await updateStatus.mutateAsync({ proposalId, status: 'rejected' });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Proposals for {request.destination_location}</DialogTitle>
          <DialogDescription>
            {format(new Date(request.check_in_date), 'MMM d')} - 
            {format(new Date(request.check_out_date), 'MMM d, yyyy')}
          </DialogDescription>
        </DialogHeader>

        {isLoading ? (
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <Skeleton key={i} className="h-32 w-full" />
            ))}
          </div>
        ) : proposals && proposals.length > 0 ? (
          <div className="space-y-4">
            {proposals.map((proposal) => (
              <Card key={proposal.id}>
                <CardContent className="p-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <Badge className={STATUS_COLORS[proposal.status]}>
                          {proposal.status}
                        </Badge>
                      </div>
                      <h4 className="font-semibold flex items-center gap-2">
                        <Home className="h-4 w-4" />
                        {proposal.property?.resort_name}
                      </h4>
                      <p className="text-sm text-muted-foreground flex items-center gap-1">
                        <MapPin className="h-3 w-3" />
                        {proposal.property?.location}
                      </p>
                      <p className="text-sm mt-1">
                        {proposal.property?.bedrooms} BR • Sleeps {proposal.property?.sleeps}
                      </p>
                      {proposal.message && (
                        <div className="mt-2 p-2 bg-muted/50 rounded text-sm">
                          {proposal.message}
                        </div>
                      )}
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-muted-foreground">Proposed price</p>
                      <p className="text-2xl font-bold text-primary">
                        ${proposal.proposed_price.toLocaleString()}
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        Valid until {format(new Date(proposal.valid_until), 'MMM d')}
                      </p>
                    </div>
                  </div>
                  
                  {proposal.status === 'pending' && (
                    <div className="flex gap-2 mt-4 pt-4 border-t">
                      <Button 
                        onClick={() => handleAccept(proposal.id)}
                        disabled={updateStatus.isPending}
                        className="flex-1"
                      >
                        <Check className="h-4 w-4 mr-1" />
                        Accept
                      </Button>
                      <Button 
                        variant="outline"
                        onClick={() => handleReject(proposal.id)}
                        disabled={updateStatus.isPending}
                        className="flex-1"
                      >
                        <X className="h-4 w-4 mr-1" />
                        Decline
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <MessageSquare className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">No proposals received yet</p>
            <p className="text-sm text-muted-foreground mt-1">
              Property owners will submit proposals soon
            </p>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

export default MyBidsDashboard;
