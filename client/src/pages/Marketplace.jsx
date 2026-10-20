import { useState, useEffect } from 'react';
import { platformCategories } from '../../../shared/resources';
import {
  Search,
  Filter,
  Sparkles,
  Star,
  UserPlus,
  CheckCircle2,
  SlidersHorizontal,
  Send,
  Check,
  RefreshCw,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { Button, Badge, Loading, ErrorView } from '../components/ui';
import { marketplaceApi } from '../services/marketplaceApi';
import { service } from '../services/api';
import { MatchScoreVisualizer } from '../components/marketplace/MatchScoreVisualizer';
import { OfferNegotiationModal } from '../components/marketplace/OfferNegotiationModal';
export default function Marketplace() {
  const [activeTab, setActiveTab] = useState('discovery'); 
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('');
  const [platform, setPlatform] = useState('');
  const [availability, setAvailability] = useState('');
  const [verifiedOnly, setVerifiedOnly] = useState(false);
  const [creators, setCreators] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [campaigns, setCampaigns] = useState([]);
  const [selectedCampaignId, setSelectedCampaignId] = useState('');
  const [matches, setMatches] = useState([]);
  const [matchingLoading, setMatchingLoading] = useState(false);
  const [offers, setOffers] = useState([]);
  const [offersLoading, setOffersLoading] = useState(false);
  const [selectedMatch, setSelectedMatch] = useState(null);
  const [selectedOfferCreator, setSelectedOfferCreator] = useState(null);
  useEffect(() => {
    fetchDiscovery();
    fetchCampaigns();
  }, [category, platform, availability, verifiedOnly]);
  const fetchDiscovery = async () => {
    try {
      setLoading(true);
      setError(null);
      const params = {
        ...(search && { search }),
        ...(category && { category }),
        ...(platform && { platform }),
        ...(availability && { availability }),
        ...(verifiedOnly && { verified: 'true' }),
      };
      const res = await marketplaceApi.discoverCreators(params);
      setCreators(res.items || []);
    } catch (err) {
      setError(err);
    } finally {
      setLoading(false);
    }
  };
  const fetchCampaigns = async () => {
    try {
      const data = await service.list('campaigns');
      setCampaigns(data || []);
      if (data && data.length > 0 && !selectedCampaignId) {
        setSelectedCampaignId(data[0]._id);
      }
    } catch (err) {
      console.error('Failed to load campaigns:', err);
    }
  };
  const fetchOffers = async () => {
    try {
      setOffersLoading(true);
      const res = await marketplaceApi.listInvitations();
      setOffers(res.items || []);
    } catch (err) {
      toast.error('Failed to load invitations.');
    } finally {
      setOffersLoading(false);
    }
  };
  useEffect(() => {
    if (activeTab === 'offers') {
      fetchOffers();
    }
  }, [activeTab]);
  const handleRunMatcher = async () => {
    if (!selectedCampaignId) {
      toast.error('Please select a campaign first.');
      return;
    }
    try {
      setMatchingLoading(true);
      const res = await marketplaceApi.matchCreators(selectedCampaignId);
      setMatches(res.matches || []);
    } catch (err) {
      toast.error('Failed to run AI campaign matching.');
    } finally {
      setMatchingLoading(false);
    }
  };
  const handleInviteCreator = async (creator) => {
    if (!campaigns.length) {
      toast.error('No campaigns found. Create a campaign first.');
      return;
    }
    try {
      await marketplaceApi.createInvitation({
        campaignId: campaigns[0]._id,
        creatorId: creator._id,
        message: 'We would love to invite you to join our campaign!',
      });
      toast.success(`Invitation sent to ${creator.displayName}!`);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to send invitation.');
    }
  };
  const handleAcceptOffer = async (offerId) => {
    try {
      await marketplaceApi.acceptOffer(offerId);
      toast.success('Offer accepted! Creator assigned to campaign.');
      fetchOffers();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to accept offer.');
    }
  };
  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-6 rounded-3xl bg-gradient-to-r from-[#2b5341] to-[#1e3b2e] text-white shadow-xl">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-lg bg-white/10">
              <Sparkles size={18} className="text-amber-300" />
            </span>
            <span className="text-xs font-semibold tracking-widest uppercase text-amber-200">Creator OS Ecosystem</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Creator Marketplace & AI Discovery</h1>
          <p className="text-xs sm:text-sm text-white/80 max-w-2xl">
            Discover verified creators, run AI-weighted campaign matching algorithms, and negotiate campaign deals under one platform.
          </p>
        </div>
        <div className="flex flex-wrap bg-black/20 p-1.5 rounded-2xl border border-white/10 shrink-0">
          <button
            onClick={() => setActiveTab('discovery')}
            className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all ${
              activeTab === 'discovery' ? 'bg-white text-ink shadow-md' : 'text-white/80 hover:text-white'
            }`}
          >
            Discovery Grid
          </button>
          <button
            onClick={() => setActiveTab('matcher')}
            className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all flex items-center gap-1.5 ${
              activeTab === 'matcher' ? 'bg-white text-ink shadow-md' : 'text-white/80 hover:text-white'
            }`}
          >
            <Sparkles size={13} className="text-amber-500" /> AI Matcher
          </button>
          <button
            onClick={() => setActiveTab('offers')}
            className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all ${
              activeTab === 'offers' ? 'bg-white text-ink shadow-md' : 'text-white/80 hover:text-white'
            }`}
          >
            Offers & Activity
          </button>
        </div>
      </div>
      {activeTab === 'discovery' && (
        <div className="space-y-6">
          <div className="card p-4 space-y-4">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                fetchDiscovery();
              }}
              className="flex flex-col sm:flex-row gap-3"
            >
              <div className="relative flex-1">
                <input
                  type="text"
                  placeholder="Search creators by name, username, bio..."
                  className="input pl-9 w-full"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
                <Search size={16} className="absolute left-3 top-3 text-muted" />
              </div>
              <Button variant="primary" type="submit">
                Search
              </Button>
            </form>
            <div className="flex flex-wrap items-center gap-3 pt-2 border-t border-line text-xs">
              <span className="font-semibold uppercase tracking-wider text-muted flex items-center gap-1">
                <Filter size={13} /> Filters:
              </span>
              <select className="btn btn-secondary py-1 text-xs" value={category} onChange={(e) => setCategory(e.target.value)}>
                <option value="">All Categories</option>
                <option value="Tech">Tech & Gadgets</option>
                <option value="Fashion">Fashion & Style</option>
                <option value="Fitness">Fitness & Health</option>
                <option value="Gaming">Gaming & Esports</option>
                <option value="Lifestyle">Lifestyle & Vlogs</option>
                <option value="Business">Business & Finance</option>
              </select>
              <select className="btn btn-secondary py-1 text-xs" value={platform} onChange={(e) => setPlatform(e.target.value)}>
                <option value="">All Platforms</option>
                {platformCategories.map((grp) => (
                  <optgroup key={grp.category} label={grp.category}>
                    {grp.platforms.map((p) => (
                      <option key={p} value={p}>{p}</option>
                    ))}
                  </optgroup>
                ))}
              </select>
              <select className="btn btn-secondary py-1 text-xs" value={availability} onChange={(e) => setAvailability(e.target.value)}>
                <option value="">Any Availability</option>
                <option value="Available">Available Now</option>
                <option value="Busy">Busy</option>
                <option value="On Leave">On Leave</option>
              </select>
              <label className="flex items-center gap-1.5 cursor-pointer font-medium text-ink ml-auto">
                <input
                  type="checkbox"
                  className="checkbox"
                  checked={verifiedOnly}
                  onChange={(e) => setVerifiedOnly(e.target.checked)}
                />
                Verified Only
              </label>
            </div>
          </div>
          {loading ? (
            <Loading />
          ) : error ? (
            <ErrorView error={error} retry={fetchDiscovery} />
          ) : creators.length === 0 ? (
            <div className="card p-12 text-center space-y-3">
              <p className="text-base font-semibold">No creators found matching criteria.</p>
              <p className="text-xs text-muted">Try adjusting search query or clearing category filters.</p>
              <Button variant="secondary" onClick={() => { setSearch(''); setCategory(''); setPlatform(''); setAvailability(''); setVerifiedOnly(false); }}>
                Reset Filters
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {creators.map((creator) => (
                <div key={creator._id} className="card p-5 space-y-4 hover:shadow-lg transition-all flex flex-col justify-between">
                  <div className="space-y-3">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <img
                          src={creator.profileImage || `https://ui-avatars.com/api/?name=${encodeURIComponent(creator.displayName)}&background=2b5341&color=fff`}
                          alt={creator.displayName}
                          className="w-12 h-12 rounded-2xl object-cover border border-line"
                        />
                        <div>
                          <div className="flex items-center gap-1.5">
                            <h3 className="font-semibold text-sm tracking-tight text-ink">{creator.displayName}</h3>
                            {creator.isVerified && <CheckCircle2 size={14} className="text-blue-600 dark:text-blue-400 shrink-0" />}
                          </div>
                          <p className="text-xs text-muted">@{creator.username}</p>
                        </div>
                      </div>
                      <Badge>{creator.availabilityStatus || 'Available'}</Badge>
                    </div>
                    <p className="text-xs text-muted line-clamp-2 leading-relaxed">{creator.bio || 'Professional content creator.'}</p>
                    <div className="grid grid-cols-2 gap-2 p-3 rounded-xl bg-canvas border border-line text-xs">
                      <div>
                        <span className="text-muted block text-[10px] uppercase font-medium">Client Rating</span>
                        <span className="font-semibold flex items-center gap-1 text-ink">
                          <Star size={12} className="text-amber-500 fill-amber-500" /> {creator.rating || 5.0} / 5.0
                        </span>
                      </div>
                      <div>
                        <span className="text-muted block text-[10px] uppercase font-medium">Starting Rate</span>
                        <span className="font-semibold text-emerald-700 dark:text-emerald-400">
                          ${creator.minimumBudget?.toLocaleString() || 500}
                        </span>
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {creator.platforms?.map((p) => (
                        <span key={p} className="text-[10px] font-semibold px-2 py-0.5 rounded-md bg-card border border-line text-muted">
                          {p}
                        </span>
                      ))}
                      {creator.categories?.map((c) => (
                        <span key={c} className="text-[10px] font-semibold px-2 py-0.5 rounded-md bg-emerald-50 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300">
                          {c}
                        </span>
                      ))}
                    </div>
                  </div>
                  <div className="flex items-center gap-2 pt-3 border-t border-line">
                    <Button
                      variant="secondary"
                      className="flex-1 text-xs py-1.5"
                      onClick={() => handleInviteCreator(creator)}
                    >
                      <UserPlus size={13} /> Invite
                    </Button>
                    <Button
                      variant="primary"
                      className="flex-1 text-xs py-1.5"
                      onClick={() => setSelectedOfferCreator(creator)}
                    >
                      <Send size={13} /> Send Offer
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
      {activeTab === 'matcher' && (
        <div className="space-y-6">
          <div className="card p-6 space-y-4">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="space-y-1">
                <h2 className="text-lg font-semibold tracking-tight flex items-center gap-2">
                  <Sparkles size={18} className="text-amber-500" /> AI Campaign Matching Engine
                </h2>
                <p className="text-xs text-muted">
                  Select a campaign to run weighted 6-factor AI compatibility analysis across available creator profiles.
                </p>
              </div>
              <div className="flex items-center gap-3 w-full sm:w-auto">
                <select
                  className="btn btn-secondary text-xs flex-1 sm:w-64"
                  value={selectedCampaignId}
                  onChange={(e) => setSelectedCampaignId(e.target.value)}
                >
                  <option value="">Select Campaign...</option>
                  {campaigns.map((c) => (
                    <option key={c._id} value={c._id}>
                      {c.name || c.title}
                    </option>
                  ))}
                </select>
                <Button variant="primary" onClick={handleRunMatcher} loading={matchingLoading}>
                  <Sparkles size={14} /> Calculate Matches
                </Button>
              </div>
            </div>
          </div>
          {matchingLoading ? (
            <Loading />
          ) : matches.length === 0 ? (
            <div className="card p-12 text-center space-y-3">
              <Sparkles size={28} className="mx-auto text-amber-500" />
              <h3 className="text-base font-semibold">Ready to find optimal creators</h3>
              <p className="text-xs text-muted max-w-md mx-auto">
                Select a campaign above and click "Calculate Matches" to run real-time multi-dimensional scoring.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center justify-between text-xs text-muted px-1">
                <span>Top {matches.length} Recommended Creators Ranked by AI Match Score</span>
                <span className="font-medium text-emerald-700 dark:text-emerald-400">Match score calculated instantly</span>
              </div>
              <div className="grid grid-cols-1 gap-4">
                {matches.map((item) => (
                  <div key={item.creator._id} className="card p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-5 hover:border-emerald-600/30 transition-all">
                    <div className="flex items-center gap-4">
                      <div className={`flex flex-col items-center justify-center shrink-0 w-14 h-14 rounded-2xl font-bold text-lg border ${
                        item.score >= 80 ? 'bg-emerald-50 text-emerald-800 border-emerald-300 dark:bg-emerald-950 dark:text-emerald-200' : 'bg-amber-50 text-amber-800 border-amber-300 dark:bg-amber-950 dark:text-amber-200'
                      }`}>
                        <span>{item.score}%</span>
                        <span className="text-[9px] uppercase tracking-wider font-normal">Match</span>
                      </div>
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <h4 className="font-semibold text-sm text-ink">{item.creator.displayName}</h4>
                          <span className="text-xs text-muted">@{item.creator.username}</span>
                        </div>
                        <p className="text-xs text-muted line-clamp-1">{item.reasons?.[0] || 'High category and reach compatibility.'}</p>
                        <div className="flex flex-wrap gap-1 pt-0.5">
                          {item.creator.platforms?.map((p) => (
                            <span key={p} className="text-[10px] px-1.5 py-0.5 rounded bg-canvas border border-line text-muted">{p}</span>
                          ))}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 w-full sm:w-auto shrink-0 border-t sm:border-t-0 pt-3 sm:pt-0 border-line">
                      <Button
                        variant="secondary"
                        className="text-xs py-1.5 flex-1 sm:flex-initial"
                        onClick={() => setSelectedMatch({ ...item, campaignName: campaigns.find(c => c._id === selectedCampaignId)?.name })}
                      >
                        <SlidersHorizontal size={13} /> View Analysis
                      </Button>
                      <Button
                        variant="primary"
                        className="text-xs py-1.5 flex-1 sm:flex-initial"
                        onClick={() => setSelectedOfferCreator(item.creator)}
                      >
                        <Send size={13} /> Negotiate Offer
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
      {activeTab === 'offers' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-semibold tracking-tight">Campaign Invitations & Active Offers</h2>
            <Button variant="secondary" onClick={fetchOffers} loading={offersLoading}>
              <RefreshCw size={13} /> Refresh List
            </Button>
          </div>
          {offersLoading ? (
            <Loading />
          ) : offers.length === 0 ? (
            <div className="card p-12 text-center space-y-2">
              <p className="text-sm font-semibold">No active campaign invitations or offers.</p>
              <p className="text-xs text-muted">Send invitations or offers from the Discovery Grid tab.</p>
            </div>
          ) : (
            <div className="card overflow-hidden border border-line">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-canvas border-b border-line text-muted uppercase tracking-wider font-semibold">
                    <tr>
                      <th className="p-3.5">Campaign</th>
                      <th className="p-3.5">Creator</th>
                      <th className="p-3.5">Status</th>
                      <th className="p-3.5">Sent Date</th>
                      <th className="p-3.5 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-line">
                    {offers.map((inv) => (
                      <tr key={inv._id} className="hover:bg-canvas/50">
                        <td className="p-3.5 font-medium text-ink">
                          {inv.campaignId?.name || inv.campaignId?.title || 'Campaign'}
                        </td>
                        <td className="p-3.5 text-muted">
                          {inv.creatorId?.displayName || 'Creator'} (@{inv.creatorId?.username || 'user'})
                        </td>
                        <td className="p-3.5">
                          <Badge>{inv.status || 'Pending'}</Badge>
                        </td>
                        <td className="p-3.5 text-muted">
                          {new Date(inv.createdAt).toLocaleDateString()}
                        </td>
                        <td className="p-3.5 text-right space-x-2">
                          {inv.status === 'Pending' && (
                            <Button
                              variant="secondary"
                              className="text-[11px] py-1 px-2.5"
                              onClick={() => handleAcceptOffer(inv._id)}
                            >
                              <Check size={12} /> Accept & Assign
                            </Button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}
      {selectedMatch && (
        <MatchScoreVisualizer
          match={selectedMatch}
          campaignName={selectedMatch.campaignName}
          onClose={() => setSelectedMatch(null)}
          onSendOffer={(creator) => {
            setSelectedMatch(null);
            setSelectedOfferCreator(creator);
          }}
          onInvite={(creator) => {
            handleInviteCreator(creator);
            setSelectedMatch(null);
          }}
        />
      )}
      {selectedOfferCreator && (
        <OfferNegotiationModal
          creator={selectedOfferCreator}
          campaigns={campaigns}
          onClose={() => setSelectedOfferCreator(null)}
          onSuccess={() => {
            fetchDiscovery();
            if (activeTab === 'offers') fetchOffers();
          }}
        />
      )}
    </div>
  );
}
