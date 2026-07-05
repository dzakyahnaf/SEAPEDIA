"""Sanitasi teks input publik (lapisan pertahanan tambahan).

Pertahanan utama XSS adalah escaping otomatis React saat render (konten
selalu ditampilkan sebagai teks, bukan HTML). Fungsi di sini adalah lapisan
tambahan di sisi server: membuang karakter kontrol yang tidak terlihat dan
merapikan spasi berlebih agar konten tidak "merusak" tata letak halaman.

Kami sengaja TIDAK menghapus tag seperti <script> dari komentar: karena
dirender sebagai teks, tag tersebut tampil apa adanya (mis. "<script>")
sebagaimana disarankan pada test case Level 7 ("displayed safely").
"""

import re

# Karakter kontrol ASCII kecuali tab (\t), newline (\n), carriage return (\r).
_CONTROL_CHARS = re.compile(r"[\x00-\x08\x0b\x0c\x0e-\x1f\x7f]")


def clean_text(value: str) -> str:
    """Buang karakter kontrol dan rapikan spasi tepi. Aman untuk disimpan dan
    ditampilkan sebagai teks."""
    if value is None:
        return value
    cleaned = _CONTROL_CHARS.sub("", value)
    # Rapikan spasi di tepi tiap baris agar tidak merusak layout.
    cleaned = "\n".join(line.strip() for line in cleaned.splitlines())
    return cleaned.strip()
