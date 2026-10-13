export async function fetchUser(): Promise<{ roles: string[] }> {
  const response = await fetch('/api/user')
  return response.json()
}
