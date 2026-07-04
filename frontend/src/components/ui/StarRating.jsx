export default function StarRating({ value, onChange, size = "text-lg" }) {
  const interactive = typeof onChange === "function";
  return (
    <div className={`flex items-center gap-0.5 ${size}`} role={interactive ? "radiogroup" : undefined}>
      {[1, 2, 3, 4, 5].map((star) =>
        interactive ? (
          <button
            key={star}
            type="button"
            onClick={() => onChange(star)}
            aria-label={`Beri rating ${star}`}
            className={`transition-transform hover:scale-110 ${
              star <= value ? "text-amber-400" : "text-slate-300"
            }`}
          >
            ★
          </button>
        ) : (
          <span key={star} className={star <= value ? "text-amber-400" : "text-slate-300"}>
            ★
          </span>
        )
      )}
    </div>
  );
}
