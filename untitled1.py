#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Created on Fri Dec 20 12:39:34 2024

@author: filippodarinvidal
"""
import csv
from notion_client import Client

# Inserisci il token API di Notion
notion = Client(auth="YOUR_INTEGRATION_TOKEN")

# ID del tuo database Notion
database_id = "YOUR_DATABASE_ID"

# Funzione per estrarre e convertire i dati
def esporta_eventi_in_csv():
    # Estrai i dati dal database Notion
    response = notion.databases.query(database_id)
    
    # Lista per memorizzare gli eventi
    eventi = []
    
    for result in response["results"]:
        # Adatta questo codice per recuperare i campi specifici dei tuoi eventi
        evento = {}
        
        # Modifica i nomi delle chiavi in base ai tuoi campi (sostituisci "Evento" e "Data")
        evento["Evento"] = result["properties"]["Evento"]["title"][0]["text"]["content"] if "Evento" in result["properties"] else "N/D"
        evento["Data"] = result["properties"]["Data"]["date"]["start"] if "Data" in result["properties"] else "N/D"
        
        eventi.append(evento)

    # Scrivi i dati in un file CSV
    with open('eventi_notion.csv', mode='w', newline='', encoding='utf-8') as file:
        writer = csv.DictWriter(file, fieldnames=["Evento", "Data"])
        writer.writeheader()
        writer.writerows(eventi)
    
    print("Esportazione completata con successo!")

# Esegui la funzione
esporta_eventi_in_csv()