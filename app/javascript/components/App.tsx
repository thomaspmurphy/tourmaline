import React from 'react'
import Header from './Header'
import Router from './Router'

const App: React.FC = () => {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <Header />
      <Router />
    </div>
  )
}

export default App 