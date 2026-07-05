"""Aturan bisnis pesanan: metode pengiriman, pajak, dan serializer bersama.

Aturan perhitungan (didokumentasikan juga di README):
- subtotal  = jumlah (harga produk x kuantitas)
- diskon    = 0 pada Level 3 (Voucher/Promo hadir di Level 4)
- PPN 12%   = 12% x (subtotal - diskon), dibulatkan ke rupiah terdekat.
              Ongkos kirim tidak dikenai PPN.
- total     = subtotal - diskon + ongkir + PPN
"""

from sqlalchemy.orm import Session

from ..models import Order, OrderStatusHistory

TAX_RATE_PERCENT = 12

# Ongkir flat per metode. sla_hours dipakai untuk aturan overdue di Level 6.
DELIVERY_METHODS = {
    "INSTANT": {
        "label": "Instant",
        "fee": 25_000,
        "sla_hours": 24,
        "description": "Prioritas tertinggi, tiba di hari yang sama.",
    },
    "NEXT_DAY": {
        "label": "Next Day",
        "fee": 15_000,
        "sla_hours": 48,
        "description": "Tiba keesokan hari.",
    },
    "REGULAR": {
        "label": "Regular",
        "fee": 8_000,
        "sla_hours": 96,
        "description": "Paling hemat, tiba dalam 2-4 hari.",
    },
}


def calc_tax(subtotal: int, discount: int = 0) -> int:
    return round((subtotal - discount) * TAX_RATE_PERCENT / 100)


def calc_total(subtotal: int, discount: int, delivery_fee: int, tax: int) -> int:
    return subtotal - discount + delivery_fee + tax


def add_status_history(db: Session, order: Order, status: str, note: str = "") -> None:
    """Setiap perubahan status pesanan wajib tercatat dengan timestamp."""
    order.status = status
    db.add(order)
    db.add(OrderStatusHistory(order_id=order.id, status=status, note=note))


def order_to_summary(order: Order) -> dict:
    return {
        "id": order.id,
        "code": order.code,
        "store_name": order.store.name,
        "buyer_username": order.buyer.username,
        "status": order.status,
        "total": order.total,
        "item_count": sum(item.quantity for item in order.items),
        "delivery_method": order.delivery_method,
        "delivery_method_label": DELIVERY_METHODS[order.delivery_method]["label"],
        "created_at": order.created_at,
    }


def order_to_detail(order: Order) -> dict:
    return {
        **order_to_summary(order),
        "store": {
            "id": order.store.id,
            "name": order.store.name,
            "description": order.store.description,
        },
        "items": [
            {
                "product_name": item.product_name,
                "price": item.price,
                "quantity": item.quantity,
                "line_total": item.line_total,
            }
            for item in order.items
        ],
        "recipient_name": order.recipient_name,
        "phone": order.phone,
        "full_address": order.full_address,
        "subtotal": order.subtotal,
        "discount": order.discount,
        "delivery_fee": order.delivery_fee,
        "tax_rate_percent": TAX_RATE_PERCENT,
        "tax": order.tax,
        "history": [
            {"status": h.status, "note": h.note, "created_at": h.created_at}
            for h in order.history
        ],
    }
