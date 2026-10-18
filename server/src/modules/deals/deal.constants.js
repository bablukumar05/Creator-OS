export const DEAL_STATUSES = Object.freeze([
  'Lead',
  'Negotiating',
  'Approved',
  'Active',
  'Completed',
  'Cancelled',
]);
export const DEAL_PAYMENT_STATUSES = Object.freeze([
  'Pending',
  'Partial',
  'Paid',
  'Overdue',
]);
export const DEAL_SORT_FIELDS = Object.freeze([
  'createdAt',
  'title',
  'amount',
  'status',
  'paymentStatus',
  'startDate',
  'deadline',
  'paymentDueDate',
]);
