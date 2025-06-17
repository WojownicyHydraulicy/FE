"""
@file get_location.py
@brief Skrypt pobierający i wyświetlający lokalizację użytkownika na podstawie adresu IP.
"""

import requests
import time

def get_location():
    """
    @brief Pobiera lokalizację użytkownika za pomocą API ipinfo.io.
    @return None
    @exception Exception Gdy nie uda się pobrać danych lub wystąpi błąd sieciowy.
    """
    try:
        response = requests.get('https://ipinfo.io/json')
        data = response.json()
        print(data)
        
        if response.status_code != 200:
            print(response.text)
            raise Exception("Nie udało się pobrać danych o lokalizacji")
        

        loc = data.get('loc', 'Nieznana lokalizacja')
        city = data.get('city', 'Nieznane miasto')
        region = data.get('region', 'Nieznany region')
        country = data.get('country', 'Nieznany kraj')

        print(f"Twoja lokalizacja: {loc} ({city}, {region}, {country})")
    except Exception as e:
        print(f"Błąd podczas pobierania lokalizacji: {e}")


if __name__ == "__main__":
    get_location()
else:
    print("Moduł został zaimportowany, nie uruchamiam funkcji get_location()")