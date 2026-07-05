"""Seed data demo SEAPEDIA.

Jalankan dari folder backend:  python -m app.seed

Membuat akun demo untuk keempat role (password di README), toko, produk
katalog, dan beberapa review aplikasi. Aman dijalankan berulang; data yang
sudah ada tidak diduplikasi.
"""

from sqlalchemy import func, select

from .database import Base, SessionLocal, engine
from .models import (
    TX_TOPUP,
    Address,
    AppReview,
    Product,
    Store,
    User,
    UserRole,
    Wallet,
    WalletTransaction,
)
from .security import hash_password

DEMO_USERS = [
    # (username, email, password, roles, store_name, store_desc)
    ("admin", "admin@seapedia.com", "Admin123!", ["ADMIN"], None, None),
    (
        "tokomaju", "tokomaju@seapedia.com", "Seller123!", ["SELLER"],
        "Toko Maju Jaya", "Elektronik dan aksesori gadget terlengkap.",
    ),
    (
        "warungijo", "warungijo@seapedia.com", "Seller123!", ["SELLER"],
        "Warung Ijo", "Kebutuhan dapur dan camilan rumahan.",
    ),
    ("budi", "budi@seapedia.com", "Buyer123!", ["BUYER"], None, None),
    ("dika", "dika@seapedia.com", "Driver123!", ["DRIVER"], None, None),
    (
        # Akun multi-role untuk mendemokan pemilihan role aktif.
        "rina", "rina@seapedia.com", "Multi123!", ["BUYER", "SELLER", "DRIVER"],
        "Rina Collection", "Fashion wanita: hijab, dress, dan tas.",
    ),
]

DEMO_PRODUCTS = {
    "Toko Maju Jaya": [
        ("Headphone Bluetooth ANC", "Headphone nirkabel dengan Active Noise Cancelling, baterai 40 jam, koneksi multipoint.", 459000, 25),
        ("Power Bank 20.000 mAh", "Power bank fast charging 22.5W dengan dua port USB-A dan satu USB-C PD.", 259000, 40),
        ("Mouse Wireless Silent", "Mouse ergonomis tanpa suara klik, DPI 800-1600, cocok untuk kerja dan kuliah.", 89000, 60),
        ("Keyboard Mechanical TKL", "Keyboard mechanical tenkeyless hot-swappable, switch red, RGB.", 385000, 15),
        ("Webcam Full HD 1080p", "Webcam dengan mikrofon stereo dan koreksi cahaya otomatis untuk meeting online.", 199000, 30),
    ],
    "Warung Ijo": [
        ("Keripik Singkong Balado 250g", "Keripik singkong renyah bumbu balado pedas manis khas Padang.", 18000, 100),
        ("Kopi Robusta Lampung 500g", "Biji kopi robusta pilihan, sangrai medium, cocok untuk tubruk dan espresso.", 65000, 45),
        ("Madu Hutan Asli 350ml", "Madu hutan murni tanpa campuran, dipanen dari hutan Sumatera.", 95000, 20),
        ("Sambal Bawang Botol 200g", "Sambal bawang homemade level pedas sedang, tanpa pengawet.", 27000, 75),
    ],
    "Rina Collection": [
        ("Hijab Voal Premium Polos", "Hijab segi empat bahan voal lembut, jahit tepi rapi, 20 pilihan warna.", 45000, 80),
        ("Dress Midi Casual", "Dress midi bahan rayon adem, model A-line, ukuran S-XXL.", 129000, 35),
        ("Tas Selempang Mini", "Tas selempang kulit sintetis premium dengan tali rantai, muat HP dan dompet.", 99000, 50),
    ],
}

# Saldo wallet awal & alamat demo untuk mempermudah pengujian checkout.
DEMO_WALLETS = {"budi": 500_000, "rina": 300_000}

DEMO_ADDRESSES = {
    "budi": ("Rumah", "Budi Santoso", "081234567890",
             "Jl. Merdeka No. 10, RT 02/RW 05, Kel. Sukamaju, Depok, Jawa Barat 16411"),
    "rina": ("Kos", "Rina Amelia", "085712345678",
             "Jl. Margonda Raya No. 88, Kost Melati Kamar 12, Depok, Jawa Barat 16424"),
}

DEMO_REVIEWS = [
    ("Andini", 5, "Tampilannya bersih dan gampang dipakai. Cari produk langsung ketemu!"),
    ("Fajar", 4, "Konsep multi-role nya menarik, saya bisa jadi pembeli sekaligus buka toko."),
    ("Sari", 5, "Registrasinya cepat, tidak ribet. Semoga fitur checkout segera hadir."),
    ("Yoga", 4, "Sebagai calon driver, dashboard-nya sudah kelihatan rapi. Ditunggu fitur ambil job-nya."),
]


def seed() -> None:
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()
    try:
        for username, email, password, roles, store_name, store_desc in DEMO_USERS:
            user = db.scalar(select(User).where(User.username == username))
            if user is None:
                user = User(
                    username=username,
                    email=email,
                    password_hash=hash_password(password),
                )
                for role in roles:
                    user.roles.append(UserRole(role=role))
                db.add(user)
                db.flush()
                print(f"  [+] user {username} ({', '.join(roles)})")

            if store_name and user.store is None:
                existing = db.scalar(select(Store).where(Store.name == store_name))
                if existing is None:
                    db.add(Store(seller_id=user.id, name=store_name, description=store_desc))
                    db.flush()
                    print(f"      toko: {store_name}")
        db.commit()

        for store_name, products in DEMO_PRODUCTS.items():
            store = db.scalar(select(Store).where(Store.name == store_name))
            if store is None:
                continue
            for name, desc, price, stock in products:
                exists = db.scalar(
                    select(Product).where(
                        Product.store_id == store.id, Product.name == name
                    )
                )
                if exists is None:
                    db.add(Product(
                        store_id=store.id, name=name, description=desc,
                        price=price, stock=stock,
                    ))
        db.commit()

        for username, balance in DEMO_WALLETS.items():
            user = db.scalar(select(User).where(User.username == username))
            if user is not None and db.get(Wallet, user.id) is None:
                db.add(Wallet(user_id=user.id, balance=balance))
                db.add(WalletTransaction(
                    user_id=user.id, amount=balance, type=TX_TOPUP,
                    description="Saldo awal akun demo",
                ))
                print(f"  [+] wallet {username}: Rp{balance:,}")

        for username, (label, recipient, phone, full_address) in DEMO_ADDRESSES.items():
            user = db.scalar(select(User).where(User.username == username))
            if user is None:
                continue
            has_address = db.scalar(select(Address).where(Address.user_id == user.id))
            if has_address is None:
                db.add(Address(
                    user_id=user.id, label=label, recipient_name=recipient,
                    phone=phone, full_address=full_address, is_default=True,
                ))
                print(f"  [+] alamat {username}")
        db.commit()

        review_count = db.scalar(select(func.count(AppReview.id))) or 0
        if review_count == 0:
            for reviewer, rating, comment in DEMO_REVIEWS:
                db.add(AppReview(reviewer_name=reviewer, rating=rating, comment=comment))
            db.commit()
            print(f"  [+] {len(DEMO_REVIEWS)} review aplikasi")

        print("Seed selesai.")
    finally:
        db.close()


if __name__ == "__main__":
    seed()
