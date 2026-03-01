const navCategories = [
  {
    category: 'Foundation',
    items: [
      { label: 'Colors', anchor: 'colors' },
      { label: 'Typography', anchor: 'typography' },
      { label: 'Spacing', anchor: 'spacing' },
    ],
  },
  {
    category: 'Components',
    items: [
      { label: 'Button', anchor: 'button' },
      { label: 'Card', anchor: 'card' },
      { label: 'Badge', anchor: 'badge' },
      { label: 'Input', anchor: 'input' },
      { label: 'Select', anchor: 'select' },
      { label: 'Alert', anchor: 'alert' },
    ],
  },
  {
    category: 'Forms',
    items: [
      { label: 'Field Layout', anchor: 'form-layout' },
      { label: 'Validation', anchor: 'form-validation' },
      { label: 'Server Errors', anchor: 'form-server-errors' },
      { label: 'Disabled Fields', anchor: 'form-disabled' },
    ],
  },
  {
    category: 'Page States',
    items: [
      { label: 'Loading', anchor: 'loading' },
      { label: 'Empty State', anchor: 'empty-state' },
      { label: 'Error State', anchor: 'error-state' },
    ],
  },
  {
    category: 'Feedback',
    items: [
      { label: 'Toast', anchor: 'toast' },
      { label: 'Modal', anchor: 'modal' },
      { label: 'Confirm Dialog', anchor: 'confirm-dialog' },
    ],
  },
  {
    category: 'Data Display',
    items: [
      { label: 'Metric Cards', anchor: 'metric-cards' },
      { label: 'Table', anchor: 'table' },
      { label: 'Charts', anchor: 'charts' },
    ],
  },
];

export function DesignSidebar() {
  return (
    <div className="py-8 px-4">
      <div className="mb-6">
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">
          Dev Only
        </p>
        <h2 className="text-base font-semibold text-foreground">UI Patterns</h2>
        <a
          href="/dashboard"
          className="text-xs text-muted-foreground hover:text-foreground mt-1 inline-block"
        >
          ← Back to app
        </a>
      </div>
      <nav className="space-y-6">
        {navCategories.map(({ category, items }) => (
          <div key={category}>
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
              {category}
            </p>
            <ul className="space-y-1">
              {items.map(({ label, anchor }) => (
                <li key={anchor}>
                  <a
                    href={`#${anchor}`}
                    className="block text-sm text-muted-foreground hover:text-foreground transition-colors py-0.5"
                  >
                    {label}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </nav>
    </div>
  );
}
