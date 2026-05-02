
/**
 * Utility to check if a store should be open based on its operating hours.
 * @param hours The operating_hours JSON object from DB
 * @returns boolean
 */
export function isStoreWithinHours(hours: any): boolean {
  if (!hours || !hours.days || !hours.open || !hours.close) return false;

  const now = new Date();
  const currentDay = now.getDay(); // 0-6 (Sun-Sat)
  const currentTime = now.getHours() * 60 + now.getMinutes();

  const [openH, openM] = hours.open.split(':').map(Number);
  const [closeH, closeM] = hours.close.split(':').map(Number);
  const openTime = openH * 60 + openM;
  const closeTime = closeH * 60 + closeM;

  // Handle overnight hours (e.g., 22:00 - 02:00)
  if (closeTime < openTime) {
    return hours.days.includes(currentDay) && (currentTime >= openTime || currentTime < closeTime);
  }

  return hours.days.includes(currentDay) && 
         currentTime >= openTime && 
         currentTime < closeTime;
}

/**
 * Formats the operating hours for display
 * @param hours The operating_hours JSON object
 * @returns string like "Senin - Sabtu, 08:00 - 17:00"
 */
export function formatOperatingHours(hours: any): string {
  if (!hours || !hours.days || !hours.open || !hours.close) return "Belum diatur";

  const daysMap = ["Minggu", "Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu"];
  
  // Sort days
  const sortedDays = [...hours.days].sort((a, b) => a - b);
  
  let dayRange = "";
  if (sortedDays.length === 7) {
    dayRange = "Setiap hari";
  } else if (sortedDays.length === 6 && !sortedDays.includes(0)) {
    dayRange = "Senin - Sabtu";
  } else if (sortedDays.length === 5 && !sortedDays.includes(0) && !sortedDays.includes(6)) {
    dayRange = "Senin - Jumat";
  } else {
    dayRange = sortedDays.map(d => daysMap[d]).join(", ");
  }

  return `${dayRange}, ${hours.open} - ${hours.close}`;
}
