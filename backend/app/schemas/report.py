from pydantic import BaseModel


class SellerReport(BaseModel):
    store_name: str
    total_orders: int
    completed_orders: int
    in_process_orders: int
    returned_orders: int
    gross_sales: int  # nilai barang kotor dari pesanan selesai
    total_discount_given: int
    net_income: int  # pendapatan bersih Seller (subtotal - diskon)


class BuyerReport(BaseModel):
    total_orders: int
    completed_orders: int
    active_orders: int
    returned_orders: int
    total_spent: int  # total nominal yang dibayarkan (termasuk ongkir & PPN)
    total_discount_saved: int
    total_tax_paid: int
