// The merchant types a retailer is allowed to see sell posts from (#7).
//
// Must stay in step with SupplySideRoles in the backend's
// auction/service/sell_auction_service.go: this list decides who is *asked*
// whether they supply to retail, and that one decides who is *shown*. If they
// disagree, a merchant is either asked a question that does nothing, or opted
// out of a feed they were never asked about.
export const SUPPLY_SIDE_ROLES = ['importer', 'wholesaler', 'distributor', 'processor', 'supplier'];

export function isSupplySideRole(jobKey: string | undefined | null): boolean {
  return !!jobKey && SUPPLY_SIDE_ROLES.includes(jobKey);
}
