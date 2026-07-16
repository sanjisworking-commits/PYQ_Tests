type ErrorStateProps = {
  title?: string
  message: string
}

export function ErrorState({
  title = 'Something went wrong',
  message,
}: ErrorStateProps) {
  return (
    <div
      className="rounded-md border border-red-200 bg-red-50 px-4 py-6 text-red-900"
      role="alert"
    >
      <p className="font-medium">{title}</p>
      <p className="mt-1 text-sm">{message}</p>
    </div>
  )
}
