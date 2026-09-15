import { useEffect, useRef, useState } from "react";
import { Html5Qrcode } from "html5-qrcode";
import { useNavigate } from "react-router-dom";
import axios from "axios";

function ScanQR() {
  const [scanResult, setScanResult] = useState(null);
  const [status, setStatus] = useState("");
  const [loading, setLoading] = useState(false);
  const scannerRef = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    const scanner = new Html5Qrcode("qr-reader");
    scannerRef.current = scanner;

    scanner
      .start(
        { facingMode: "environment" },
        { fps: 10, qrbox: 250 },
        (decodedText) => {
          setScanResult(decodedText);
          scanner.stop();
          getLocationAndMark(decodedText);
        },
        (errorMessage) => {
          // scan failure, ignore
        }
      )
      .catch((err) => {
        setStatus("Camera access failed: " + err);
      });

    return () => {
      if (scannerRef.current) {
        scannerRef.current.stop().catch(() => {});
      }
    };
  }, []);

  const getLocationAndMark = (qrToken) => {
    if (!navigator.geolocation) {
      setStatus("Geolocation not supported on this device");
      return;
    }

    navigator.geolocation.getCurrentPosition(
      function (position) {
        const latitude = position.coords.latitude;
        const longitude = position.coords.longitude;
        markAttendance(qrToken, latitude, longitude);
      },
      function (err) {
        setStatus("Location permission denied. Please allow GPS access.");
      }
    );
  };

  const markAttendance = async (qrToken, latitude, longitude) => {
    setLoading(true);
    setStatus("");

    try {
      const token = localStorage.getItem("token");
      const response = await axios.post(
        "http://localhost:8000/attendance/mark",
        { qrToken: qrToken, latitude: latitude, longitude: longitude },
        { headers: { Authorization: "Bearer " + token } }
      );

      setStatus("Attendance Marked Successfully!");
    } catch (err) {
      const msg =
        err.response && err.response.data && err.response.data.message
          ? err.response.data.message
          : "Something went wrong";
      setStatus(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.container}>
      <h2>Scan Attendance QR</h2>

      {!scanResult && <div id="qr-reader" style={styles.qrBox}></div>}

      {loading && <p>Marking attendance...</p>}

      {status && (
        <p
          style={
            status.indexOf("Successfully") !== -1
              ? styles.success
              : styles.error
          }
        >
          {status}
        </p>
      )}

      <button style={styles.backButton} onClick={function () { navigate("/"); }}>
        Back to Login
      </button>
    </div>
  );
}

const styles = {
  container: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    padding: "30px",
    fontFamily: "sans-serif",
  },
  qrBox: {
    width: "300px",
    marginTop: "20px",
  },
  success: {
    color: "green",
    fontWeight: "bold",
    marginTop: "15px",
  },
  error: {
    color: "red",
    fontWeight: "bold",
    marginTop: "15px",
  },
  backButton: {
    marginTop: "20px",
    padding: "8px 16px",
    background: "#4f46e5",
    color: "#fff",
    border: "none",
    borderRadius: "5px",
    cursor: "pointer",
  },
};

export default ScanQR;