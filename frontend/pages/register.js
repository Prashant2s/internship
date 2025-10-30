import { useState } from "react";
import { useRouter } from "next/router";
import Link from "next/link";
import { useAuth } from "../src/context/AuthContext";

export default function Register() {
  const { register: signup } = useAuth();
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await signup({ username, email, password });
      router.push("/");
    } catch (e) {
      console.error("Registration error:", e);
      // Provide more specific error messages
      if (e.response?.data?.error) {
        if (e.response.data.error === "User exists") {
          setError("Username or email already exists. Please try a different one.");
        } else if (e.response.data.error === "Missing fields") {
          setError("Please fill in all required fields.");
        } else {
          setError(e.response.data.error);
        }
      } else if (e.code === "ECONNREFUSED" || e.message?.includes("Network Error")) {
        setError("Cannot connect to server. Please make sure the backend is running.");
      } else {
        setError("Registration failed. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-container">
        <div className="auth-header">
          <h1 className="auth-title">Join the Gaming Community</h1>
          <p className="auth-subtitle">
            Create your account and start finding teammates
          </p>
        </div>

        <form onSubmit={submit} className="auth-form">
          <div className="input-group">
            <label htmlFor="username" className="input-label">
              Username
            </label>
            <input
              id="username"
              type="text"
              placeholder="Choose a username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="auth-input"
              required
            />
          </div>

          <div className="input-group">
            <label htmlFor="email" className="input-label">
              Email
            </label>
            <input
              id="email"
              type="email"
              placeholder="Enter your email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="auth-input"
              required
            />
          </div>

          <div className="input-group">
            <label htmlFor="password" className="input-label">
              Password
            </label>
            <input
              id="password"
              type="password"
              placeholder="Create a password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="auth-input"
              required
            />
          </div>

          {error && <div className="error-message">{error}</div>}

          <button type="submit" className="auth-button" disabled={loading}>
            {loading ? "Creating Account..." : "Create Account"}
          </button>
        </form>

        <div className="auth-footer">
          <p>
            Already have an account?{" "}
            <Link href="/login" className="auth-link-primary">
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
