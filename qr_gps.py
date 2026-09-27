import qrcode
import datetime
current_time = datetime.datetime.now().strftime("%Y-%m-%d %H:%M:%S")
session_id = "class101"
qr_data = f"{session_id}|{current_time}"
qr = qrcode.make(qr_data)
qr.save("session_qr.png")
print("QR Data:", qr_data)
print("QR code generated successfully!")
import time
def is_qr_valid(qr_data, expiry_seconds=30):
    session, timestamp_str = qr_data.split("|")
    qr_time = datetime.datetime.strptime(timestamp_str, "%Y-%m-%d %H:%M:%S")
    now = datetime.datetime.now()
    time_diff = (now - qr_time).total_seconds()
    if time_diff <= expiry_seconds:
        return True
    else:
        return False
result = is_qr_valid(qr_data)
print("Is QR valid?", result)
import math

def calculate_distance(lat1, lon1, lat2, lon2):
    R = 6371000  # Earth radius in meters
    phi1 = math.radians(lat1)
    phi2 = math.radians(lat2)
    delta_phi = math.radians(lat2 - lat1)
    delta_lambda = math.radians(lon2 - lon1)

    a = math.sin(delta_phi/2)**2 + math.cos(phi1)*math.cos(phi2)*math.sin(delta_lambda/2)**2
    c = 2*math.atan2(math.sqrt(a), math.sqrt(1-a))
    
    distance = R * c
    return distance

# Test - college location vs student location
college_lat, college_lon = 9.1234, 77.5678   # unga college coordinates போடுங்க
student_lat, student_lon = 9.1236, 77.5680   # test student location

dist = calculate_distance(college_lat, college_lon, student_lat, student_lon)
print(f"Distance: {dist:.2f} meters")

if dist <= 100:
    print("Student is within campus - Present allowed")
else:
    print("Student is too far - Absent")