import { useState } from 'react';
import { DollarSign, Send, Calendar, CheckSquare, Plus, Trash2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { Modal, Button } from '../ui';
import { marketplaceApi } from '../../services/marketplaceApi';
export function OfferNegotiationModal({ creator, campaigns = [], onClose, onSuccess }) {
  const [campaignId, setCampaignId] = useState(campaigns[0]?._id || '');
  const [amount, setAmount] = useState(creator?.minimumBudget || 1500);
  const [currency] = useState('USD');
  const [expirationDate, setExpirationDate] = useState(
    new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
  );
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [deliverables, setDeliverables] = useState([
    { title: '1 Instagram Reel (60s)', platform: 'Instagram' },
    { title: '2 Instagram Stories with link', platform: 'Instagram' },
  ]);
  const addDeliverable = () => {
    setDeliverables([...deliverables, { title: '', platform: 'Instagram' }]);
  };
  const updateDeliverable = (index, field, value) => {
    const updated = [...deliverables];
    updated[index][field] = value;
    setDeliverables(updated);
  };
  const removeDeliverable = (index) => {
    setDeliverables(deliverables.filter((_, i) => i !== index));
  };
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!campaignId) {
      toast.error('Please select a campaign.');
      return;
    }
    if (!amount || amount <= 0) {
      toast.error('Please specify a valid offer amount.');
      return;
    }
    try {
      setLoading(true);
      const offerData = {
        campaignId,
        creatorId: creator._id,
        amount: Number(amount),
        currency,
        expirationDate,
        notes,
        deliverables: deliverables.filter((d) => d.title.trim() !== ''),
      };
      await marketplaceApi.createOffer(offerData);
      toast.success(`Campaign offer sent to ${creator.displayName}!`);
      if (onSuccess) onSuccess();
      onClose();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to send offer.');
    } finally {
      setLoading(false);
    }
  };
  return (
    <Modal title={`Send Campaign Offer: ${creator?.displayName}`} onClose={onClose} wide>
      <form onSubmit={handleSubmit} className="space-y-5">
        {}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <label className="text-xs font-semibold uppercase tracking-wider text-muted">Select Campaign</label>
            <select
              className="btn btn-secondary w-full justify-between"
              value={campaignId}
              onChange={(e) => setCampaignId(e.target.value)}
              required
            >
              <option value="">Select a Campaign...</option>
              {campaigns.map((c) => (
                <option key={c._id} value={c._id}>
                  {c.name || c.title} (${c.budget?.toLocaleString() || '0'})
                </option>
              ))}
            </select>
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-semibold uppercase tracking-wider text-muted">Proposed Amount ($)</label>
            <div className="relative">
              <input
                type="number"
                className="input pl-8 w-full"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                min="1"
                required
              />
              <DollarSign size={15} className="absolute left-2.5 top-3 text-muted pointer-events-none" />
            </div>
          </div>
        </div>
        {}
        <div className="space-y-1.5">
          <label className="text-xs font-semibold uppercase tracking-wider text-muted">Offer Expiration Date</label>
          <div className="relative">
            <input
              type="date"
              className="input pl-8 w-full"
              value={expirationDate}
              onChange={(e) => setExpirationDate(e.target.value)}
              required
            />
            <Calendar size={15} className="absolute left-2.5 top-3 text-muted pointer-events-none" />
          </div>
        </div>
        {}
        <div className="space-y-3 pt-2">
          <div className="flex items-center justify-between">
            <label className="text-xs font-semibold uppercase tracking-wider text-muted flex items-center gap-1.5">
              <CheckSquare size={14} /> Deliverables Breakdown
            </label>
            <button type="button" onClick={addDeliverable} className="text-xs text-emerald-600 dark:text-emerald-400 font-medium flex items-center gap-1 hover:underline">
              <Plus size={13} /> Add Deliverable
            </button>
          </div>
          <div className="space-y-2">
            {deliverables.map((item, idx) => (
              <div key={idx} className="flex items-center gap-2">
                <input
                  type="text"
                  placeholder="e.g., 1 YouTube Dedicated Video"
                  className="input text-xs flex-1"
                  value={item.title}
                  onChange={(e) => updateDeliverable(idx, 'title', e.target.value)}
                  required
                />
                <select
                  className="btn btn-secondary text-xs"
                  value={item.platform}
                  onChange={(e) => updateDeliverable(idx, 'platform', e.target.value)}
                >
                  <option value="Instagram">Instagram</option>
                  <option value="YouTube">YouTube</option>
                  <option value="TikTok">TikTok</option>
                  <option value="LinkedIn">LinkedIn</option>
                  <option value="Twitter">Twitter/X</option>
                </select>
                {deliverables.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removeDeliverable(idx)}
                    className="p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-950/50 rounded-lg transition-colors"
                  >
                    <Trash2 size={14} />
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
        {}
        <div className="space-y-1.5">
          <label className="text-xs font-semibold uppercase tracking-wider text-muted">Notes / Special Instructions</label>
          <textarea
            rows="3"
            className="input w-full py-2 text-xs"
            placeholder="Include contract terms, usage rights details, or timeline requirements..."
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
          />
        </div>
        {}
        <div className="flex items-center justify-end gap-3 pt-3 border-t border-line">
          <Button variant="secondary" type="button" onClick={onClose}>
            Cancel
          </Button>
          <Button variant="primary" type="submit" loading={loading}>
            <Send size={14} /> Send Proposal Offer
          </Button>
        </div>
      </form>
    </Modal>
  );
}
