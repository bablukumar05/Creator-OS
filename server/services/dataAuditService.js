import { models } from '../models/resources.js';
import { resources } from '../../shared/resources.js';
export async function auditData() {
  const counts = {};
  let invalidLinks = 0,
    contextMismatches = 0;
  for (const [key, config] of Object.entries(resources)) {
    counts[key] = await models[key].countDocuments();
    for (const field of config.fields.filter((f) => f.type === 'relation')) {
      const rows = await models[key].aggregate([
        { $match: { [field.key]: { $type: 'objectId' } } },
        {
          $lookup: {
            from: models[field.resource].collection.name,
            localField: field.key,
            foreignField: '_id',
            as: 'linked',
          },
        },
        {
          $match: {
            $or: [
              { linked: { $size: 0 } },
              { $expr: { $ne: [{ $arrayElemAt: ['$linked.owner', 0] }, '$owner'] } },
            ],
          },
        },
        { $count: 'invalid' },
      ]);
      invalidLinks += rows[0]?.invalid || 0;
    }
    if (
      config.fields.some((f) => f.key === 'brand') &&
      config.fields.some((f) => f.key === 'campaign')
    ) {
      const rows = await models[key].aggregate([
        { $match: { brand: { $type: 'objectId' }, campaign: { $type: 'objectId' } } },
        {
          $lookup: {
            from: models.campaigns.collection.name,
            localField: 'campaign',
            foreignField: '_id',
            as: 'linked',
          },
        },
        { $unwind: '$linked' },
        {
          $match: {
            'linked.brand': { $type: 'objectId' },
            $expr: { $ne: ['$brand', '$linked.brand'] },
          },
        },
        { $count: 'mismatches' },
      ]);
      contextMismatches += rows[0]?.mismatches || 0;
    }
  }
  return { counts, invalidLinks, contextMismatches };
}