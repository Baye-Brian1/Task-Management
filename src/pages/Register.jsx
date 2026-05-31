import { Link, useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import { auth, provider } from "../firebase";
import {
  signInWithPopup,
  createUserWithEmailAndPassword,
  updateProfile,
} from "firebase/auth";
import { User, Mail, Lock, UserPlus, Eye, EyeOff } from "lucide-react";
import "../Auth.css";

const API_URL = "http://localhost:5000";

export default function Register() {
  const navigate = useNavigate();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((user) => {
      if (user) navigate("/dashboard");
    });
    return () => unsubscribe();
  }, [navigate]);

  const saveUserToBackend = async (uid, name, email) => {
    try {
      const res = await fetch(`${API_URL}/api/users/firebase-register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ uid, name, email }),
      });
      const data = await res.json();
      console.log("User saved to backend:", data);
    } catch (err) {
      console.error("Failed to save user to backend:", err);
    }
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        email,
        password,
      );
      await updateProfile(userCredential.user, { displayName: name });
      await saveUserToBackend(userCredential.user.uid, name, email);
      navigate("/dashboard");
    } catch (error) {
      console.error("Registration error:", error.code, error.message);
      let errorMessage = "Failed to create account. Please try again.";
      switch (error.code) {
        case "auth/email-already-in-use":
          errorMessage =
            "This email is already registered. Please login instead.";
          break;
        case "auth/weak-password":
          errorMessage = "Password should be at least 6 characters.";
          break;
        case "auth/invalid-email":
          errorMessage = "Please enter a valid email address.";
          break;
        case "auth/operation-not-allowed":
          errorMessage =
            "Email/Password sign up is disabled. Please enable it in Firebase Console.";
          break;
        default:
          errorMessage = error.message;
      }
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignup = async () => {
    setError("");
    setLoading(true);
    try {
      const result = await signInWithPopup(auth, provider);
      await saveUserToBackend(
        result.user.uid,
        result.user.displayName,
        result.user.email,
      );
      navigate("/dashboard");
    } catch (error) {
      console.error("Google signup error:", error.code, error.message);
      let errorMessage = "Google sign up failed.";
      if (error.code === "auth/popup-closed-by-user") {
        errorMessage = "Sign up cancelled. Please try again.";
      } else if (
        error.code === "auth/account-exists-with-different-credential"
      ) {
        errorMessage =
          "An account already exists with this email. Please sign in with email and password.";
      } else {
        errorMessage = error.message;
      }
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-card">
        <div className="auth-logo">
          <span className="logo-icon">✓</span>
          <h1>Taski</h1>
        </div>
        <p className="auth-subtitle">Get started with Taski today</p>

        {error && <div className="auth-error">{error}</div>}

        <form onSubmit={handleRegister}>
          <div className="input-group">
            <User size={20} />
            <input
              type="text"
              placeholder="Full name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>
          <div className="input-group">
            <Mail size={20} />
            <input
              type="email"
              placeholder="Email address"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          <div className="input-group">
            <Lock size={20} />
            <input
              type={showPassword ? "text" : "password"}
              placeholder="Password (min. 6 characters)"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength="6"
            />
            <button
              type="button"
              className="password-toggle"
              onClick={() => setShowPassword(!showPassword)}
            >
              {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>
          <button type="submit" className="auth-btn" disabled={loading}>
            <UserPlus size={18} />
            {loading ? "Creating account..." : "Create account"}
          </button>
        </form>

        <div className="auth-divider">
          <span></span>
          <span>Or continue with</span>
          <span></span>
        </div>

        <button
          type="button"
          className="google-btn"
          onClick={handleGoogleSignup}
          disabled={loading}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
            <path
              d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              fill="#4285F4"
            />
            <path
              d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              fill="#34A853"
            />
            <path
              d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
              fill="#FBBC05"
            />
            <path
              d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
              fill="#EA4335"
            />
          </svg>
          Sign up with Google
        </button>

        <p className="auth-bottom-text">
          Already have an account? <Link to="/">Sign in</Link>
        </p>
      </div>
    </div>
  );
}
