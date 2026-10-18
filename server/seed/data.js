import bcrypt from 'bcryptjs';
import { User } from '../models/User.js';
import { models, Profile, Analytics, Activity } from '../models/resources.js';
import { invoiceTotals } from '../services/resourceService.js';
import { env } from '../config/env.js';
import mongoose from 'mongoose';
import { assertSeedAllowed } from '../config/validate.js';
const daysAgo = (n) => {
  const date = new Date();
  date.setDate(date.getDate() - n);
  date.setHours(12, 0, 0, 0);
  return date;
};
const brandNames = [
  'Notion',
  'Sony',
  'Adobe',
  'Nike',
  'Skillshare',
  'Canon',
  'Figma',
  'Samsung',
  'Squarespace',
  'Patagonia',
  'Logitech',
  'Audible',
  'Moleskine',
  'Asus',
  'Epidemic Sound',
  'Fujifilm',
  'Anker',
  'GoPro',
  'Webflow',
  'Allbirds',
  'Dyson',
  'DJI',
  'The North Face',
  'Coursera',
  'Headspace',
  'Canva',
  'Sennheiser',
];
const titles = [
  'A slower morning, a better creative day',
  'My everyday creator desk setup',
  'Behind the edit: a week in the studio',
  '5 tools that changed my creative workflow',
  'The art of showing up consistently',
  'A little reset for the new month',
  'How I plan a month of content',
  'Small moments, cinematic stories',
  'What is in my camera bag?',
  'Building a creative routine that lasts',
  'A weekend away from the noise',
  'My honest guide to starting out',
  'Making space for your next big idea',
  'An intentional workspace tour',
  'One lens, three very different stories',
  'From a blank page to a finished film',
  'Things I wish I knew a year ago',
  'The Sunday studio journal',
  'Finding inspiration in the everyday',
  'A day in the life of an independent creator',
];
const photos = ['lifestyle', 'planning', 'camera', 'workspace', 'nature', 'studio'];
const image = (i) => `${env.client}/images/backgrounds/${photos[i % photos.length]}.webp`;
export async function seedDatabase() {
  assertSeedAllowed(env.production, mongoose.connection.name);
  if (await User.exists({ email: 'creator@creatoros.demo' })) return;
  const password = await bcrypt.hash('Creator@123', 12);
  const names = [
    'Aarav Sharma',
    'Priya Sharma',
    'Kabir Verma',
    'Aarav Patel',
    'Ananya Iyer',
    'Rohan Mehta',
    'Diya Sen',
    'Arjun Rao',
    'Sneha Kulkarni',
  ];
  for (let u = 0; u < names.length; u++) {
    const user = await User.create({
      name: names[u],
      email: u === 0 ? 'creator@creatoros.demo' : `creator${u + 1}@creatoros.demo`,
      phone: `+91987000000${u}`,
      password,
      emailVerified: true,
    });
    const owner = user._id;
    await Profile.create({
      owner,
      bio: 'Finding the extraordinary in the everyday. Creative storytelling, thoughtful tools, and a little life in between.',
      username: names[u].toLowerCase().replaceAll(' ', ''),
      niche: 'Lifestyle & creativity',
      location: 'Mumbai, India',
      currency: 'INR',
      socials: { Instagram: 'https://instagram.com', YouTube: 'https://youtube.com' },
    });
    const brands = await models.brands.insertMany(
      brandNames.slice(u === 0 ? 0 : u * 2, u === 0 ? 9 : u * 2 + 3).map((title, i) => ({
        owner,
        title,
        website: `https://${title.toLowerCase().replaceAll(' ', '')}.com`,
        industry: ['Technology', 'Lifestyle', 'Creative tools'][i % 3],
        contactPerson: ['Vikram Malhotra', 'Neha Singhania', 'Riya Kapoor'][i % 3],
        contactEmail: `partnerships@${title.toLowerCase().replaceAll(' ', '')}.example`,
        notes: 'Interested in authentic storytelling and long-term creative partnerships.',
      })),
    );
    const campaigns = await models.campaigns.insertMany(
      Array.from({ length: u === 0 ? 6 : 3 }, (_, i) => ({
        owner,
        title: `${brands[i % brands.length].title} · ${['Made for creating', 'Everyday essentials', 'Create your own story', 'A fresh perspective', 'Studio sessions', 'Find your rhythm'][i]}`,
        brand: brands[i % brands.length]._id,
        description:
          'An editorial series bringing thoughtful products into everyday creative life.',
        status: ['Active', 'Active', 'Planned', 'Completed', 'Active', 'Paused'][i % 6],
        startDate: daysAgo(12 + i * 7),
        endDate: daysAgo(-5 - i * 3),
        budget: 75000 + i * 12000,
        amount: 45000 + i * 10000,
        platform: ['Instagram', 'YouTube', 'LinkedIn'][i % 3],
        deliverables: '1 main video\n2 social posts\n3 story frames',
        progress: [65, 40, 15, 100, 80, 30][i % 6],
      })),
    );
    await models.deals.insertMany(
      Array.from({ length: u === 0 ? 8 : 4 }, (_, i) => ({
        owner,
        title: `${brands[i % brands.length].title} ${['studio partnership', 'creative collaboration', 'monthly feature', 'ambassador series'][i % 4]}`,
        brand: brands[i % brands.length]._id,
        amount: 35000 + i * 12000,
        status: ['Active', 'Active', 'Negotiating', 'Lead', 'Completed', 'Approved'][i % 6],
        paymentStatus: ['Pending', 'Partial', 'Paid'][i % 3],
        startDate: daysAgo(10),
        deadline: daysAgo(-4 - i * 2),
        paymentDueDate: daysAgo(-15 - i),
        deliverables: '1 dedicated video, 2 Instagram reels, 3 stories',
      })),
    );
    const content = await models.content.insertMany(
      Array.from({ length: u === 0 ? 32 : 12 }, (_, i) => ({
        owner,
        title: titles[(i + u * 2) % titles.length] + (i >= titles.length ? ' · Part 2' : ''),
        description:
          'A thoughtful look at the creative process, with practical takeaways for your everyday.',
        platform: ['Instagram', 'YouTube', 'LinkedIn', 'Instagram', 'TikTok', 'X'][i % 6],
        type: ['Reel', 'Video', 'Article', 'Post', 'Short', 'Post'][i % 6],
        status: i < 4 ? 'Scheduled' : i < 7 ? 'Draft' : i < 9 ? 'Idea' : 'Published',
        publishDate: i < 9 ? daysAgo(-i - 1) : daysAgo((i - 8) * 3),
        scheduledTime: ['09:00', '12:30', '18:00'][i % 3],
        category: 'Creative life',
        hashtags: '#creativelife #behindthescenes',
        thumbnail: image(i),
        campaign: campaigns[i % campaigns.length]._id,
        views: i < 9 ? 0 : 12400 + i * 1371,
        likes: i < 9 ? 0 : 670 + i * 73,
        comments: i < 9 ? 0 : 40 + i * 7,
        shares: i < 9 ? 0 : 27 + i * 4,
        saves: i < 9 ? 0 : 50 + i * 6,
        createdAt: daysAgo(i),
      })),
    );
    await models.tasks.insertMany(
      Array.from({ length: u === 0 ? 14 : 9 }, (_, i) => ({
        owner,
        title: [
          'Send first cut to ' + brands[i % brands.length].title,
          'Plan next week’s content',
          'Review the creative brief',
          'Finalize the campaign moodboard',
          'Edit the studio tour reel',
          'Follow up on the invoice',
          'Film the product close-ups',
          'Schedule the newsletter',
          'Send monthly analytics report',
          'Prepare the shot list',
          'Review contract deliverables',
          'Back up this week’s footage',
          'Write the video description',
          'Update the media kit',
        ][i],
        status: ['Todo', 'In Progress', 'Todo', 'Completed'][i % 4],
        priority: ['High', 'Medium', 'Low', 'Urgent'][i % 4],
        dueDate: daysAgo(-i),
        category: 'Creative work',
        campaign: campaigns[i % campaigns.length]._id,
        brand: campaigns[i % campaigns.length].brand,
        content: content[i % content.length]._id,
      })),
    );
    await models.revenue.insertMany(
      Array.from({ length: u === 0 ? 40 : 10 }, (_, i) => ({
        owner,
        title: [
          `${brands.find((brand) => brand._id.equals(campaigns[i % campaigns.length].brand)).title} partnership`,
          'YouTube creator earnings',
          'Affiliate commissions',
          'Creative consultation',
        ][i % 4],
        category: ['Sponsorship', 'Ad Revenue', 'Affiliate', 'Consulting'][i % 4],
        amount: [35000, 18400, 8200, 12000][i % 4] + i * 350,
        date: daysAgo(i * 7),
        platform: ['Instagram', 'YouTube', 'Instagram', 'LinkedIn'][i % 4],
        ...(i % 4 === 0
          ? {
              brand: campaigns[i % campaigns.length].brand,
              campaign: campaigns[i % campaigns.length]._id,
            }
          : {}),
        status: i % 9 === 0 ? 'Pending' : 'Paid',
        paymentMethod: 'Bank transfer',
      })),
    );
    await models.expenses.insertMany(
      Array.from({ length: u === 0 ? 20 : 6 }, (_, i) => ({
        owner,
        title: [
          'Adobe Creative Cloud',
          'Studio rental',
          'Camera equipment',
          'Travel to shoot',
          'Music licensing',
          'Freelance video editor',
        ][i % 6],
        category: ['Software', 'Studio', 'Equipment', 'Travel', 'Subscription', 'Contractors'][
          i % 6
        ],
        amount: [4500, 8000, 15000, 3500, 1500, 10000][i % 6],
        date: daysAgo(i * 9),
      })),
    );
    await models.invoices.insertMany(
      Array.from({ length: u === 0 ? 8 : 4 }, (_, i) => {
        const data = {
          owner,
          title: `${brands[i % brands.length].title} creative services`,
          number: `INV-${new Date().getFullYear()}-${u + 1}${String(i + 1).padStart(3, '0')}`,
          brand: brands[i % brands.length]._id,
          clientEmail: brands[i % brands.length].contactEmail,
          date: daysAgo(i * 7),
          dueDate: daysAgo(i * 7 - 14),
          status: ['Sent', 'Paid', 'Draft', 'Overdue'][i % 4],
          items: [
            {
              description: 'Content creation and campaign delivery',
              quantity: 1,
              rate: 35000 + i * 5000,
            },
          ],
          tax: 18,
          discount: 0,
        };
        return { ...data, ...invoiceTotals(data) };
      }),
    );
    const analytics = [];
    for (let week = 0; week < 53; week++)
      for (let p = 0; p < 4; p++) {
        analytics.push({
          owner,
          date: daysAgo(week * 7),
          platform: ['Instagram', 'YouTube', 'LinkedIn', 'TikTok'][p],
          followers: Math.round([84500, 43200, 12700, 28400][p] * (1 - week * 0.009)),
          views: Math.round(30000 + (53 - week) * 500 + p * 1200),
          likes: 1700 + (53 - week) * 31,
          comments: 130 + week * 2,
          shares: 90 + p * 8,
          saves: 160 + p * 14,
          impressions: 70000 + week * 800,
          reach: 43000 + week * 100,
        });
      }
    await Analytics.insertMany(analytics);
    await models.notifications.insertMany(
      Array.from({ length: u === 0 ? 8 : 6 }, (_, i) => ({
        owner,
        title: [
          'Your creative week is ready',
          'A campaign deadline is coming up',
          'An invoice needs your attention',
          'Time to review your content plan',
          'New month, new possibilities',
          'Your next deliverable is due soon',
          'Your workspace is all set',
          'Make room for your best work',
        ][i],
        description: [
          'Everything you need for a focused, productive week is right here.',
          'Check your calendar and keep your next milestone on track.',
          'Review your invoices to keep your business moving.',
        ][i % 3],
        category: ['System notification', 'Campaign deadline', 'Payment due'][i % 3],
        read: i > 2,
      })),
    );
    await Activity.insertMany([
      { owner, title: 'Welcome to your CreatorOS workspace', resource: 'dashboard' },
      { owner, title: 'Your content calendar is ready', resource: 'content' },
      { owner, title: 'Campaign progress updated', resource: 'campaigns' },
    ]);
  }
  await User.create({
    name: 'Workspace Admin',
    email: 'admin@creatoros.demo',
    password: await bcrypt.hash('Admin@123', 12),
    role: 'admin',
    emailVerified: true,
  });
}