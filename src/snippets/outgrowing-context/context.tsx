// #region show
export function App() {
  return (
    <CartProvider>
      <UserProvider>
        <FiltersProvider>
          <main>App</main>
        </FiltersProvider>
      </UserProvider>
    </CartProvider>
  )
}
// #endregion
function CartProvider({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
function UserProvider({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
function FiltersProvider({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
