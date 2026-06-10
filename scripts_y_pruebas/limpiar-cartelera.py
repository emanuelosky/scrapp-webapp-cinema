import requests
import json
import time

def limpiar_registros():
    # --- CONFIGURACIÓN ---
    # Reemplaza esta URL con la ruta exacta de tu servidor de pruebas
    url_target = "http://192.168.60.30/CinexoSuite/Boleteria/admin/app/datos/procesos/programacion/Eliminar.php"
    
    print("--- Herramienta de Limpieza de Registros de Prueba ---")
    
    # 1. Solicitar la cookie de sesión
    cookie_sesion = input("1. Introduce la Cookie de sesión: ").strip()
    
    # Configuramos los headers tal como indicó la traza de red
    headers = {
        "Cookie": cookie_sesion,
        "Content-Type": "application/x-www-form-urlencoded; charset=UTF-8"
    }
    
    # 2. Solicitar el bloque JSON
    print("\n2. Pega el JSON completo con la respuesta (asegúrate de que esté en una sola línea):")
    json_input = input().strip()
    
    try:
        # Convertir el string a un diccionario de Python
        datos = json.loads(json_input)
        
        # Extraer la lista de objetos bajo la clave "aaData"
        lista_registros = datos.get("aaData", [])
        
        if not lista_registros:
            print("⚠️ No se encontraron registros bajo la clave 'aaData'. Verifica el JSON.")
            return
            
        print(f"\n✅ Se encontraron {len(lista_registros)} registros. Iniciando proceso de borrado...\n")
        
        # 3. Iterar sobre la lista y enviar las peticiones POST
        for item in lista_registros:
            row_id = item.get("DT_RowId")
            nombre_pelicula = item.get("pelicula", "Desconocida")
            
            if row_id:
                # IMPORTANTE: Asumo que el parámetro que recibe el backend se llama 'id'. 
                # Si tu backend espera otro nombre (ej. 'DT_RowId' o 'registro_id'), c\u00e1mbialo aquí.
                payload = {"id": row_id}
                
                try:
                    print(f"Eliminando: [{row_id}] {nombre_pelicula}...", end=" ")
                    
                    response = requests.post(url_target, headers=headers, data=payload)
                    
                    # NUEVA VALIDACIÓN: Revisamos el HTTP 200 Y que el texto contenga "exito_0"
                    if response.status_code == 200 and "exito_0" in response.text:
                        print("✅ OK")
                    else:
                        print("❌ Falló.")
                        print(f"   -> Respuesta del servidor: {response.text}")
                        
                    # Pequeña pausa de cortesía para no saturar el servidor local
                    time.sleep(0.2)
                    
                except requests.exceptions.RequestException as e:
                    print(f"Fallo de conexión: {e}")
                    
    except json.JSONDecodeError:
        print("\n❌ Error: Lo que pegaste no es un formato JSON válido.")

if __name__ == "__main__":
    limpiar_registros()