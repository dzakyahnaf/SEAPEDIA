const VARIANTS = {
  primary:
    "bg-sea-600 text-white hover:bg-sea-700 focus-visible:outline-sea-600 disabled:bg-sea-300",
  secondary:
    "bg-sea-50 text-sea-700 hover:bg-sea-100 focus-visible:outline-sea-600 disabled:text-sea-300",
  outline:
    "border border-slate-300 text-slate-700 hover:border-sea-500 hover:text-sea-700 focus-visible:outline-sea-600 disabled:text-slate-300",
  danger:
    "bg-rose-600 text-white hover:bg-rose-700 focus-visible:outline-rose-600 disabled:bg-rose-300",
  ghost:
    "text-slate-600 hover:bg-slate-100 focus-visible:outline-sea-600 disabled:text-slate-300",
};

const SIZES = {
  sm: "px-3 py-1.5 text-sm",
  md: "px-4 py-2 text-sm",
  lg: "px-6 py-3 text-base",
};

export default function Button({
  variant = "primary",
  size = "md",
  className = "",
  type = "button",
  children,
  ...props
}) {
  return (
    <button
      type={type}
      className={`inline-flex items-center justify-center gap-2 rounded-lg font-semibold transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 disabled:cursor-not-allowed ${VARIANTS[variant]} ${SIZES[size]} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}
