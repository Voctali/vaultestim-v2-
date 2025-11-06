#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""Test de l'API Pokemon TCG avec Python"""

import requests
import json

print("[INFO] Test de l'API Pokemon TCG...")
print("[INFO] URL: https://api.pokemontcg.io/v2/cards")
print()

try:
    # Test 1: Recherche Professor Laventon
    url = 'https://api.pokemontcg.io/v2/cards'
    params = {
        'q': 'name:"professor laventon"',
        'pageSize': 10
    }

    print(f"[TEST 1] Recherche: {params['q']}")
    response = requests.get(url, params=params, timeout=10)

    print(f"[OK] Status Code: {response.status_code}")

    if response.status_code == 200:
        data = response.json()
        count = len(data.get('data', []))
        print(f"[OK] Cartes trouvees: {count}")

        if count > 0:
            for card in data['data']:
                print(f"\n[CARTE] {card['name']} (#{card['number']})")
                print(f"  Extension: {card['set']['name']} ({card['set']['id']})")
                print(f"  Rarete: {card.get('rarity', 'N/A')}")
                print(f"  Artiste: {card.get('artist', 'N/A')}")
        else:
            print("[WARNING] Aucune carte trouvee")
    else:
        print(f"[ERROR] Erreur HTTP: {response.status_code}")
        print(f"[ERROR] Message: {response.text[:500]}")

except requests.exceptions.Timeout:
    print("[ERROR] Timeout - L'API ne repond pas (>10s)")
except requests.exceptions.ConnectionError as e:
    print(f"[ERROR] Erreur de connexion: {e}")
except Exception as e:
    print(f"[ERROR] Erreur inattendue: {e}")
