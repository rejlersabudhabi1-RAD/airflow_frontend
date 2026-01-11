import { render, screen } from '@testing-library/react'
import { BrowserRouter } from 'react-router-dom'
import { Provider } from 'react-redux'
import { configureStore } from '@reduxjs/toolkit'
import Home from '../../frontend/src/pages/Home'
import authReducer from '../../frontend/src/store/slices/authSlice'

/**
 * Home Component Tests
 */

const createMockStore = () => {
  return configureStore({
    reducer: {
      auth: authReducer,
    },
  })
}

describe('Home Component', () => {
  it('renders welcome message', () => {
    const store = createMockStore()
    
    render(
      <Provider store={store}>
        <BrowserRouter>
          <Home />
        </BrowserRouter>
      </Provider>
    )
    
    expect(screen.getByText(/Welcome to AIFlow/i)).toBeInTheDocument()
  })

  it('renders feature cards', () => {
    const store = createMockStore()
    
    render(
      <Provider store={store}>
        <BrowserRouter>
          <Home />
        </BrowserRouter>
      </Provider>
    )
    
    expect(screen.getByText(/Fast & Modern/i)).toBeInTheDocument()
    expect(screen.getByText(/Secure/i)).toBeInTheDocument()
    expect(screen.getByText(/Scalable/i)).toBeInTheDocument()
  })

  it('renders action buttons', () => {
    const store = createMockStore()
    
    render(
      <Provider store={store}>
        <BrowserRouter>
          <Home />
        </BrowserRouter>
      </Provider>
    )
    
    expect(screen.getByText('Get Started')).toBeInTheDocument()
    expect(screen.getByText('Sign In')).toBeInTheDocument()
  })
})
