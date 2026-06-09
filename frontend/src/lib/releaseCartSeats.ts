import type { CartItem } from "../hooks/usePOSCart";
import { ticketService } from "../services/ticket.service";

export async function releaseCartSeatReservations(cart: CartItem[]) {
  const seatItems = cart.filter(
    (item) => item.seatNumbers && item.seatNumbers.length > 0,
  );

  await Promise.all(
    seatItems.map((item) =>
      ticketService.updateSeatStatus(
        item.ticketGroup.id,
        item.seatNumbers!,
        "AVAILABLE",
      ),
    ),
  );
}
