export function resolveNotificationLink(
  data: Record<string, unknown> | string | null | undefined,
  eventType?: string,
): string | null {
  // 1. If data is a string, JSON.parse it; on failure treat as {}
  let parsed: Record<string, unknown> = {}
  if (typeof data === 'string') {
    try {
      parsed = JSON.parse(data) as Record<string, unknown>
    } catch {
      parsed = {}
    }
  } else if (data !== null && data !== undefined) {
    parsed = data
  }

  // 2. If _url is a non-empty string, return its pathname+search
  if (typeof parsed._url === 'string' && parsed._url.length > 0) {
    try {
      const u = new URL(parsed._url)
      return u.pathname + u.search
    } catch {
      return parsed._url
    }
  }

  // 3. Resolve event identifier
  const event =
    eventType ??
    (typeof parsed.event_type === 'string' ? parsed.event_type : undefined) ??
    (typeof parsed.type === 'string' ? parsed.type : undefined)

  if (!event) return null

  // 4. Resolve IDs by reading both naming styles
  const auctionId =
    (typeof parsed.auction_public_id === 'string' ? parsed.auction_public_id : undefined) ??
    (typeof parsed.auction_id === 'string' ? parsed.auction_id : undefined)

  const requestId =
    (typeof parsed.buy_request_public_id === 'string' ? parsed.buy_request_public_id : undefined) ??
    (typeof parsed.request_public_id === 'string' ? parsed.request_public_id : undefined) ??
    (typeof parsed.request_id === 'string' ? parsed.request_id : undefined)

  const orderId =
    (typeof parsed.order_public_id === 'string' ? parsed.order_public_id : undefined) ??
    (typeof parsed.order_id === 'string' ? parsed.order_id : undefined)

  // 5. Switch on the event identifier
  switch (event) {
    case 'new_bid':
    case 'auction_ended':
    case 'auction_ended_no_bids':
    case 'new_sell_auction':
    case 'bid_not_selected':
    case 'auction_motivation':
      return auctionId ? `/auctions/sell/${auctionId}` : null

    case 'new_offer':
    case 'request_ended':
    case 'new_buy_request':
    case 'offer_not_accepted':
    case 'request_ended_no_offers':
    case 'request_motivation':
      return requestId ? `/auctions/buy/${requestId}` : null

    case 'bid_selected':
    case 'winner_selected':
      if (orderId) return `/orders/${orderId}`
      return auctionId ? `/auctions/sell/${auctionId}` : null

    case 'offer_accepted':
      if (orderId) return `/orders/${orderId}`
      return requestId ? `/auctions/buy/${requestId}` : null

    case 'order_created':
    case 'order_cancelled':
    case 'new_order':
    case 'order_completed':
    case 'order_expired':
    case 'order_cancelled_timeout':
      if (orderId) return `/orders/${orderId}`
      if (auctionId) return `/auctions/sell/${auctionId}`
      if (requestId) return `/auctions/buy/${requestId}`
      return null

    case 'selection_expiring':
    case 'selection_expired':
      if (auctionId) return `/auctions/sell/${auctionId}`
      if (requestId) return `/auctions/buy/${requestId}`
      return null

    // Shipping quotes (#14). Same trap as the moderation events below: the
    // notification service overwrites data.type with the event name, so these
    // have to be listed here or the tap does nothing at all.
    //
    // Only the merchant is told a quote arrived, and only they can open the
    // deal, so this one keeps the job link.
    case 'shipping_quote_received':
      if (orderId) return `/orders/${orderId}`
      if (auctionId) return `/auctions/sell/${auctionId}`
      if (requestId) return `/auctions/buy/${requestId}`
      return null

    // A verdict only ever goes to a carrier, and a carrier is not a party to the
    // order — following the job link would hand it NOT_ORDER_PARTICIPANT and a
    // blank screen. Its own quote list is where the answer lives.
    case 'shipping_quote_accepted':
    case 'shipping_quote_rejected':
      return '/carrier/quotes'

    // Moderation verdicts (#18). The event name is what gets stored — the
    // notification service overwrites data.type with it — so these have to be
    // listed here or the owner taps the verdict and nothing happens. An owner
    // may open their own post whatever its status, so the detail page is a
    // valid destination even when the post is not public.
    case 'post_approved':
    case 'post_rejected':
    case 'post_suspended':
      if (auctionId) return `/auctions/sell/${auctionId}`
      if (requestId) return `/auctions/buy/${requestId}`
      return '/my-auctions'

    case 'account_approved':
    case 'account_rejected':
    case 'account_suspended':
    case 'account_unsuspended':
    case 'account_banned':
    case 'account_unbanned':
      return '/profile'

    default:
      return null
  }
}
