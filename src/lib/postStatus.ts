// Arabic labels for every status a sell post or buy request can hold.
//
// This lives in one place because it drifted: #18 added pending_approval,
// rejected and suspended to the cards and the my-posts list, but the two detail
// pages kept their own copies and rendered the raw key instead. The lists were
// also missing winner_selected, fulfilled and partially_fulfilled, which are
// reachable as soon as an owner picks a winner.
//
// Keep in step with the CHECK constraints on sell_auctions.status and
// buy_requests.status.
export const POST_STATUS_TEXT: Record<string, string> = {
  // moderation (#18)
  pending_approval: 'بانتظار الموافقة',
  rejected: 'مرفوض',
  suspended: 'موقوف',
  // lifecycle — shared
  active: 'نشط',
  pending_selection: 'بانتظار الاختيار',
  cancelled: 'ملغي',
  expired: 'منتهي',
  // lifecycle — sell posts
  winner_selected: 'تم اختيار الفائز',
  // lifecycle — buy requests
  fulfilled: 'مكتمل',
  partially_fulfilled: 'مكتمل جزئياً',
};

// Falls back to the raw key so an unmapped status is still visible rather than
// blank — but everything the database allows should be mapped above.
export function postStatusText(status: string): string {
  return POST_STATUS_TEXT[status] || status;
}
