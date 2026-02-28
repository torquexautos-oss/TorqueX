import os
import time
import requests

os.makedirs('public/images/logos', exist_ok=True)

files_map = {
    'maruti_suzuki.svg': 'File:Maruti_Suzuki_Logo.svg',
    'tata.svg': 'File:Tata_logo.svg',
    'mahindra.png': 'File:Mahindra_Auto.png',
    'hyundai.svg': 'File:Hyundai_Motor_Company_logo.svg',
    'kia.svg': 'File:KIA_logo2.svg',
    'toyota.svg': 'File:Toyota_carlogo.svg',
    'honda.svg': 'File:Honda.svg',
    'mg_motor.svg': 'File:MG_Motor_logo.svg',
    'volkswagen.svg': 'File:Volkswagen_Logo_till_1995.svg',
    'skoda.svg': 'File:Skoda_Auto_Logo_2023.svg',
    'renault.svg': 'File:Renault_2021_Text.svg',
    'nissan.svg': 'File:Nissan_2020_logo.svg',
    'jeep.svg': 'File:Jeep_logo.svg',
    'citroen.svg': 'File:Citroën_Logo.svg',
    'mercedes_benz.svg': 'File:Mercedes-Logo.svg',
    'bmw.svg': 'File:BMW.svg',
    'audi.svg': 'File:Audi-Logo_2016.svg',
    'volvo.svg': 'File:Volvo-Iron-Mark-Black.svg',
    'land_rover.svg': 'File:Land_Rover_logo.svg',
    'porsche.svg': 'File:Porsche_logo.svg',
    'jaguar.svg': 'File:Jaguar_Cars_logo.svg',
    'tesla.svg': 'File:Tesla_Motors.svg'
}

headers = {'User-Agent': 'TorqueX/1.0 (Contact: admin@torquex.com)'}

for filename, wname in files_map.items():
    path = os.path.join('public/images/logos', filename)
    if os.path.exists(path):
        print(f"Skipping {filename} (already exists)")
        continue
        
    api_url = f'https://en.wikipedia.org/w/api.php?action=query&titles={wname}&prop=imageinfo&iiprop=url&format=json'
    try:
        r = requests.get(api_url, headers=headers)
        data = r.json()
        pages = data['query']['pages']
        page_id = list(pages.keys())[0]
        
        if 'imageinfo' in pages[page_id]:
            img_url = pages[page_id]['imageinfo'][0]['url']
            print(f"Downloading {wname} from {img_url}...")
            
            img_r = requests.get(img_url, headers=headers)
            if img_r.status_code == 200:
                with open(path, 'wb') as f:
                    f.write(img_r.content)
                print(f"Saved {filename}")
            else:
                print(f"Failed to download image {img_url}: {img_r.status_code}")
        else:
            print(f"NOT FOUND: {wname}")
            
    except Exception as e:
        print(f"Error on {wname}: {str(e)}")
        
    time.sleep(1) # Be nice to wikipedia to avoid 429
