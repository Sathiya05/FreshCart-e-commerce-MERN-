export default function DataTable({
  columns = [],
  rows = [],
  keyField = 'id',
  emptyMessage = 'No records found.',
}) {
  return (
    <div className="overflow-x-auto rounded-xl border border-app-border bg-surface">
      <table className="w-full min-w-[640px] text-left text-sm">
        <thead className="border-b border-app-border bg-app-background/60">
          <tr>
            {columns.map((column) => (
              <th key={column.key} className="whitespace-nowrap px-4 py-3 text-xs font-semibold uppercase tracking-wide text-text-secondary">
                {column.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.length === 0 ? (
            <tr>
              <td colSpan={columns.length} className="px-4 py-10 text-center text-text-secondary">
                {emptyMessage}
              </td>
            </tr>
          ) : (
            rows.map((row) => (
              <tr key={row[keyField]} className="border-b border-app-border last:border-0 hover:bg-app-background/40">
                {columns.map((column) => (
                  <td key={column.key} className="px-4 py-3 align-middle">
                    {column.render ? column.render(row) : row[column.key]}
                  </td>
                ))}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  )
}
