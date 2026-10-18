import crypto from 'node:crypto';
import { SocialChannel } from './socialChannel.model.js';
import { encryptToken, decryptToken } from './social.crypto.js';
import { Content } from '../content/content.model.js';
import { Publishing } from '../publishing/publishing.model.js';
import { ApiError } from '../../../utils/http.js';

const GOOGLE_API_KEY = process.env.GOOGLE_API_KEY || process.env.YOUTUBE_API_KEY || '';

function generateMockContent(platform, handle) {
  const now = Date.now();
  const day = 24 * 60 * 60 * 1000;

  if (platform === 'youtube') {
    return [
      {
        externalId: `yt_${crypto.randomBytes(6).toString('hex')}`,
        title: 'I Built a Full-Stack SaaS in 24 Hours (Step-by-Step)',
        url: 'https://youtube.com/watch?v=dQw4w9WgXcQ',
        thumbnailUrl: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=800&auto=format&fit=crop&q=80',
        views: 142500,
        likes: 12400,
        comments: 1084,
        shares: 950,
        engagementRate: 9.4,
        publishedAt: new Date(now - 2 * day),
        platform: 'youtube',
      },
      {
        externalId: `yt_${crypto.randomBytes(6).toString('hex')}`,
        title: 'Top 5 Creator Economy Business Models for 2026',
        url: 'https://youtube.com/watch?v=dQw4w9WgXcQ',
        thumbnailUrl: 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=800&auto=format&fit=crop&q=80',
        views: 89300,
        likes: 7200,
        comments: 640,
        shares: 410,
        engagementRate: 8.7,
        publishedAt: new Date(now - 7 * day),
        platform: 'youtube',
      },
      {
        externalId: `yt_${crypto.randomBytes(6).toString('hex')}`,
        title: 'My Entire Video Editing & Automation Workflow',
        url: 'https://youtube.com/watch?v=dQw4w9WgXcQ',
        thumbnailUrl: 'https://images.unsplash.com/photo-1574717024653-61fd2cf4d44d?w=800&auto=format&fit=crop&q=80',
        views: 64200,
        likes: 5890,
        comments: 490,
        shares: 320,
        engagementRate: 9.9,
        publishedAt: new Date(now - 14 * day),
        platform: 'youtube',
      },
    ];
  }

  return [
    {
      externalId: `ig_${crypto.randomBytes(6).toString('hex')}`,
      title: `Behind the scenes shoot with our production crew! @${handle}`,
      url: `https://instagram.com/p/${crypto.randomBytes(5).toString('hex')}`,
      thumbnailUrl: 'https://images.unsplash.com/photo-1516035069371-29a1b244cc32?w=800&auto=format&fit=crop&q=80',
      views: 78500,
      likes: 9140,
      comments: 520,
      shares: 1240,
      engagementRate: 12.3,
      publishedAt: new Date(now - 1 * day),
      platform: 'instagram',
    },
    {
      externalId: `ig_${crypto.randomBytes(6).toString('hex')}`,
      title: '5 Design Rules Every Creator Needs to Know ✨',
      url: `https://instagram.com/p/${crypto.randomBytes(5).toString('hex')}`,
      thumbnailUrl: 'https://images.unsplash.com/photo-1507238691740-187a5b1d37b8?w=800&auto=format&fit=crop&q=80',
      views: 52400,
      likes: 6300,
      comments: 310,
      shares: 890,
      engagementRate: 11.8,
      publishedAt: new Date(now - 5 * day),
      platform: 'instagram',
    },
  ];
}

export async function listChannels(req) {
  const channels = await SocialChannel.find({
    organizationId: req.organizationId,
    isActive: true,
  })
    .sort({ createdAt: -1 })
    .lean();

  return channels.map((c) => ({
    ...c,
    hasValidToken: Boolean(c.encryptedAccessToken),
  }));
}

export async function getChannelById(req, channelId) {
  const channel = await SocialChannel.findOne({
    _id: channelId,
    organizationId: req.organizationId,
    isActive: true,
  }).lean();

  if (!channel) {
    throw new ApiError(404, 'Social channel not found.');
  }

  return channel;
}

export async function connectChannel(req, payload) {
  const {
    platform,
    accountHandle,
    channelTitle,
    channelUrl,
    profilePicture,
    accessToken,
    refreshToken,
    platformAccountId,
  } = payload;

  if (!platform || !accountHandle) {
    throw new ApiError(400, 'Platform and account handle are required.');
  }

  const cleanHandle = accountHandle.replace(/^@/, '').trim();
  const accountId = platformAccountId || `acc_${platform}_${cleanHandle}`;

  const existing = await SocialChannel.findOne({
    organizationId: req.organizationId,
    platform,
    platformAccountId: accountId,
  });

  const { encrypted: encAccess, iv, authTag } = encryptToken(accessToken || `sim_tok_${cleanHandle}`);
  const { encrypted: encRefresh } = encryptToken(refreshToken || '');

  const defaultTitle = channelTitle || `${cleanHandle} Official`;
  const defaultUrl = channelUrl || (platform === 'youtube'
    ? `https://youtube.com/@${cleanHandle}`
    : `https://instagram.com/${cleanHandle}`);

  const defaultAvatar = profilePicture || (platform === 'youtube'
    ? 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=200&auto=format&fit=crop&q=80'
    : 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=200&auto=format&fit=crop&q=80');

  const initialStats = platform === 'youtube'
    ? {
        subscriberCount: 128400,
        followerCount: 128400,
        totalViews: 3840000,
        videoCount: 84,
        mediaCount: 84,
        averageEngagementRate: 9.2,
      }
    : {
        subscriberCount: 94600,
        followerCount: 94600,
        totalViews: 1980000,
        videoCount: 142,
        mediaCount: 142,
        averageEngagementRate: 11.4,
      };

  const initialContent = generateMockContent(platform, cleanHandle);

  if (existing) {
    existing.accountHandle = cleanHandle;
    existing.channelTitle = defaultTitle;
    existing.channelUrl = defaultUrl;
    existing.profilePicture = defaultAvatar;
    existing.encryptedAccessToken = encAccess;
    existing.encryptedRefreshToken = encRefresh;
    existing.iv = iv;
    existing.authTag = authTag;
    existing.isActive = true;
    existing.lastSyncedAt = new Date();
    existing.isSimulated = !accessToken;
    existing.syncStatus = 'idle';
    if (!existing.channelStats?.totalViews) {
      existing.channelStats = initialStats;
    }
    if (!existing.recentContent?.length) {
      existing.recentContent = initialContent;
    }
    await existing.save();
    return existing;
  }

  const channel = await SocialChannel.create({
    organizationId: req.organizationId,
    userId: req.user._id,
    platform,
    platformAccountId: accountId,
    accountHandle: cleanHandle,
    channelTitle: defaultTitle,
    channelUrl: defaultUrl,
    profilePicture: defaultAvatar,
    encryptedAccessToken: encAccess,
    encryptedRefreshToken: encRefresh,
    tokenExpiresAt: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000),
    iv,
    authTag,
    channelStats: initialStats,
    recentContent: initialContent,
    lastSyncedAt: new Date(),
    isSimulated: !accessToken,
    syncStatus: 'idle',
    isActive: true,
  });

  return channel;
}

export async function syncChannel(req, channelId) {
  const channel = await SocialChannel.findOne({
    _id: channelId,
    organizationId: req.organizationId,
    isActive: true,
  });

  if (!channel) {
    throw new ApiError(404, 'Social channel not found.');
  }

  channel.syncStatus = 'syncing';
  await channel.save();

  try {
    const rawToken = decryptToken(channel.encryptedAccessToken, channel.iv, channel.authTag);
    const authHeaders = rawToken && !channel.isSimulated ? { Authorization: `Bearer ${rawToken}` } : {};

    if (GOOGLE_API_KEY && channel.platform === 'youtube' && !channel.isSimulated) {
      const apiUrl = `https://www.googleapis.com/youtube/v3/channels?part=snippet,statistics&forHandle=${encodeURIComponent(channel.accountHandle)}&key=${GOOGLE_API_KEY}`;
      const response = await fetch(apiUrl, { headers: authHeaders });
      if (response.ok) {
        const data = await response.json();
        const item = data.items?.[0];
        if (item) {
          channel.channelTitle = item.snippet?.title || channel.channelTitle;
          channel.profilePicture = item.snippet?.thumbnails?.high?.url || channel.profilePicture;
          channel.channelStats.subscriberCount = Number(item.statistics?.subscriberCount || channel.channelStats.subscriberCount);
          channel.channelStats.followerCount = channel.channelStats.subscriberCount;
          channel.channelStats.totalViews = Number(item.statistics?.viewCount || channel.channelStats.totalViews);
          channel.channelStats.videoCount = Number(item.statistics?.videoCount || channel.channelStats.videoCount);
          channel.channelStats.mediaCount = channel.channelStats.videoCount;
        }
      }
    } else {
      const growthFactor = Math.floor(Math.random() * 450) + 50;
      const viewGrowth = Math.floor(Math.random() * 4800) + 1200;

      channel.channelStats.subscriberCount = (channel.channelStats.subscriberCount || 100000) + growthFactor;
      channel.channelStats.followerCount = channel.channelStats.subscriberCount;
      channel.channelStats.totalViews = (channel.channelStats.totalViews || 2000000) + viewGrowth;

      const randomRate = (8.5 + Math.random() * 3.5).toFixed(1);
      channel.channelStats.averageEngagementRate = Number(randomRate);

      if (!channel.recentContent || channel.recentContent.length === 0) {
        channel.recentContent = generateMockContent(channel.platform, channel.accountHandle);
      } else {
        channel.recentContent[0].views += Math.floor(Math.random() * 800) + 200;
        channel.recentContent[0].likes += Math.floor(Math.random() * 90) + 15;
      }
    }

    channel.lastSyncedAt = new Date();
    channel.syncStatus = 'idle';
    channel.syncError = null;
    await channel.save();

    const io = req.app.get('io');
    if (io) {
      io.to(`org:${req.organizationId}`).emit('social-channel-synced', {
        channelId: channel._id,
        platform: channel.platform,
        accountHandle: channel.accountHandle,
        channelStats: channel.channelStats,
      });
    }

    return channel;
  } catch (err) {
    channel.syncStatus = 'error';
    channel.syncError = err.message || 'Sync failed';
    await channel.save();
    throw err;
  }
}

export async function syncAllChannels(req) {
  const channels = await SocialChannel.find({
    organizationId: req.organizationId,
    isActive: true,
  });

  const results = [];
  for (const ch of channels) {
    try {
      const updated = await syncChannel(req, ch._id);
      results.push({ channelId: ch._id, success: true, stats: updated.channelStats });
    } catch (err) {
      results.push({ channelId: ch._id, success: false, error: err.message });
    }
  }

  return results;
}

export async function disconnectChannel(req, channelId) {
  const channel = await SocialChannel.findOne({
    _id: channelId,
    organizationId: req.organizationId,
  });

  if (!channel) {
    throw new ApiError(404, 'Social channel not found.');
  }

  channel.isActive = false;
  await channel.save();
  return { success: true, message: 'Channel disconnected successfully.' };
}

export async function publishPost(req, payload) {
  const { channelId, title, description, platform, mediaUrl, contentId, scheduledDate } = payload;

  const channel = await SocialChannel.findOne({
    _id: channelId,
    organizationId: req.organizationId,
    isActive: true,
  });

  if (!channel) {
    throw new ApiError(404, 'Connected social channel not found.');
  }

  const generatedId = crypto.randomBytes(6).toString('hex');
  const targetPlatform = platform || channel.platform;
  const postUrl = targetPlatform === 'youtube'
    ? `https://youtube.com/watch?v=pub_${generatedId}`
    : `https://instagram.com/p/pub_${generatedId}`;

  const newPost = {
    externalId: `pub_${generatedId}`,
    title: title || 'Untitled Broadcast',
    url: postUrl,
    thumbnailUrl: mediaUrl || 'https://images.unsplash.com/photo-1579202673506-ca3ce28943ef?w=800&auto=format&fit=crop&q=80',
    views: 1,
    likes: 0,
    comments: 0,
    shares: 0,
    engagementRate: 0,
    publishedAt: scheduledDate ? new Date(scheduledDate) : new Date(),
    platform: targetPlatform,
  };

  channel.recentContent.unshift(newPost);
  channel.channelStats.videoCount = (channel.channelStats.videoCount || 0) + 1;
  channel.channelStats.mediaCount = channel.channelStats.videoCount;
  await channel.save();

  if (contentId) {
    await Content.updateOne(
      { _id: contentId },
      {
        $set: {
          status: 'Published',
          publishDate: new Date(),
          publishedAt: new Date(),
          publishedUrl: postUrl,
        },
      },
    );
  }

  const publishingRecord = await Publishing.create({
    owner: req.organization?.ownerId || req.user._id,
    organizationId: req.organizationId,
    content: contentId || null,
    contentId: contentId || null,
    platform: targetPlatform,
    publishDate: new Date(),
    publishedUrl: postUrl,
    status: 'Published',
    notes: description || 'Auto-published via CreatorOS Social Studio',
    publisherId: req.user._id,
  });

  const io = req.app.get('io');
  if (io) {
    io.to(`org:${req.organizationId}`).emit('social-post-published', {
      channelId: channel._id,
      post: newPost,
      publishingRecordId: publishingRecord._id,
    });
  }

  return {
    post: newPost,
    publishingRecord,
    channel,
  };
}

export async function getSocialAggregates(req) {
  const channels = await SocialChannel.find({
    organizationId: req.organizationId,
    isActive: true,
  }).lean();

  let totalAudience = 0;
  let totalViews = 0;
  let totalVideos = 0;
  let weightedEngageSum = 0;
  const recentContentPool = [];

  for (const ch of channels) {
    const stats = ch.channelStats || {};
    const audience = stats.subscriberCount || stats.followerCount || 0;
    totalAudience += audience;
    totalViews += stats.totalViews || 0;
    totalVideos += stats.videoCount || stats.mediaCount || 0;
    weightedEngageSum += (stats.averageEngagementRate || 0) * (audience || 1);

    if (Array.isArray(ch.recentContent)) {
      for (const item of ch.recentContent) {
        recentContentPool.push({
          ...item,
          channelTitle: ch.channelTitle,
          accountHandle: ch.accountHandle,
          platform: ch.platform,
        });
      }
    }
  }

  const averageEngagementRate = totalAudience > 0
    ? Number((weightedEngageSum / totalAudience).toFixed(2))
    : channels.length > 0
      ? 9.5
      : 0;

  recentContentPool.sort((a, b) => new Date(b.publishedAt) - new Date(a.publishedAt));

  return {
    connectedChannelsCount: channels.length,
    totalAudience,
    totalViews,
    totalVideos,
    averageEngagementRate,
    channels: channels.map((c) => ({
      _id: c._id,
      platform: c.platform,
      accountHandle: c.accountHandle,
      channelTitle: c.channelTitle,
      profilePicture: c.profilePicture,
      stats: c.channelStats,
      lastSyncedAt: c.lastSyncedAt,
      isSimulated: c.isSimulated,
      syncStatus: c.syncStatus,
    })),
    recentContent: recentContentPool.slice(0, 10),
  };
}
