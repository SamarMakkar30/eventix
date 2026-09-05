import React from "react";
import { BrowserRouter, Routes, Route, Link } from "react-router-dom";

// Pages will be built out in Phase 7. Each is a placeholder for now so the
// routing skeleton and API client are ready before the UI work begins.
function Home() {
  return <h1>Eventix - Home (movies / events list goes here)</h1>;
}
function Login() {
  return <h1>Login (Phase 7)</h1>;
}

export default function App() {
  return (
    <BrowserRouter>
      <nav>
        <Link to="/">Home</Link> | <Link to="/login">Login</Link>
      </nav>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
      </Routes>
    </BrowserRouter>
  );
}
