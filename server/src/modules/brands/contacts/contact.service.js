import { Contact } from './contact.model.js';
import { Brand } from '../brand.model.js';
import { logBrandActivity } from '../activities/activity.service.js';
import { ApiError, escapeRegex } from '../../../../utils/http.js';
export async function listContacts(req) {
  const ownerId = req.organization?.ownerId || req.user._id;
  const brandId = req.params.brandId || req.query.brandId;
  const criteria = {
    $or: [{ organizationId: req.organizationId }, { owner: ownerId }],
  };
  if (brandId) {
    criteria.brandId = brandId;
  }
  if (req.query.search) {
    const rx = new RegExp(escapeRegex(String(req.query.search).slice(0, 100)), 'i');
    criteria.$and = [{ $or: [{ name: rx }, { email: rx }, { designation: rx }] }];
  }
  const items = await Contact.find(criteria).sort({ isPrimary: -1, createdAt: -1 }).lean();
  return { items, total: items.length };
}
export async function getContactById(req, contactId) {
  const ownerId = req.organization?.ownerId || req.user._id;
  const contact = await Contact.findOne({
    _id: contactId,
    $or: [{ organizationId: req.organizationId }, { owner: ownerId }],
  }).lean();
  if (!contact) throw new ApiError(404, 'Contact not found.');
  return contact;
}
export async function createContact(req, payload) {
  const ownerId = req.organization?.ownerId || req.user._id;
  const brand = await Brand.findOne({
    _id: payload.brandId,
    $or: [{ organizationId: req.organizationId }, { owner: ownerId }],
  });
  if (!brand) throw new ApiError(404, 'Brand not found.');
  if (payload.isPrimary) {
    await Contact.updateMany({ brandId: brand._id }, { $set: { isPrimary: false } });
  }
  const contact = await Contact.create({
    ...payload,
    organizationId: req.organizationId,
    owner: ownerId,
    createdBy: req.user._id,
  });
  brand.contacts.push({
    _id: contact._id,
    name: contact.name,
    role: contact.designation,
    email: contact.email,
    phone: contact.phone,
    isPrimary: contact.isPrimary,
  });
  if (contact.isPrimary) {
    brand.contactPerson = contact.name;
    brand.contactEmail = contact.email;
    brand.contactPhone = contact.phone;
  }
  await brand.save();
  await logBrandActivity({
    organizationId: req.organizationId,
    brandId: brand._id,
    actorId: req.user._id,
    action: 'Contact Added',
    metadata: { contactId: contact._id, name: contact.name, designation: contact.designation },
  });
  return contact;
}
export async function updateContact(req, contactId, payload) {
  const ownerId = req.organization?.ownerId || req.user._id;
  const contact = await Contact.findOne({
    _id: contactId,
    $or: [{ organizationId: req.organizationId }, { owner: ownerId }],
  });
  if (!contact) throw new ApiError(404, 'Contact not found.');
  if (payload.isPrimary) {
    await Contact.updateMany(
      { brandId: contact.brandId, _id: { $ne: contact._id } },
      { $set: { isPrimary: false } },
    );
  }
  Object.assign(contact, payload);
  contact.updatedBy = req.user._id;
  await contact.save();
  const brand = await Brand.findById(contact.brandId);
  if (brand) {
    const idx = brand.contacts.findIndex((c) => String(c._id) === String(contact._id));
    if (idx >= 0) {
      brand.contacts[idx].name = contact.name;
      brand.contacts[idx].role = contact.designation;
      brand.contacts[idx].email = contact.email;
      brand.contacts[idx].phone = contact.phone;
      brand.contacts[idx].isPrimary = contact.isPrimary;
    }
    if (contact.isPrimary) {
      brand.contactPerson = contact.name;
      brand.contactEmail = contact.email;
      brand.contactPhone = contact.phone;
    }
    await brand.save();
  }
  return contact;
}
export async function deleteContact(req, contactId) {
  const ownerId = req.organization?.ownerId || req.user._id;
  const contact = await Contact.findOneAndDelete({
    _id: contactId,
    $or: [{ organizationId: req.organizationId }, { owner: ownerId }],
  });
  if (!contact) throw new ApiError(404, 'Contact not found.');
  const brand = await Brand.findById(contact.brandId);
  if (brand) {
    brand.contacts = brand.contacts.filter((c) => String(c._id) !== String(contact._id));
    await brand.save();
  }
  return { success: true, message: 'Contact removed.' };
}
