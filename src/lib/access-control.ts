// src/lib/access-control.ts

// Store user purchases in localStorage (or database in production)
export function hasAccessToMatch(userId: string, matchId: string): boolean {
  const purchases = JSON.parse(localStorage.getItem(`user_purchases_${userId}`) || '{}');
  
  // Check single match purchase
  if (purchases.matches?.includes(matchId)) return true;
  
  // Check subscription
  if (purchases.subscription === 'full' || purchases.subscription === 'group_stage') {
    // Check if subscription is still valid
    const expiry = new Date(purchases.subscriptionExpiry);
    if (expiry > new Date()) return true;
  }
  
  return false;
}

export function recordPurchase(userId: string, type: 'match' | 'subscription', itemId: string, durationDays?: number) {
  const purchases = JSON.parse(localStorage.getItem(`user_purchases_${userId}`) || '{}');
  
  if (type === 'match') {
    purchases.matches = [...(purchases.matches || []), itemId];
  } else if (type === 'subscription') {
    purchases.subscription = itemId; // 'group_stage', 'knockout', 'full'
    const expiry = new Date();
    expiry.setDate(expiry.getDate() + (durationDays || 30));
    purchases.subscriptionExpiry = expiry.toISOString();
  }
  
  localStorage.setItem(`user_purchases_${userId}`, JSON.stringify(purchases));
}