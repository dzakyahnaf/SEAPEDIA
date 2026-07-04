import { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import { api } from "../lib/api";
import { formatDate } from "../lib/format";
import Button from "./ui/Button";
import Card from "./ui/Card";
import Input from "./ui/Input";
import StarRating from "./ui/StarRating";

export default function ReviewSection() {
  const { user } = useAuth();
  const [data, setData] = useState(null);
  const [name, setName] = useState("");
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  function load() {
    api("/reviews?limit=9").then(setData).catch(() => setData({ items: [], total: 0 }));
  }

  useEffect(load, []);

  // Jika user login, isi otomatis nama pengulas (tetap bisa diubah).
  useEffect(() => {
    if (user && !name) setName(user.username);
  }, [user]); // eslint-disable-line react-hooks/exhaustive-deps

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setSuccess("");
    setSubmitting(true);
    try {
      await api("/reviews", {
        method: "POST",
        body: { reviewer_name: name, rating, comment },
      });
      setComment("");
      setSuccess("Terima kasih! Review Anda sudah tampil di bawah.");
      load();
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <section className="mx-auto max-w-7xl px-4 py-14 sm:px-6" id="reviews">
      <div className="text-center">
        <h2 className="text-2xl font-extrabold text-slate-900 sm:text-3xl">
          Kata Mereka tentang SEAPEDIA
        </h2>
        <p className="mx-auto mt-2 max-w-xl text-sm text-slate-500">
          Review tentang pengalaman menggunakan aplikasi — siapa pun boleh
          menulis, tanpa perlu login atau bertransaksi.
        </p>
        {data?.average_rating != null && (
          <div className="mt-3 inline-flex items-center gap-2 rounded-full bg-amber-50 px-4 py-1.5 text-sm font-semibold text-amber-700">
            ★ {data.average_rating} dari {data.total} review
          </div>
        )}
      </div>

      <div className="mt-10 grid gap-8 lg:grid-cols-3">
        {/* Form review */}
        <Card className="h-fit p-6 lg:sticky lg:top-24">
          <h3 className="font-bold text-slate-800">Tulis Review Anda</h3>
          <form onSubmit={handleSubmit} className="mt-4 space-y-4">
            <Input
              id="reviewer-name"
              label="Nama"
              placeholder="Nama Anda"
              value={name}
              maxLength={60}
              required
              onChange={(e) => setName(e.target.value)}
            />
            <div>
              <span className="mb-1.5 block text-sm font-medium text-slate-700">
                Rating
              </span>
              <StarRating value={rating} onChange={setRating} size="text-2xl" />
            </div>
            <div>
              <label htmlFor="review-comment" className="mb-1.5 block text-sm font-medium text-slate-700">
                Komentar
              </label>
              <textarea
                id="review-comment"
                rows={4}
                maxLength={1000}
                required
                placeholder="Ceritakan pengalaman Anda menggunakan SEAPEDIA…"
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                className="w-full rounded-lg border border-slate-300 bg-white px-3.5 py-2.5 text-sm placeholder:text-slate-400 focus:outline-2 focus:outline-offset-1 focus:outline-sea-500"
              />
            </div>
            {error && <p className="text-xs text-rose-600">{error}</p>}
            {success && <p className="text-xs text-emerald-600">{success}</p>}
            <Button type="submit" disabled={submitting} className="w-full">
              {submitting ? "Mengirim…" : "Kirim Review"}
            </Button>
          </form>
        </Card>

        {/* Daftar review — komentar dirender sebagai teks murni (aman XSS) */}
        <div className="grid gap-4 sm:grid-cols-2 lg:col-span-2">
          {data === null && <p className="text-sm text-slate-400">Memuat review…</p>}
          {data?.items.length === 0 && (
            <p className="text-sm text-slate-400">Belum ada review. Jadilah yang pertama!</p>
          )}
          {data?.items.map((review) => (
            <Card key={review.id} className="p-5">
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2.5">
                  <span className="flex h-9 w-9 items-center justify-center rounded-full bg-sea-100 text-sm font-bold text-sea-700">
                    {review.reviewer_name.slice(0, 1).toUpperCase()}
                  </span>
                  <div>
                    <p className="text-sm font-semibold text-slate-800">
                      {review.reviewer_name}
                    </p>
                    <p className="text-xs text-slate-400">{formatDate(review.created_at)}</p>
                  </div>
                </div>
                <StarRating value={review.rating} size="text-sm" />
              </div>
              <p className="mt-3 text-sm leading-relaxed break-words text-slate-600">
                {review.comment}
              </p>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}
