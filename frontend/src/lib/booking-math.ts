export function ticketTotal(price: number, quantity: number) {
  if (!Number.isFinite(price) || price < 0) throw new Error("Ticket price must be a non-negative number.");
  if (!Number.isInteger(quantity) || quantity < 1 || quantity > 10) throw new Error("Ticket quantity must be between 1 and 10.");
  return price * quantity;
}
