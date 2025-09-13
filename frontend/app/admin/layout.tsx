export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-white">
      {/* Minimal wrapper — reuse your site header/footer later if you prefer */}
      {children}
    </div>
  );
}
