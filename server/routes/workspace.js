import { Router } from 'express';
import { z } from 'zod';
import PDFDocument from 'pdfkit';
import multer from 'multer';
import { fileTypeFromBuffer } from 'file-type';
import { v2 as cloudinary } from 'cloudinary';
import { models, Profile, Analytics } from '../models/resources.js';
import { resources, platforms } from '../../shared/resources.js';
import { dashboard } from '../services/dashboardService.js';
import { recordActivity } from '../services/resourceService.js';
import { asyncRoute, ok, ApiError, escapeRegex } from '../utils/http.js';
export const workspaceRouter = Router();
workspaceRouter.post(
  '/analytics/records',
  asyncRoute(async (req, res) => {
    const data = z
      .object({
        platform: z.enum(platforms),
        date: z.iso.date(),
        ...Object.fromEntries(
          [
            'followers',
            'views',
            'likes',
            'comments',
            'shares',
            'saves',
            'impressions',
            'reach',
          ].map((key) => [key, z.number().int().min(0).max(1e12)]),
        ),
      })
      .strict()
      .parse(req.body);
    const record = await Analytics.findOneAndUpdate(
      { owner: req.user._id, platform: data.platform, date: new Date(data.date), deletedAt: null },
      { $set: data },
      { upsert: true, new: true, runValidators: true },
    );
    await recordActivity(req, `Recorded ${data.platform} performance`, 'analytics', record._id);
    ok(res, record, 'Performance snapshot saved.', 201);
  }),
);
workspaceRouter.get(
  '/dashboard',
  asyncRoute(async (req, res) =>
    ok(
      res,
      await dashboard(
        req.user._id,
        [7, 30, 90, 180, 365].includes(Number(req.query.days)) ? Number(req.query.days) : 30,
      ),
    ),
  ),
);
workspaceRouter.get(
  '/analytics',
  asyncRoute(async (req, res) =>
    ok(
      res,
      await dashboard(
        req.user._id,
        [7, 30, 90, 180, 365].includes(Number(req.query.days)) ? Number(req.query.days) : 30,
      ),
    ),
  ),
);
workspaceRouter.get(
  '/search',
  asyncRoute(async (req, res) => {
    const search = String(req.query.q || '')
      .trim()
      .slice(0, 100);
    if (search.length < 2) return ok(res, []);
    const rows = await Promise.all(
      ['content', 'brands', 'campaigns', 'deals', 'tasks', 'invoices'].map(async (key) =>
        (
          await models[key]
            .find({
              owner: req.user._id,
              deletedAt: null,
              title: { $regex: escapeRegex(search), $options: 'i' },
            })
            .select('title status')
            .limit(5)
            .lean()
        ).map((r) => ({ ...r, resource: key, label: resources[key].label })),
      ),
    );
    ok(res, rows.flat());
  }),
);
workspaceRouter.get(
  '/calendar',
  asyncRoute(async (req, res) => {
    const from = new Date(String(req.query.from)),
      to = new Date(String(req.query.to));
    if (!Number.isFinite(+from) || !Number.isFinite(+to) || to - from > 40 * 86400000)
      throw new ApiError(400, 'Choose a valid calendar range of 40 days or fewer.');
    const rows = await Promise.all(
      [
        ['content', 'publishDate'],
        ['tasks', 'dueDate'],
        ['campaigns', 'endDate'],
        ['deals', 'deadline'],
      ].map(async ([key, date]) =>
        (
          await models[key]
            .find({
              owner: req.user._id,
              deletedAt: null,
              [date]: { $gte: from, $lte: to },
              ...(req.query.platform ? { platform: String(req.query.platform) } : {}),
              ...(req.query.status && key === 'content'
                ? { status: String(req.query.status) }
                : {}),
            })
            .limit(500)
            .lean()
        ).map((r) => ({ ...r, eventDate: r[date], resource: key })),
      ),
    );
    ok(res, rows.flat());
  }),
);
workspaceRouter.get(
  '/profile',
  asyncRoute(async (req, res) => ok(res, await Profile.findOne({ owner: req.user._id }).lean())),
);
workspaceRouter.patch(
  '/profile',
  asyncRoute(async (req, res) => {
    const data = z
      .object({
        bio: z.string().max(2000).optional(),
        username: z.string().max(50).optional(),
        niche: z.string().max(100).optional(),
        location: z.string().max(100).optional(),
        timezone: z
          .string()
          .max(100)
          .refine(
            (value) => {
              try {
                Intl.DateTimeFormat(undefined, { timeZone: value });
                return true;
              } catch {
                return false;
              }
            },
            'Choose a valid IANA timezone, such as Asia/Kolkata.',
          )
          .optional(),
        language: z.string().regex(/^[a-z]{2}(?:-[A-Z]{2})?$/, 'Use a language tag such as en or hi-IN.').optional(),
        website: z
          .url()
          .regex(/^https?:/)
          .or(z.literal(''))
          .optional(),
        currency: z.enum(['INR', 'USD', 'EUR', 'GBP']).optional(),
        socials: z
          .record(
            z.string(),
            z
              .url()
              .regex(/^https?:/)
              .or(z.literal('')),
          )
          .optional(),
        notifications: z.boolean().optional(),
      })
      .strict()
      .parse(req.body);
    ok(
      res,
      await Profile.findOneAndUpdate(
        { owner: req.user._id },
        { $set: data },
        { upsert: true, new: true, runValidators: true },
      ),
      'Profile saved.',
    );
  }),
);
workspaceRouter.post(
  '/notifications/read-all',
  asyncRoute(async (req, res) => {
    await models.notifications.updateMany(
      { owner: req.user._id, deletedAt: null },
      { $set: { read: true } },
    );
    ok(res, null, 'All notifications marked as read.');
  }),
);
workspaceRouter.get(
  '/notifications/unread',
  asyncRoute(async (req, res) =>
    ok(res, {
      count: await models.notifications.countDocuments({
        owner: req.user._id,
        deletedAt: null,
        read: false,
      }),
    }),
  ),
);
workspaceRouter.get(
  '/invoices/:id/pdf',
  asyncRoute(async (req, res) => {
    const invoice = await models.invoices
      .findOne({ _id: req.params.id, owner: req.user._id, deletedAt: null })
      .lean();
    if (!invoice) throw new ApiError(404, 'Invoice not found.');
    const [brand, profile] = await Promise.all([
      invoice.brand
        ? models.brands.findOne({ _id: invoice.brand, owner: req.user._id }).lean()
        : null,
      Profile.findOne({ owner: req.user._id }).lean(),
    ]);
    const currency = profile?.currency || 'INR';
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${invoice.number}.pdf"`);
    const doc = new PDFDocument({ margin: 50, size: 'A4' });
    doc.pipe(res);
    doc.fillColor('#254d3e').fontSize(26).text('CreatorOS').moveDown();
    doc.fillColor('#222').fontSize(30).text('INVOICE').fontSize(11).text(invoice.number).moveDown();
    doc
      .text(`From: ${req.user.name}`)
      .text(req.user.email)
      .moveDown()
      .text(`Bill to: ${brand?.title || invoice.title}`)
      .text(invoice.clientEmail || '')
      .text(invoice.clientAddress || '')
      .moveDown()
      .text(`Issued: ${new Date(invoice.date || invoice.createdAt).toLocaleDateString('en-GB')}`)
      .text(
        `Due: ${invoice.dueDate ? new Date(invoice.dueDate).toLocaleDateString('en-GB') : 'On receipt'}`,
      )
      .text(`Status: ${invoice.status}`)
      .moveDown(2);
    for (const item of invoice.items) {
      if (doc.y > 680) doc.addPage();
      doc
        .fontSize(12)
        .text(item.description)
        .fontSize(10)
        .fillColor('#666')
        .text(
          `${item.quantity} x ${currency} ${item.rate.toFixed(2)} = ${currency} ${(item.quantity * item.rate).toFixed(2)}`,
        )
        .fillColor('#222')
        .moveDown();
    }
    if (doc.y > 620) doc.addPage();
    doc
      .moveDown()
      .text(`Subtotal: ${currency} ${invoice.subtotal.toFixed(2)}`, { align: 'right' })
      .text(`Discount: ${currency} ${(invoice.discount || 0).toFixed(2)}`, { align: 'right' })
      .text(`Tax: ${invoice.tax || 0}%`, { align: 'right' })
      .fontSize(18)
      .text(`Total: ${currency} ${invoice.amount.toFixed(2)}`, { align: 'right' })
      .moveDown()
      .fontSize(10)
      .text(invoice.notes || 'Thank you for your partnership.');
    doc.end();
  }),
);
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 25 * 1024 * 1024, files: 1 },
});
const mediaConfigured = () =>
  !!(
    process.env.CLOUDINARY_CLOUD_NAME &&
    process.env.CLOUDINARY_API_KEY &&
    process.env.CLOUDINARY_API_SECRET
  );
const configureCloud = () =>
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
    secure: true,
  });
workspaceRouter.get('/media/config', (req, res) =>
  ok(res, { configured: mediaConfigured(), maxSize: 25 * 1024 * 1024 }),
);
workspaceRouter.post(
  '/media/upload',
  upload.single('file'),
  asyncRoute(async (req, res) => {
    if (!mediaConfigured())
      throw new ApiError(503, 'Connect Cloudinary in the server environment to upload assets.');
    if (!req.file) throw new ApiError(400, 'Choose a file to upload.');
    const type = await fileTypeFromBuffer(req.file.buffer);
    if (
      !type ||
      ![
        'image/jpeg',
        'image/png',
        'image/webp',
        'image/avif',
        'video/mp4',
        'video/webm',
        'application/pdf',
      ].includes(type.mime)
    )
      throw new ApiError(400, 'Upload a JPG, PNG, WebP, AVIF, MP4, WebM, or PDF file.');
    configureCloud();
    const result = await new Promise((resolve, reject) =>
      cloudinary.uploader
        .upload_stream(
          { folder: `creatoros/${req.user._id}`, resource_type: 'auto', type: 'authenticated' },
          (error, result) =>
            error ? reject(new ApiError(502, 'Upload failed. Please try again.')) : resolve(result),
        )
        .end(req.file.buffer),
    );
    const record = await models.media.create({
      owner: req.user._id,
      title: req.file.originalname.slice(0, 200),
      category: type.mime.startsWith('image')
        ? 'Image'
        : type.mime.startsWith('video')
          ? 'Video'
          : 'Document',
      publicId: result.public_id,
      url: result.secure_url,
      mime: type.mime,
      size: req.file.size,
      resourceType: result.resource_type,
    });
    await recordActivity(req, `Uploaded ${record.title}`, 'media', record._id);
    ok(res, record, 'Asset uploaded.', 201);
  }),
);
workspaceRouter.get(
  '/media/:id/download',
  asyncRoute(async (req, res) => {
    const record = await models.media
      .findOne({ _id: req.params.id, owner: req.user._id, deletedAt: null })
      .select('+publicId');
    if (!record?.publicId) throw new ApiError(404, 'File not found.');
    configureCloud();
    res.redirect(
      cloudinary.utils.private_download_url(
        record.publicId,
        record.mime === 'application/pdf' ? 'pdf' : record.url.split('.').pop(),
        {
          resource_type: record.resourceType,
          type: 'authenticated',
          expires_at: Math.floor(Date.now() / 1000) + 60,
        },
      ),
    );
  }),
);