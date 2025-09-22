import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import { createBrowserRouter } from "react-router";
import { RouterProvider } from "react-router/dom";
import MainForm from './MainMenu.jsx';

const disableZoomInteractions = () => {
  window.addEventListener('wheel', (event) => {
    if (event.ctrlKey) {
      event.preventDefault();
    }
  }, { passive: false });

  window.addEventListener('keydown', (event) => {
    if (!event.ctrlKey && !event.metaKey) return;
    const blockedKeys = ['+', '-', '=', '_', '0'];
    if (blockedKeys.includes(event.key)) {
      event.preventDefault();
    }
  });

  window.addEventListener('gesturestart', (event) => event.preventDefault());
  window.addEventListener('gesturechange', (event) => event.preventDefault());
  window.addEventListener('touchmove', (event) => {
    if (event.scale && event.scale !== 1) {
      event.preventDefault();
    }
  }, { passive: false });
};

disableZoomInteractions();

const router = createBrowserRouter([
  {
    path: "/",
    element: <App />,
  },
  {
    path: "/main",
    element: <MainForm />,
  },
]);

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <RouterProvider router={router} />
  </StrictMode>
)
