export default function DataTable({
  columns = [],
  rows = [],
  keyField = 'id',
  emptyMessage = 'No records found.',
}) {
  const renderCell = (column, row) =>
    column.render ? column.render(row) : row[column.key]

  return (
    <>
      {/* Phones get readable cards instead of a table that scrolls two screens wide. */}
      <div className="space-y-3 sm:hidden">
        {rows.length === 0 ? (
          <div className="rounded-xl border border-app-border bg-surface px-4 py-10 text-center text-sm text-text-secondary">
            {emptyMessage}
          </div>
        ) : (
          rows.map((row) => (
            <div
              key={row[keyField]}
              className="rounded-xl border border-app-border bg-surface p-4 shadow-sm"
            >
              {columns.map((column, index) => {
                const content = renderCell(column, row)
                if (index === 0) {
                  return (
                    <div key={column.key} className="mb-3 border-b border-app-border pb-3 text-sm font-semibold text-text-primary">
                      {content}
                    </div>
                  )
                }
                if (content === null || content === undefined || content === '') return null

                return (
                  <div key={column.key} className="flex items-start justify-between gap-3 py-1.5 text-sm">
                    <span className="shrink-0 text-xs font-medium uppercase tracking-wide text-text-secondary">
                      {column.label}
                    </span>
                    <span className="min-w-0 text-right">{content}</span>
                  </div>
                )
              })}
            </div>
          ))
        )}
      </div>

      <div className="hidden overflow-x-auto rounded-xl border border-app-border bg-surface sm:block">
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
                      {renderCell(column, row)}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </>
  )
}
