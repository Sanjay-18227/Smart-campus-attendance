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