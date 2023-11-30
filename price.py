import re

# Find the total filament cost
def calc_price(file_path):
    with open(file_path, 'r') as file:
        for line in file:
            if '; total filament cost =' in line:
                cost_match = re.search(r'\d+\.\d+', line)
                if cost_match:
                    return float(cost_match.group())

    return None