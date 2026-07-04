import { Link } from "react-router-dom";
import { formatIDR } from "../lib/format";
import Card from "./ui/Card";

const GRADIENTS = [
  "from-sea-400 to-sea-700",
  "from-sky-400 to-indigo-600",
  "from-amber-400 to-orange-600",
  "from-emerald-400 to-teal-600",
  "from-fuchsia-400 to-purple-600",
];

function gradientFor(name) {
  let hash = 0;
  for (const ch of name) hash = (hash * 31 + ch.charCodeAt(0)) % 997;
  return GRADIENTS[hash % GRADIENTS.length];
}

export default function ProductCard({ product }) {
  return (
    <Link to={`/products/${product.id}`} className="group">
      <Card className="h-full overflow-hidden transition-shadow group-hover:shadow-md">
        <div
          className={`flex h-36 items-center justify-center bg-gradient-to-br text-4xl font-black text-white/90 ${gradientFor(product.name)}`}
        >
          {product.name.slice(0, 1).toUpperCase()}
        </div>
        <div className="p-4">
          <h3 className="line-clamp-2 text-sm font-semibold text-slate-800 group-hover:text-sea-700">
            {product.name}
          </h3>
          <p className="mt-2 text-base font-bold text-sea-700">
            {formatIDR(product.price)}
          </p>
          <div className="mt-2 flex items-center justify-between text-xs text-slate-500">
            <span className="inline-flex items-center gap-1">
              🏪 {product.store.name}
            </span>
            <span>Stok {product.stock}</span>
          </div>
        </div>
      </Card>
    </Link>
  );
}
