import React, { useState } from 'react'
import { useDispatch } from 'react-redux'
import { Button } from './ui/button'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from './ui/dialog'
import { Input } from './ui/input'
import { Label } from './ui/label'
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs'
import { apiService, LoginCredentials, SignupCredentials } from '../services/api'
import { setCurrentUser, setLoading, setError } from '../store/slices/usersSlice'

interface AuthModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

const AuthModal: React.FC<AuthModalProps> = ({ open, onOpenChange }) => {
  const dispatch = useDispatch()
  const [loginData, setLoginData] = useState<LoginCredentials>({
    email: '',
    password: ''
  })
  const [signupData, setSignupData] = useState<SignupCredentials>({
    email: '',
    password: '',
    password_confirmation: '',
    username: ''
  })
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    dispatch(setLoading(true))

    try {
      const { user } = await apiService.login(loginData)
      dispatch(setCurrentUser(user))
      onOpenChange(false)
      setLoginData({ email: '', password: '' })
    } catch (error) {
      dispatch(setError(error instanceof Error ? error.message : 'Login failed'))
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault()
    if (signupData.password !== signupData.password_confirmation) {
      dispatch(setError('Passwords do not match'))
      return
    }

    setIsSubmitting(true)
    dispatch(setLoading(true))

    try {
      const { user } = await apiService.signup(signupData)
      dispatch(setCurrentUser(user))
      onOpenChange(false)
      setSignupData({ email: '', password: '', password_confirmation: '', username: '' })
    } catch (error) {
      dispatch(setError(error instanceof Error ? error.message : 'Signup failed'))
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Welcome to Tourmaline Forum</DialogTitle>
        </DialogHeader>
        
        <Tabs defaultValue="login" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="login">Login</TabsTrigger>
            <TabsTrigger value="signup">Sign Up</TabsTrigger>
          </TabsList>
          
          <TabsContent value="login">
            <form onSubmit={handleLogin} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="login-email">Email</Label>
                <Input
                  id="login-email"
                  type="email"
                  value={loginData.email}
                  onChange={(e) => setLoginData({ ...loginData, email: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="login-password">Password</Label>
                <Input
                  id="login-password"
                  type="password"
                  value={loginData.password}
                  onChange={(e) => setLoginData({ ...loginData, password: e.target.value })}
                  required
                />
              </div>
              <Button type="submit" disabled={isSubmitting} className="w-full">
                {isSubmitting ? 'Logging in...' : 'Login'}
              </Button>
            </form>
          </TabsContent>
          
          <TabsContent value="signup">
            <form onSubmit={handleSignup} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="signup-username">Username</Label>
                <Input
                  id="signup-username"
                  value={signupData.username}
                  onChange={(e) => setSignupData({ ...signupData, username: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="signup-email">Email</Label>
                <Input
                  id="signup-email"
                  type="email"
                  value={signupData.email}
                  onChange={(e) => setSignupData({ ...signupData, email: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="signup-password">Password</Label>
                <Input
                  id="signup-password"
                  type="password"
                  value={signupData.password}
                  onChange={(e) => setSignupData({ ...signupData, password: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="signup-password-confirmation">Confirm Password</Label>
                <Input
                  id="signup-password-confirmation"
                  type="password"
                  value={signupData.password_confirmation}
                  onChange={(e) => setSignupData({ ...signupData, password_confirmation: e.target.value })}
                  required
                />
              </div>
              <Button type="submit" disabled={isSubmitting} className="w-full">
                {isSubmitting ? 'Creating account...' : 'Sign Up'}
              </Button>
            </form>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  )
}

export default AuthModal 