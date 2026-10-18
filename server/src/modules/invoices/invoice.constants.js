export const INVOICE_STATUSES = Object.freeze([
  'Draft',
  'Sent',
  'Viewed',
  'Partially Paid',
  'Paid',
  'Overdue',
  'Cancelled',
]);
export const INVOICE_SORT_FIELDS = Object.freeze([
  'createdAt',
  'title',
  'number',
  'amount',
  'subtotal',
  'paidAmount',
  'remainingAmount',
  'status',
  'date',
  'dueDate',
]);
