export function Header() {
  return (
    <header className="border-b border-border bg-primary">
      <div className="container mx-auto px-4 py-4 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <img src="/regus-logo-white.jpg" alt="Regus Logo" className="h-10 w-auto" />
          <div className="h-8 w-px bg-primary-foreground/20" />
          <div>
            <p className="text-sm font-medium text-primary-foreground">Financial Modeling Platform</p>
          </div>
        </div>

        <div className="flex items-center gap-2 text-sm text-primary-foreground/80">
          <span className="hidden sm:inline">Co-Working Space Analysis</span>
        </div>
      </div>
    </header>
  )
}
