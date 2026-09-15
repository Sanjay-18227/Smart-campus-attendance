import { BrowserRouter, Routes, Route } from "react-router-dom";
import Login from "./pages/Login";
import ScanQR from "./pages/ScanQR";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Login />} />
        <Route path="/scan" element={<ScanQR />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
