import React, { useState, useEffect } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { RootState } from '../store'
import { Button } from './ui/button'
import AuthModal from './AuthModal'
import { apiService } from '../services/api'
import { setCurrentUser, setLoading, logout as logoutAction } from '../store/slices/usersSlice'

const Header: React.FC = () => {
  const dispatch = useDispatch()
  const { currentUser, isAuthenticated } = useSelector((state: RootState) => state.users)
  const [authModalOpen, setAuthModalOpen] = useState(false)

  useEffect(() => {
    // Check if user is already authenticated on app load
    const checkAuth = async () => {
      if (apiService.isAuthenticated()) {
        try {
          dispatch(setLoading(true))
          const user = await apiService.getCurrentUser()
          dispatch(setCurrentUser(user))
        } catch {
          // Token might be expired, clear it
          await apiService.logout()
          dispatch(logoutAction())
        }
      }
    }

    checkAuth()
  }, [dispatch])

  const handleLogout = async () => {
    await apiService.logout()
    dispatch(logoutAction())
  }

  return (
    <>
      <header className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold tourmaline-text">
              tourmaline
            </h1>
            <p className="text-sm text-muted-foreground">dynamic async realtime discussions</p>
          </div>
          
          <div className="flex items-center gap-4">
            {isAuthenticated && currentUser ? (
              <>
                <span className="text-sm text-muted-foreground">
                  Welcome, {currentUser.username}
                </span>
                <Button variant="outline" onClick={handleLogout}>
                  Logout
                </Button>
              </>
            ) : (
              <Button onClick={() => setAuthModalOpen(true)}>
                Login / Sign Up
              </Button>
            )}
          </div>
        </div>
      </header>
      
      <AuthModal 
        open={authModalOpen} 
        onOpenChange={setAuthModalOpen} 
      />
    </>
  )
}

export default Header 