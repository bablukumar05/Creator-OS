import mongoose from 'mongoose';
const talentMembershipSchema = new mongoose.Schema(
  {
    organizationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Organization',
      required: true,
      index: true,
    },
    creatorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'CreatorProfileModel',
      required: true,
      index: true,
    },
    relationshipType: {
      type: String,
      enum: ['Exclusive', 'Non-Exclusive', 'Managed', 'Partner', 'Freelance', 'Contract'],
      default: 'Managed',
    },
    status: {
      type: String,
      enum: ['active', 'inactive', 'suspended'],
      default: 'active',
      index: true,
    },
    managerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    commissionPercentage: {
      type: Number,
      min: 0,
      max: 100,
      default: 15,
    },
    internalNotes: {
      type: String,
      trim: true,
      maxlength: 5000,
    },
    contractId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Contract',
      default: null,
    },
    joinedAt: {
      type: Date,
      default: Date.now,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    deletedAt: {
      type: Date,
      default: null,
    },
  },
  { timestamps: true },
);
talentMembershipSchema.index({ organizationId: 1, creatorId: 1 }, { unique: true });
export const TalentMembership = mongoose.model('TalentMembership', talentMembershipSchema);
