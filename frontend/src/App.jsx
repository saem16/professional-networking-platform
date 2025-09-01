import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from 'react-router-dom';
import SignIn from './pages/SignIn';
import SignUp from './pages/SignUp';
import Home from './pages/Home';
import NotFound from './pages/NotFound';
import ProtectedRoute from './ProtectedRoute';

const App = () => {

  return (
    <Router>
      <Routes>
        <Route
          path="/*"
          element={
            <ProtectedRoute>
              <Home />
            </ProtectedRoute>
          }
        />

        <Route path="/signin" element={<SignIn />} />
        <Route path="/signup" element={<SignUp />} />

        <Route path="/sign" element={<Navigate to="/signin" />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </Router>

  );
}
export default App;
