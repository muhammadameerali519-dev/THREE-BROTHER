import type {Order} from '../types.ts';

export const WHATSAPP_NUMBER = '93703842099';

export function formatCurrency(amount: number): string {
  return `$${Number(amount || 0).toLocaleString('en-US', {
    minimumFractionDigits: amount % 1 === 0 ? 0 : 2,
    maximumFractionDigits: 2,
  })}`;
}

export function buildWhatsAppOrderMessage(order: Order): string {
  const itemsBlock = order.items
    .map(
      (item, idx) =>
        `${order.items.length > 1 ? `Item ${idx + 1}\n` : ''}Product: ${item.title}\nBrand: ${item.brand_name}\nQuantity: ${item.quantity}\nUnit Price: ${formatCurrency(item.unit_price)}\nTotal: ${formatCurrency(item.line_total)}`,
    )
    .join('\n\n');

  const instructionsLine = order.instructions?.trim()
    ? `\nAdditional Instructions: ${order.instructions.trim()}`
    : '';

  return [
    'THREE BROTHERS – NEW ORDER',
    `Order Reference: ${order.order_number}`,
    '',
    'CUSTOMER DETAILS:',
    `Name: ${order.customer_name}`,
    `Phone: ${order.customer_phone}`,
    `Country: ${order.country}`,
    `City: ${order.city}`,
    `Address: ${order.address}${instructionsLine}`,
    '',
    'ORDER ITEMS:',
    itemsBlock,
    '',
    `Subtotal: ${formatCurrency(order.subtotal)}`,
    `Discount: -${formatCurrency(order.discount_total)}`,
    `Delivery Charges: ${order.delivery_charges === 0 ? 'FREE ($0)' : formatCurrency(order.delivery_charges)}`,
    `Grand Total: ${formatCurrency(order.grand_total)}`,
    '',
    `Order Status: ${order.status}.`,
  ].join('\n');
}

export function buildWhatsAppOrderUrl(order: Order): string {
  const message = buildWhatsAppOrderMessage(order);
  return `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`;
}

export function buildWhatsAppSupportUrl(text: string): string {
  return `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(text)}`;
}
