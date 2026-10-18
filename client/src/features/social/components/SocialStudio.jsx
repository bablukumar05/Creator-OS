import { useState, useEffect } from 'react';
import {
  RefreshCw,
  Plus,
  ExternalLink,
  Share2,
  Eye,
  ThumbsUp,
  MessageSquare,
  TrendingUp,
  Users,
  Clapperboard,
  Sparkles,
  Trash2,
  CheckCircle2,
  Radio,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { socialApi } from '../../../services/api';
import { Button, Badge, Loading, Modal, StatCard } from '../../../components/ui';
import { number, date } from '../../../utils/format';

export function SocialStudio() {
  const [channels, setChannels] = useState([]);
  const [stats, setStats] = useState(null);
  const [recentContent, setRecentContent] = useState([]);
  const [loading, setLoading] = useState(true);
  const [syncingId, setSyncingId] = useState(null);
  const [showConnectModal, setShowConnectModal] = useState(false);
  const [showPublishModal, setShowPublishModal] = useState(false);
  const [actionBusy, setActionBusy] = useState(false);
  const [platformFilter, setPlatformFilter] = useState('all');

  const [connectForm, setConnectForm] = useState({
    platform: 'youtube',
    accountHandle: '',
    channelTitle: '',
    channelUrl: '',
    accessToken: '',
  });

  const [publishForm, setPublishForm] = useState({
    channelId: '',
    title: '',
    description: '',
    mediaUrl: '',
  });

  useEffect(() => {
    fetchSocialData();
  }, []);

  const fetchSocialData = async () => {
    try {
      setLoading(true);
      const [channelList, aggregateStats] = await Promise.all([
        socialApi.list(),
        socialApi.getStats(),
      ]);
      setChannels(channelList.items || []);
      setStats(aggregateStats || null);
      setRecentContent(aggregateStats?.recentContent || []);
      if (channelList.items?.length > 0 && !publishForm.channelId) {
        setPublishForm((prev) => ({ ...prev, channelId: channelList.items[0]._id }));
      }
    } catch {
      toast.error('Failed to load social channel metrics.');
    } finally {
      setLoading(false);
    }
  };

  const handleSyncChannel = async (id, title) => {
    try {
      setSyncingId(id);
      await socialApi.sync(id);
      toast.success(`${title || 'Channel'} metrics synced successfully!`);
      await fetchSocialData();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Sync failed.');
    } finally {
      setSyncingId(null);
    }
  };

  const handleSyncAll = async () => {
    try {
      setSyncingId('all');
      await socialApi.syncAll();
      toast.success('All connected social channels refreshed!');
      await fetchSocialData();
    } catch {
      toast.error('Failed to refresh channels.');
    } finally {
      setSyncingId(null);
    }
  };

  const handleDisconnect = async (id, title) => {
    if (!window.confirm(`Disconnect ${title}? Real-time metrics sync will be stopped.`)) return;
    try {
      setActionBusy(true);
      await socialApi.disconnect(id);
      toast.success('Channel disconnected.');
      await fetchSocialData();
    } catch {
      toast.error('Failed to disconnect channel.');
    } finally {
      setActionBusy(false);
    }
  };

  const handleConnectSubmit = async (e) => {
    e.preventDefault();
    if (!connectForm.accountHandle) {
      toast.error('Please enter an account handle or channel username.');
      return;
    }
    try {
      setActionBusy(true);
      await socialApi.connect(connectForm);
      toast.success(`Connected ${connectForm.platform.toUpperCase()} channel successfully!`);
      setShowConnectModal(false);
      setConnectForm({
        platform: 'youtube',
        accountHandle: '',
        channelTitle: '',
        channelUrl: '',
        accessToken: '',
      });
      await fetchSocialData();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to connect channel.');
    } finally {
      setActionBusy(false);
    }
  };

  const handlePublishSubmit = async (e) => {
    e.preventDefault();
    if (!publishForm.title) {
      toast.error('Title is required for social publishing.');
      return;
    }
    try {
      setActionBusy(true);
      const res = await socialApi.publish(publishForm);
      toast.success(`Broadcasted live to ${res.post.platform}!`);
      setShowPublishModal(false);
      setPublishForm({
        channelId: channels[0]?._id || '',
        title: '',
        description: '',
        mediaUrl: '',
      });
      await fetchSocialData();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to publish post.');
    } finally {
      setActionBusy(false);
    }
  };

  const filteredContent = recentContent.filter((item) =>
    platformFilter === 'all' ? true : item.platform === platformFilter,
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-1 rounded-md bg-[#2b5341] text-white">
              <Radio size={14} className="animate-pulse" />
            </span>
            <span className="text-[11px] font-semibold uppercase tracking-wider text-[#2b5341]">
              Level 2 Real Social Sync
            </span>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-ink mt-1">
            Social Media Studio & Audience Sync
          </h1>
          <p className="text-xs text-muted max-w-2xl">
            Live integration with YouTube Data API and Instagram Graph API. Automatic audience metric synchronization, engagement tracking, and 1-click broadcast publishing.
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <Button
            variant="secondary"
            className="text-xs"
            onClick={handleSyncAll}
            loading={syncingId === 'all'}
            disabled={channels.length === 0}
          >
            <RefreshCw size={13} className={syncingId === 'all' ? 'animate-spin' : ''} />
            Sync All Channels
          </Button>
          <Button
            variant="secondary"
            className="text-xs"
            onClick={() => setShowPublishModal(true)}
            disabled={channels.length === 0}
          >
            <Share2 size={13} /> Broadcast Post
          </Button>
          <Button variant="primary" className="text-xs" onClick={() => setShowConnectModal(true)}>
            <Plus size={14} /> Connect Channel
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <StatCard
          label="Total Audience"
          value={number(stats?.totalAudience || 0)}
          icon={Users}
          detail="Subscribers & Followers"
        />
        <StatCard
          label="Total Video Views"
          value={number(stats?.totalViews || 0)}
          icon={Eye}
          detail="Lifetime synchronized views"
        />
        <StatCard
          label="Avg Engagement Rate"
          value={`${stats?.averageEngagementRate || 0}%`}
          icon={TrendingUp}
          detail="Likes & Comments ratio"
        />
        <StatCard
          label="Published Assets"
          value={stats?.totalVideos || 0}
          icon={Clapperboard}
          detail="Across all linked channels"
        />
      </div>

      {loading ? (
        <Loading />
      ) : (
        <>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-xs font-semibold uppercase tracking-wider text-muted flex items-center gap-1.5">
                <Sparkles size={14} className="text-amber-500" /> Connected Social Channels ({channels.length})
              </h2>
            </div>

            {channels.length === 0 ? (
              <div className="card p-8 text-center space-y-3 border-dashed">
                <Radio size={32} className="mx-auto text-muted" />
                <h3 className="text-sm font-semibold text-ink">No Social Channels Connected</h3>
                <p className="text-xs text-muted max-w-sm mx-auto">
                  Connect your YouTube channel or Instagram profile to start syncing real subscribers, video views, and auto-publishing.
                </p>
                <Button variant="primary" className="text-xs" onClick={() => setShowConnectModal(true)}>
                  <Plus size={13} /> Link YouTube or Instagram
                </Button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                {channels.map((channel) => {
                  const isSyncing = syncingId === channel._id;
                  const statsData = channel.stats || {};
                  return (
                    <div
                      key={channel._id}
                      className="card p-4 sm:p-5 flex flex-col justify-between border hover:border-line transition-all relative overflow-hidden"
                    >
                      <div className="space-y-3">
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex items-center gap-3 min-w-0">
                            <img
                              src={channel.profilePicture}
                              alt={channel.channelTitle}
                              className="h-11 w-11 rounded-full object-cover border border-line shrink-0"
                            />
                            <div className="min-w-0">
                              <h3 className="font-semibold text-sm text-ink truncate">
                                {channel.channelTitle}
                              </h3>
                              <p className="text-xs text-muted truncate">
                                @{channel.accountHandle}
                              </p>
                            </div>
                          </div>
                          <Badge>
                            {channel.platform.toUpperCase()}
                          </Badge>
                        </div>

                        <div className="grid grid-cols-3 gap-2 p-2.5 rounded-xl bg-canvas text-center text-xs">
                          <div>
                            <p className="text-[10px] text-muted uppercase font-semibold">Audience</p>
                            <p className="font-bold text-ink mt-0.5">
                              {number(statsData.subscriberCount || statsData.followerCount || 0)}
                            </p>
                          </div>
                          <div>
                            <p className="text-[10px] text-muted uppercase font-semibold">Views</p>
                            <p className="font-bold text-ink mt-0.5">
                              {number(statsData.totalViews || 0)}
                            </p>
                          </div>
                          <div>
                            <p className="text-[10px] text-muted uppercase font-semibold">Engage</p>
                            <p className="font-bold text-emerald-700 mt-0.5">
                              {statsData.averageEngagementRate || 0}%
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center justify-between text-[11px] text-muted pt-1">
                          <span className="inline-flex items-center gap-1">
                            <CheckCircle2 size={12} className="text-emerald-600" />
                            {channel.isSimulated ? 'API Simulation' : 'Live OAuth Connected'}
                          </span>
                          <span>Synced: {date(channel.lastSyncedAt, 'dd MMM, HH:mm')}</span>
                        </div>
                      </div>

                      <div className="flex items-center justify-between gap-2 pt-4 mt-4 border-t border-line">
                        <div className="flex items-center gap-2">
                          <Button
                            variant="secondary"
                            className="text-xs py-1 px-2.5"
                            onClick={() => handleSyncChannel(channel._id, channel.channelTitle)}
                            loading={isSyncing}
                          >
                            <RefreshCw size={12} className={isSyncing ? 'animate-spin' : ''} />
                            Sync
                          </Button>
                          <a
                            href={channel.channelUrl || (channel.platform === 'youtube' ? `https://youtube.com/@${channel.accountHandle}` : `https://instagram.com/${channel.accountHandle}`)}
                            target="_blank"
                            rel="noreferrer"
                            className="btn btn-secondary text-xs py-1 px-2.5 inline-flex items-center gap-1"
                          >
                            <ExternalLink size={12} /> View
                          </a>
                        </div>
                        <button
                          type="button"
                          className="icon-btn text-muted hover:text-red-600"
                          title="Disconnect channel"
                          onClick={() => handleDisconnect(channel._id, channel.channelTitle)}
                          disabled={actionBusy}
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          <div className="space-y-4 pt-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-line pb-3">
              <div>
                <h2 className="text-sm font-semibold tracking-tight text-ink flex items-center gap-2">
                  <Clapperboard size={16} className="text-[#2b5341]" /> Synchronized Media & Performance Feed
                </h2>
                <p className="text-xs text-muted">
                  Live synchronized videos, reels, and posts with real-time views, likes, and comment metrics.
                </p>
              </div>

              <div className="flex items-center gap-1 rounded-lg border border-line p-0.5 bg-canvas self-start sm:self-auto text-xs">
                {['all', 'youtube', 'instagram'].map((plat) => (
                  <button
                    key={plat}
                    type="button"
                    onClick={() => setPlatformFilter(plat)}
                    className={`px-3 py-1 rounded-md font-medium capitalize transition-all ${
                      platformFilter === plat ? 'bg-white shadow-xs text-ink' : 'text-muted hover:text-ink'
                    }`}
                  >
                    {plat === 'all' ? 'All Platforms' : plat}
                  </button>
                ))}
              </div>
            </div>

            {filteredContent.length === 0 ? (
              <div className="card p-8 text-center text-xs text-muted">
                No synchronized media found for this filter. Click &ldquo;Sync All Channels&rdquo; to pull latest videos.
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredContent.map((media) => (
                  <div key={media.externalId || media._id} className="card overflow-hidden border hover:border-line transition-all flex flex-col justify-between">
                    <div>
                      <div className="relative aspect-video w-full bg-stone-100 overflow-hidden">
                        <img
                          src={media.thumbnailUrl || 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=800&auto=format&fit=crop&q=80'}
                          alt={media.title}
                          className="h-full w-full object-cover transition-transform duration-300 hover:scale-105"
                        />
                        <span className="absolute top-2.5 right-2.5 px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase bg-black/75 text-white backdrop-blur-xs">
                          {media.platform}
                        </span>
                        <span className="absolute bottom-2.5 left-2.5 px-2 py-0.5 rounded-md text-[10px] font-semibold bg-emerald-950/80 text-emerald-200 backdrop-blur-xs">
                          {number(media.views)} views
                        </span>
                      </div>

                      <div className="p-4 space-y-2">
                        <h3 className="font-semibold text-xs text-ink line-clamp-2 leading-relaxed">
                          {media.title}
                        </h3>
                        <p className="text-[11px] text-muted">
                          Published: {date(media.publishedAt, 'dd MMM yyyy')}
                        </p>
                      </div>
                    </div>

                    <div className="px-4 pb-4 pt-2 border-t border-line/60 flex items-center justify-between text-xs text-muted">
                      <div className="flex items-center gap-3">
                        <span className="flex items-center gap-1" title="Likes">
                          <ThumbsUp size={12} className="text-muted" /> {number(media.likes || 0)}
                        </span>
                        <span className="flex items-center gap-1" title="Comments">
                          <MessageSquare size={12} className="text-muted" /> {number(media.comments || 0)}
                        </span>
                        {media.engagementRate > 0 && (
                          <span className="font-semibold text-emerald-700 text-[10px]">
                            {media.engagementRate}% eng
                          </span>
                        )}
                      </div>
                      <a
                        href={media.url}
                        target="_blank"
                        rel="noreferrer"
                        className="text-xs text-accent hover:underline inline-flex items-center gap-0.5 font-medium"
                      >
                        Watch <ExternalLink size={11} />
                      </a>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </>
      )}

      {showConnectModal && (
        <Modal title="Connect Social Media Channel" onClose={() => setShowConnectModal(false)}>
          <form onSubmit={handleConnectSubmit} className="space-y-4">
            <div>
              <label className="label">Social Platform *</label>
              <select
                className="input"
                value={connectForm.platform}
                onChange={(e) => setConnectForm({ ...connectForm, platform: e.target.value })}
              >
                <option value="youtube">YouTube (Data API v3)</option>
                <option value="instagram">Instagram (Meta Graph API)</option>
                <option value="tiktok">TikTok Creator Portal</option>
                <option value="linkedin">LinkedIn Page</option>
              </select>
            </div>

            <div>
              <label className="label">Channel Username / Handle *</label>
              <div className="relative">
                <span className="absolute left-3 top-2.5 text-xs text-muted">@</span>
                <input
                  className="input pl-7"
                  placeholder="e.g. mkbhd or techcreator"
                  value={connectForm.accountHandle}
                  onChange={(e) => setConnectForm({ ...connectForm, accountHandle: e.target.value })}
                  required
                />
              </div>
              <p className="text-[10px] text-muted mt-1">
                Enter your exact YouTube handle or Instagram username to initiate sync.
              </p>
            </div>

            <div>
              <label className="label">Custom Display Title (Optional)</label>
              <input
                className="input"
                placeholder="e.g. Official Studio Channel"
                value={connectForm.channelTitle}
                onChange={(e) => setConnectForm({ ...connectForm, channelTitle: e.target.value })}
              />
            </div>

            <div>
              <label className="label">Channel Profile URL (Optional)</label>
              <input
                className="input"
                placeholder="https://youtube.com/@handle"
                value={connectForm.channelUrl}
                onChange={(e) => setConnectForm({ ...connectForm, channelUrl: e.target.value })}
              />
            </div>

            <div className="p-3 rounded-xl bg-canvas border border-line text-xs text-muted space-y-1">
              <p className="font-semibold text-ink flex items-center gap-1.5">
                <Sparkles size={13} className="text-amber-500" /> High-Fidelity Simulation Mode
              </p>
              <p className="text-[11px] leading-relaxed">
                If real API OAuth credentials are not set in environment, CreatorOS automatically simulates live subscriber graphs, views growth, and post metrics.
              </p>
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-line">
              <Button variant="secondary" type="button" onClick={() => setShowConnectModal(false)}>
                Cancel
              </Button>
              <Button variant="primary" type="submit" loading={actionBusy}>
                Connect Channel
              </Button>
            </div>
          </form>
        </Modal>
      )}

      {showPublishModal && (
        <Modal title="Broadcast Post to Connected Channel" onClose={() => setShowPublishModal(false)}>
          <form onSubmit={handlePublishSubmit} className="space-y-4">
            <div>
              <label className="label">Target Connected Channel *</label>
              <select
                className="input"
                value={publishForm.channelId}
                onChange={(e) => setPublishForm({ ...publishForm, channelId: e.target.value })}
                required
              >
                {channels.map((ch) => (
                  <option key={ch._id} value={ch._id}>
                    {ch.channelTitle} (@{ch.accountHandle}) - {ch.platform.toUpperCase()}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="label">Headline / Title *</label>
              <input
                className="input"
                placeholder="e.g. 5 Tech Gadgets That Blew My Mind in 2026"
                value={publishForm.title}
                onChange={(e) => setPublishForm({ ...publishForm, title: e.target.value })}
                required
              />
            </div>

            <div>
              <label className="label">Caption / Description</label>
              <textarea
                rows={3}
                className="input"
                placeholder="Write your video description, tags, and sponsor mentions..."
                value={publishForm.description}
                onChange={(e) => setPublishForm({ ...publishForm, description: e.target.value })}
              />
            </div>

            <div>
              <label className="label">Media / Thumbnail URL (Optional)</label>
              <input
                className="input"
                placeholder="https://images.unsplash.com/..."
                value={publishForm.mediaUrl}
                onChange={(e) => setPublishForm({ ...publishForm, mediaUrl: e.target.value })}
              />
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-line">
              <Button variant="secondary" type="button" onClick={() => setShowPublishModal(false)}>
                Cancel
              </Button>
              <Button variant="primary" type="submit" loading={actionBusy}>
                <Share2 size={13} /> Publish Now
              </Button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}
