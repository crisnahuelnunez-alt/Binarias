from flask import Flask, request, jsonify
from flask_cors import CORS

app = Flask(__name__)
CORS(app) # Habilita CORS para evitar errores de seguridad del navegador

# --- LÓGICA DE GESTIÓN DE RIESGO UNIVERSAL (La lógica del 3%) ---
def calcular_limite_racha(win_rate):
    """Calcula el límite de racha perdedora basado en el umbral del 3%."""
    # Validación: si el Win Rate es 50% o menos, la probabilidad de quiebra es muy alta.
    if win_rate >= 1 or win_rate <= 0.5: return 20 
    prob_perder_una_op = 1 - win_rate
    racha_actual = 1
    while True:
        prob_racha = prob_perder_una_op ** racha_actual
        if prob_racha <= 0.03: # Umbral del 3%
            return racha_actual
        racha_actual += 1

@app.route("/analizar-uas", methods=["POST"])
def analizar_uas():
    """Endpoint para que el JavaScript envíe datos y reciba el límite de riesgo."""
    try:
        data = request.get_json()
        # Recibimos el Win Rate y Payout como % (ej. 55 y 92)
        win_rate = data.get("winRate") / 100 
        payout = data.get("payout") / 100 

        # 1. Validación de Rentabilidad (Punto de Equilibrio)
        punto_equilibrio = 1 / (1 + payout)
        
        if win_rate <= punto_equilibrio:
            return jsonify({
                "status": "inviable",
                "mensaje": f"INVIABLE. Necesitas un {(punto_equilibrio * 100):.2f}% de acierto.",
                "limiteRacha": 0
            })
        
        # 2. Cálculo del Límite de Racha (Umbral del 3%)
        limite_racha = calcular_limite_racha(win_rate)
        
        return jsonify({
            "status": "viable",
            "mensaje": "Estrategia viable y límite calculado.",
            "limiteRacha": limite_racha
        })

    except Exception as e:
        # Esto atrapará errores como el envío de texto en lugar de números
        return jsonify({"error": "Error interno del servidor. Datos inválidos.", "detalle": str(e)}), 400

if __name__ == "__main__":
    # INICIA AQUÍ CON EL COMANDO: python app_backend.py
    app.run(debug=True, port=5000)