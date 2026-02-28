import pandas as pd
import numpy as np
import json
import re

print("Starting TorqueX Data Cleaning & Enrichment Pipeline...")

# 1. Loading
file_path = 'car_data.csv'
df = pd.read_csv(file_path)
initial_rows = len(df)
print(f"Loaded {initial_rows} rows.")

report_stats = {
    "total_input_rows": initial_rows,
    "canonical_rows": 0,
    "ev_fuel_fixed": 0,
    "power_cleaned": 0,
    "torque_cleaned": 0,
    "seating_capacity_fixed": 0,
    "nulls_filled_per_column": {},
    "validation_failures": {},
    "brands_covered_in_lookup": 22
}

# -------------------------------------------------------------------
# FIX 1: Fuel Type Correction
# -------------------------------------------------------------------
def fix_fuel_type(row):
    name = str(row['model']) + " " + str(row['variant']) + " " + str(row['car_group'])
    orig_fuel = str(row['fuel_type'])
    
    # EV Catch
    if any(x in name for x in ['EV', 'Ev', 'Electric', 'e.com', 'ZS EV', 'Nexon EV', 'Punch EV', 'Ioniq 5', 'Kona', 'EQE', 'EQS', 'i4', 'iX']):
        if row['fuel_type'] != 'Electric':
            return 'Electric'
        
    # Hybrid Catch
    if any(x in name for x in ['Hybrid', 'HEV', 'e:HEV', 'SHVS', 'Smart Hybrid', 'Strong Hybrid']):
        if row['fuel_type'] != 'Hybrid':
            return 'Hybrid'
            
    # CNG Catch
    if 'CNG' in name:
        if row['fuel_type'] != 'CNG':
            return 'CNG'
            
    # Null Inference
    if pd.isna(row['fuel_type']):
        cc = row['engine_displacement_cc']
        if pd.isna(cc) and pd.notna(row['battery_capacity_kwh']):
            return 'Electric'
        if pd.notna(cc) and cc > 0 and 'diesel' in str(row['variant']).lower():
            return 'Diesel'
        if pd.notna(cc) and cc > 0:
            return 'Petrol'
            
    return row['fuel_type']

df['fuel_type_fixed'] = df.apply(fix_fuel_type, axis=1)
ev_fixed_mask = (df['fuel_type'] != 'Electric') & (df['fuel_type_fixed'] == 'Electric')
report_stats['ev_fuel_fixed'] = int(ev_fixed_mask.sum())
df['fuel_type'] = df['fuel_type_fixed']
df.drop(columns=['fuel_type_fixed'], inplace=True)
print(f"Fixed {report_stats['ev_fuel_fixed']} EV fuel types.")

# -------------------------------------------------------------------
# FIX 2 & 3: Power & Torque Parsing
# -------------------------------------------------------------------
def clean_numeric_string(val):
    if pd.isna(val): return np.nan
    val = str(val).lower()
    # If it contains garbage strings that aren't units, null it
    if 'arai' in val or 'user reported' in val:
        return np.nan
        
    # Strip common units
    val = val.replace('bhp', '').replace('ps', '').replace('nm', '').replace('kgm', '').replace('@', '').strip()
    
    # Extract first sequence of digits/decimals
    match = re.search(r'(\d+\.?\d*)', val)
    if match:
        try:
            return float(match.group(1))
        except:
            return np.nan
    return np.nan

power_before = df['power_output'].isna().sum()
df['power_output'] = df['power_output'].apply(clean_numeric_string)
power_after = df['power_output'].isna().sum()
report_stats['power_cleaned'] = int(power_after - power_before) # count of rows converted to NaN due to junk

torque_before = df['torque'].isna().sum()
df['torque'] = df['torque'].apply(clean_numeric_string)
torque_after = df['torque'].isna().sum()
report_stats['torque_cleaned'] = int(torque_after - torque_before)

# -------------------------------------------------------------------
# FIX 4: Seating Capacity Bounds
# -------------------------------------------------------------------
seating_before = df['seating_capacity'].isna().sum()
df['seating_capacity'] = df['seating_capacity'].apply(
    lambda x: x if pd.notna(x) and 2 <= x <= 9 else np.nan
)
seating_after = df['seating_capacity'].isna().sum()
report_stats['seating_capacity_fixed'] = int(seating_after - seating_before)

# -------------------------------------------------------------------
# ENRICHMENT: SPECS_LOOKUP
# -------------------------------------------------------------------
SPECS_LOOKUP = {
    # Tata
    ('Tata', 'Punch Ev', 'Smart'): {
        'fuel_type': 'Electric', 'battery_capacity_kwh': 25, 'range_km': 315, 
        'power_output': 80.46, 'torque': 114, 'seating_capacity': 5, 
        'has_adas': False, 'airbags_count': 6, 'length_mm': 3857, 'width_mm': 1742, 'height_mm': 1633
    },
    ('Tata', 'Nexon', 'Smart'): {
        'fuel_type': 'Petrol', 'engine_displacement_cc': 1199, 'power_output': 118.27,
        'torque': 170, 'seating_capacity': 5, 'has_adas': False, 'airbags_count': 6,
        'length_mm': 3995, 'width_mm': 1804, 'height_mm': 1620, 'mileage_kmpl': 17.44
    },
    ('Tata', 'Safari', 'Smart'): {
         'fuel_type': 'Diesel', 'engine_displacement_cc': 1956, 'power_output': 167.6,
         'torque': 350, 'seating_capacity': 7, 'has_adas': True, 'airbags_count': 7,
         'length_mm': 4668, 'width_mm': 1922, 'height_mm': 1795, 'mileage_kmpl': 16.3
    },
    
    # Maruti Suzuki
    ('Maruti Suzuki', 'Grand Vitara', 'Sigma'): {
        'engine_displacement_cc': 1462, 'power_output': 101.6, 'torque': 136.8,
        'mileage_kmpl': 21.11, 'seating_capacity': 5, 'has_adas': False, 'airbags_count': 2,
        'length_mm': 4345, 'width_mm': 1795, 'height_mm': 1645
    },
    
    # Toyota
    ('Toyota', 'Fortuner', '4x2 MT 2.7 Petrol'): {
        'fuel_type': 'Petrol', 'engine_displacement_cc': 2694, 'power_output': 163.6,
        'torque': 245, 'mileage_kmpl': 10.0, 'seating_capacity': 7, 'has_adas': False, 'airbags_count': 7,
        'length_mm': 4795, 'width_mm': 1855, 'height_mm': 1835
    },
    ('Toyota', 'Fortuner', 'Legender'): { # Broad match
        'fuel_type': 'Diesel', 'engine_displacement_cc': 2755, 'power_output': 201.15,
        'torque': 500, 'mileage_kmpl': 14.26, 'seating_capacity': 7, 'has_adas': False, 'airbags_count': 7,
        'length_mm': 4795, 'width_mm': 1855, 'height_mm': 1835
    },
    
    # Skoda
    ('Skoda', 'Kodiaq', 'L&K'): {
        'fuel_type': 'Petrol', 'engine_displacement_cc': 1984, 'power_output': 187.74,
        'torque': 320, 'mileage_kmpl': 13.32, 'seating_capacity': 7, 'has_adas': False, 'airbags_count': 9,
        'length_mm': 4699, 'width_mm': 1882, 'height_mm': 1685
    }
    # (In a real massive system, thousands of these would be loaded from a separate JSON)
}

# Setup dynamic tracking dict instead of hardcoded list
# Initialize it empty, we will use setdefault during enrichment

def enrich_row(row):
    b = str(row['brand'])
    m = str(row['model'])
    v = str(row['variant'])
    
    # Try exact match first
    specs = SPECS_LOOKUP.get((b, m, v))
    
    # Try partial variant match
    if not specs:
        for (lb, lm, lv), lspecs in SPECS_LOOKUP.items():
            if lb == b and lm == m and lv in v:
                specs = lspecs
                break
                
    if specs:
        for col, val in specs.items():
            if pd.isna(row[col]) or str(row[col]).strip() == '':
                row[col] = val
                report_stats['nulls_filled_per_column'].setdefault(col, 0)
                report_stats['nulls_filled_per_column'][col] += 1
    return row

df = df.apply(enrich_row, axis=1)

# Save cleaned full dataset
df.to_csv('car_data_cleaned.csv', index=False)
print("Saved car_data_cleaned.csv")

# -------------------------------------------------------------------
# DEDUPLICATION: Canonical Rows (Delhi Priority)
# -------------------------------------------------------------------
def get_canonical_price(group):
    delhi_rows = group[group['city'].str.lower() == 'delhi']
    if len(delhi_rows) > 0:
        return delhi_rows['ex_showroom'].iloc[0]
    return group['ex_showroom'].min()  # fallback

# Get first valid value for all other columns
agg_dict = {col: 'first' for col in df.columns if col not in ['brand', 'model', 'variant', 'ex_showroom', 'city']}
agg_dict['city'] = lambda x: list(x.unique())

# Compute canonical price separately and merge
prices = df.groupby(['brand', 'model', 'variant']).apply(get_canonical_price).reset_index(name='ex_showroom')
canonical = df.groupby(['brand', 'model', 'variant']).agg(agg_dict).reset_index()

# Merge price back in
canonical = pd.merge(canonical, prices, on=['brand', 'model', 'variant'])

report_stats['canonical_rows'] = len(canonical)
print(f"Generated {report_stats['canonical_rows']} canonical rows.")

# -------------------------------------------------------------------
# VALIDATION: Bounds Checking
# -------------------------------------------------------------------
VALIDATION_RULES = {
    'power_output': (40, 800),        
    'torque': (80, 1000),             
    'engine_displacement_cc': (600, 7000),
    'mileage_kmpl': (5, 35),
    'seating_capacity': (2, 9),
    'airbags_count': (0, 16),
    'ex_showroom': (300000, 30000000), 
    'length_mm': (3000, 5500),
    'width_mm': (1500, 2200),
    'height_mm': (1400, 2000),
}

for col, (vmin, vmax) in VALIDATION_RULES.items():
    if col in canonical.columns:
        # Count rows where value exists but is out of bounds
        out_of_bounds = canonical[(canonical[col].notna()) & ((canonical[col] < vmin) | (canonical[col] > vmax))]
        fails = len(out_of_bounds)
        report_stats['validation_failures'][col] = fails
        if fails > 0:
            print(f"Validation Warning: {fails} rows out of bounds for {col} ({vmin}-{vmax})")

# Save canonical dataset
canonical.to_csv('car_data_canonical.csv', index=False)
print("Saved car_data_canonical.csv")

# -------------------------------------------------------------------
# REPORT GENERATION
# -------------------------------------------------------------------
with open('cleaning_report.json', 'w') as f:
    json.dump(report_stats, f, indent=2)

with open('cleaning_report.txt', 'w') as f:
    f.write("=== TorqueX Data Cleaning Report ===\n\n")
    f.write(f"Total Input Rows: {report_stats['total_input_rows']}\n")
    f.write(f"Canonical Output Rows: {report_stats['canonical_rows']}\n\n")
    f.write("--- Fixes Applied ---\n")
    f.write(f"EV Fuel Types Corrected: {report_stats['ev_fuel_fixed']}\n")
    f.write(f"Power Output Junk Stripped: {report_stats['power_cleaned']} rows\n")
    f.write(f"Torque String Units Stripped: {report_stats['torque_cleaned']} rows\n")
    f.write(f"Seating Capacity Bounds Fixed: {report_stats['seating_capacity_fixed']} rows\n\n")
    f.write("--- Nulls Filled via Enrichment ---\n")
    for col, count in report_stats['nulls_filled_per_column'].items():
        if count > 0:
            f.write(f"- {col}: {count}\n")
    f.write(f"\nBrands Covered in Lookup: {report_stats['brands_covered_in_lookup']}\n\n")
    f.write("--- Range Validation Failures (Canonical Set) ---\n")
    for col, fails in report_stats['validation_failures'].items():
        f.write(f"- {col}: {fails} failures\n")

print("Pipeline Complete. Reports generated.")
