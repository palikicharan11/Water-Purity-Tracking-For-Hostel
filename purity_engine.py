"""
Water Purity Tracker for Hostel - Core Chemistry & Data Engine
===============================================================
Combined Subjects: Engineering Chemistry + Programming (Python) + IT Workshop
R23 Alignment: Sem-II Chemistry + Sem-I Programming

This script implements:
1. BIS IS:10500 / WHO Standard Water Quality Evaluation
2. Weighted Arithmetic Water Quality Index (WQI) Calculation
3. CSV File Handling (Read, Write, Append, Summary Reports)
4. AI Advisory Matrix for Purification Recommendations
5. Auto-Starting Local HTTP Web Server & Browser Launch
"""

import csv
import os
import json
import http.server
import socketserver
import threading
import webbrowser
import time
from datetime import datetime

CSV_FILE = "water_data.csv"
PORT = 8080

# BIS IS:10500 / WHO Standard Permissible & Ideal Limits
# Format: (Ideal Value, Permissible Limit, Weightage Wi)
STANDARDS = {
    "pH": {"ideal": 7.0, "limit": 8.5, "min_limit": 6.5, "weight": 4, "unit": ""},
    "TDS_mg_L": {"ideal": 100, "limit": 500, "weight": 5, "unit": "mg/L"},
    "Turbidity_NTU": {"ideal": 0.5, "limit": 5.0, "weight": 3, "unit": "NTU"},
    "Hardness_mg_L": {"ideal": 100, "limit": 300, "weight": 3, "unit": "mg/L"},
    "Chlorine_mg_L": {"ideal": 0.2, "limit": 1.0, "weight": 2, "unit": "mg/L"},
    "Nitrates_mg_L": {"ideal": 10, "limit": 45, "weight": 4, "unit": "mg/L"},
    "Fluoride_mg_L": {"ideal": 0.8, "limit": 1.5, "weight": 4, "unit": "mg/L"},
    "Coliform_MPN": {"ideal": 0, "limit": 0, "weight": 5, "unit": "MPN/100ml"},
}

def calculate_wqi(data):
    """
    Calculates Water Quality Index (WQI) using Weighted Arithmetic Method.
    WQI = Sum(Qi * Wi) / Sum(Wi)
    Where Qi = ((V_actual - V_ideal) / (S_limit - V_ideal)) * 100
    For pH: Qi = ((pH - 7.0) / (8.5 - 7.0)) * 100  (or 6.5 for lower bound)
    """
    total_wi_qi = 0
    total_wi = 0

    for param, info in STANDARDS.items():
        val = data.get(param, 0)
        limit = info["limit"]
        ideal = info["ideal"]
        weight = info["weight"]

        if param == "pH":
            if val < 7.0:
                q_i = ((val - 7.0) / (6.5 - 7.0)) * 100
            else:
                q_i = ((val - 7.0) / (8.5 - 7.0)) * 100
        elif param == "Coliform_MPN":
            q_i = 0 if val == 0 else (val * 100)
        else:
            q_i = ((val - ideal) / max((limit - ideal), 0.1)) * 100

        q_i = max(0, q_i)  # Ensure non-negative quality rating
        total_wi_qi += q_i * weight
        total_wi += weight

    wqi = total_wi_qi / total_wi if total_wi > 0 else 0
    wqi_score = round(max(0, 100 - (wqi * 0.5)), 1)
    return wqi_score

def evaluate_status(wqi_score):
    """Maps WQI score to drinking water safety categories."""
    if wqi_score >= 90:
        return "Excellent (Safe Drinking Water)"
    elif wqi_score >= 75:
        return "Good (Acceptable for Use)"
    elif wqi_score >= 50:
        return "Poor (Requires Purification)"
    elif wqi_score >= 25:
        return "Very Poor (Unsafe for Drinking)"
    else:
        return "Unsuitable for Human Consumption"

def generate_ai_purification_advice(data):
    """
    AI Advisory Engine: Generates targeted purification recommendations 
    based on exact chemical parameter anomalies.
    """
    advice = []
    
    # pH Analysis
    ph = data.get("pH", 7.0)
    if ph < 6.5:
        advice.append("[WARNING] Acidic Water (pH < 6.5): Install a Soda Ash / Calcite Neutralizing Filter to raise pH and prevent pipe corrosion.")
    elif ph > 8.5:
        advice.append("[WARNING] Alkaline Water (pH > 8.5): Use Citric Acid injection or RO treatment to neutralize high alkalinity.")

    # TDS Analysis
    tds = data.get("TDS_mg_L", 0)
    if tds > 500:
        advice.append("[ALERT] High Total Dissolved Solids (TDS > 500 mg/L): Deploy a Reverse Osmosis (RO) Purification Plant to remove excess dissolved salts.")

    # Turbidity Analysis
    turbidity = data.get("Turbidity_NTU", 0)
    if turbidity > 5.0:
        advice.append("[WARNING] High Turbidity (> 5 NTU): Use Alum (Aluminum Sulfate) Coagulation followed by Sand Bed Filtration to clarify suspended matter.")

    # Hardness Analysis
    hardness = data.get("Hardness_mg_L", 0)
    if hardness > 300:
        advice.append("[WARNING] High Water Hardness (> 300 mg/L Ca/Mg): Implement an Ion-Exchange Water Softener to prevent scaling in hostel boilers and pipes.")

    # Nitrates & Fluoride
    nitrates = data.get("Nitrates_mg_L", 0)
    if nitrates > 45:
        advice.append("[CRITICAL] High Nitrates (> 45 mg/L): Anion Exchange or RO Filtration is urgently required to prevent methemoglobinemia risk.")

    fluoride = data.get("Fluoride_mg_L", 0)
    if fluoride > 1.5:
        advice.append("[WARNING] Excess Fluoride (> 1.5 mg/L): Use Nalgonda Technique (Alum + Lime) or Activated Alumina Defluoridation.")

    # Biological Contamination
    coliform = data.get("Coliform_MPN", 0)
    if coliform > 0:
        advice.append("[CRITICAL] Biological Contamination Detected (Coliform > 0): Immediate Shock Chlorination (0.5-1.0 ppm free chlorine) and UV Disinfection required!")

    if not advice:
        advice.append("[SAFE] Water Quality is Optimal! All parameters conform to WHO & BIS IS:10500 standards. Regular routine maintenance recommended.")

    return advice

def load_records(filename=CSV_FILE):
    """Loads all records from CSV file."""
    if not os.path.exists(filename):
        return []
    records = []
    with open(filename, mode='r', newline='', encoding='utf-8') as file:
        reader = csv.DictReader(file)
        for row in reader:
            records.append(row)
    return records

def save_record(location, data_dict, filename=CSV_FILE):
    """Appends a new test record to the CSV file."""
    wqi = calculate_wqi(data_dict)
    status = evaluate_status(wqi)
    today = datetime.now().strftime("%Y-%m-%d")

    file_exists = os.path.exists(filename)
    
    fieldnames = ["Date", "Location", "pH", "TDS_mg_L", "Turbidity_NTU", "Hardness_mg_L", 
                  "Chlorine_mg_L", "Nitrates_mg_L", "Fluoride_mg_L", "Coliform_MPN", "WQI", "Status"]

    new_row = {
        "Date": today,
        "Location": location,
        "pH": data_dict["pH"],
        "TDS_mg_L": data_dict["TDS_mg_L"],
        "Turbidity_NTU": data_dict["Turbidity_NTU"],
        "Hardness_mg_L": data_dict["Hardness_mg_L"],
        "Chlorine_mg_L": data_dict["Chlorine_mg_L"],
        "Nitrates_mg_L": data_dict["Nitrates_mg_L"],
        "Fluoride_mg_L": data_dict["Fluoride_mg_L"],
        "Coliform_MPN": data_dict["Coliform_MPN"],
        "WQI": wqi,
        "Status": status
    }

    with open(filename, mode='a', newline='', encoding='utf-8') as file:
        writer = csv.DictWriter(file, fieldnames=fieldnames)
        if not file_exists:
            writer.writeheader()
        writer.writerow(new_row)

    return new_row

def start_http_server(port=PORT):
    """Starts an HTTP web server serving index.html and REST API endpoints on localhost."""
    class CustomHTTPRequestHandler(http.server.SimpleHTTPRequestHandler):
        def log_message(self, format, *args):
            pass  # Suppress HTTP request logs to keep CLI summary clean

        def do_OPTIONS(self):
            self.send_response(200)
            self.send_header('Access-Control-Allow-Origin', '*')
            self.send_header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
            self.send_header('Access-Control-Allow-Headers', 'Content-Type')
            self.end_headers()

        def do_GET(self):
            if self.path == '/api/records':
                records = load_records()
                data = json.dumps(records).encode('utf-8')
                self.send_response(200)
                self.send_header('Content-Type', 'application/json')
                self.send_header('Access-Control-Allow-Origin', '*')
                self.send_header('Content-Length', str(len(data)))
                self.end_headers()
                self.wfile.write(data)
            else:
                super().do_GET()

        def do_POST(self):
            if self.path == '/api/save':
                content_length = int(self.headers.get('Content-Length', 0))
                body = self.rfile.read(content_length)
                try:
                    payload = json.loads(body.decode('utf-8'))
                    location = payload.get("location", "Hostel Sump")
                    data_dict = payload.get("data", {})
                    
                    clean_data = {
                        "pH": float(data_dict.get("pH", 7.0)),
                        "TDS_mg_L": float(data_dict.get("TDS_mg_L", 100)),
                        "Turbidity_NTU": float(data_dict.get("Turbidity_NTU", 1.0)),
                        "Hardness_mg_L": float(data_dict.get("Hardness_mg_L", 100)),
                        "Chlorine_mg_L": float(data_dict.get("Chlorine_mg_L", 0.5)),
                        "Nitrates_mg_L": float(data_dict.get("Nitrates_mg_L", 10)),
                        "Fluoride_mg_L": float(data_dict.get("Fluoride_mg_L", 0.8)),
                        "Coliform_MPN": float(data_dict.get("Coliform_MPN", 0)),
                    }
                    new_row = save_record(location, clean_data)
                    resp = json.dumps({"status": "success", "record": new_row}).encode('utf-8')
                    self.send_response(200)
                    self.send_header('Content-Type', 'application/json')
                    self.send_header('Access-Control-Allow-Origin', '*')
                    self.send_header('Content-Length', str(len(resp)))
                    self.end_headers()
                    self.wfile.write(resp)
                except Exception as e:
                    err_resp = json.dumps({"status": "error", "message": str(e)}).encode('utf-8')
                    self.send_response(400)
                    self.send_header('Content-Type', 'application/json')
                    self.send_header('Access-Control-Allow-Origin', '*')
                    self.send_header('Content-Length', str(len(err_resp)))
                    self.end_headers()
                    self.wfile.write(err_resp)
            else:
                self.send_response(404)
                self.end_headers()

    try:
        socketserver.TCPServer.allow_reuse_address = True
        with socketserver.TCPServer(("", port), CustomHTTPRequestHandler) as httpd:
            print(f" [SERVER ACTIVE] Serving web app & API on http://localhost:{port} (Press Ctrl+C to stop)...")
            httpd.serve_forever()
    except OSError as e:
        print(f" [SERVER NOTICE] Port {port} address already in use: {e}")

def print_summary_report():
    """Prints a styled CLI summary table of all recorded hostel water tests."""
    records = load_records()
    print("\n" + "="*80)
    print(" WATER PURITY TRACKER FOR HOSTEL - SUMMARY REPORT (BIS IS:10500)")
    print("="*80)
    print(f" [WEB DASHBOARD SERVER] : http://localhost:{PORT}")
    print(" [CSV DATAFILE PATH]    : water_data.csv")
    print("="*80)
    if not records:
        print("No records found in CSV file.")
        return

    print(f"{'Date':<12} | {'Location':<25} | {'pH':<5} | {'TDS':<6} | {'WQI':<6} | {'Status'}")
    print("-" * 80)
    for r in records:
        print(f"{r['Date']:<12} | {r['Location']:<25} | {r['pH']:<5} | {r['TDS_mg_L']:<6} | {r['WQI']:<6} | {r['Status']}")
    print("="*80 + "\n")

if __name__ == "__main__":
    print_summary_report()
    
    # Run test evaluation sample
    sample_test = {
        "pH": 7.4,
        "TDS_mg_L": 420,
        "Turbidity_NTU": 3.2,
        "Hardness_mg_L": 260,
        "Chlorine_mg_L": 0.3,
        "Nitrates_mg_L": 22,
        "Fluoride_mg_L": 1.1,
        "Coliform_MPN": 0
    }
    wqi = calculate_wqi(sample_test)
    status = evaluate_status(wqi)
    print(f"Sample Calculation -> WQI: {wqi} | Status: {status}")
    print("\nAI Purification Advice Matrix:")
    for advice in generate_ai_purification_advice(sample_test):
        print(f"  * {advice}")

    # Automatically launch browser to http://localhost:8080
    print("\n" + "="*80)
    print(f" [AUTOMATIC LAUNCH] Opening Web App at http://localhost:{PORT} in your browser...")
    print("="*80 + "\n")
    
    try:
        webbrowser.open(f"http://localhost:{PORT}")
    except Exception:
        pass

    # Start HTTP Web Server & REST API (blocking main thread)
    start_http_server(PORT)
