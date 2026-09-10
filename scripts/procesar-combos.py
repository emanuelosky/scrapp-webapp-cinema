"""Convierte el arte de senaletica de los combos en imagenes para la web.

El equipo de mercadeo entrega banners 1920x1080 pensados para las pantallas
sobre la confiteria: foto del producto a la izquierda, y a la derecha el
titulo, el contenido y el precio quemados en el JPEG.

Para la web ese texto estorba: el precio cambia, no se puede traducir ni leer
por un lector de pantalla, y un 16:9 con texto al costado no entra en una
tarjeta vertical de movil. Asi que esto se queda solo con la foto.

Dos operaciones, ninguna inventa contenido:

1. Recorte en x=900. Medido sobre las 10: ningun producto cruza esa linea y
   ningun bloque de texto empieza antes.
2. Relleno del titulo. Los titulos largos (el peor, COMBO PROTAGONICO, llega
   hasta x=635) invaden la franja de la foto. Caen sobre el fondo amarillo
   desenfocado, que es un degradado suave, asi que se rellenan interpolando
   horizontalmente entre los vecinos de cada trazo. No se recorta por arriba
   para no perder la cotufa.

Los trazos del titulo se distinguen del brillo de las cotufas por la longitud
de la racha vertical: las letras son barras solidas de decenas de pixeles, el
brillo especular son motas. Ningun umbral de luminancia sirve -- las cotufas
tambien llegan a 255.

El degradado del borde derecho NO se quema aca: eso se hace con mask-image en
CSS, como el resto del sitio.

Uso:  python scripts/procesar-combos.py
Requiere: pillow, numpy.  Es una herramienta de una sola vez; no corre en el
build. Cuando el backend sirva las imagenes, esto deja de hacer falta -- ver
src/lib/api/CONTRATO-BACKEND.md.
"""

import os
import sys
import unicodedata

try:
    import numpy as np
    from PIL import Image, ImageFilter
except ImportError:
    sys.exit("Falta pillow o numpy:  pip install pillow numpy")

RAIZ = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
ORIGEN = os.path.join(RAIZ, "resources-cinema", "images_combo")
DESTINO = os.path.join(RAIZ, "static", "img", "combos")

CORTE_X = 900          # validado contra las 10 imagenes
BANDA_TITULO = (90, 255)
RACHA_MIN = 25         # pixeles verticales seguidos para ser trazo de letra
DILATACION = 9         # para tragarse el antialias del borde
TAMANOS = {"full": 900, "card": 500, "thumb": 160}
CALIDAD = 82


def slug(nombre):
    n = unicodedata.normalize("NFKD", nombre).encode("ascii", "ignore").decode()
    return n.lower().replace(" ", "-")


def mascara_titulo(gris):
    """True donde hay trazo de letra dentro de la franja de foto."""
    y0, y1 = BANDA_TITULO
    fuerte = gris[y0:y1, :CORTE_X] >= 249
    m = np.zeros_like(fuerte)
    for x in range(fuerte.shape[1]):
        col = fuerte[:, x]
        if not col.any():
            continue
        d = np.diff(np.concatenate(([0], col.view(np.int8), [0])))
        for a, b in zip(np.flatnonzero(d == 1), np.flatnonzero(d == -1)):
            if b - a >= RACHA_MIN:
                m[a:b, x] = True
    if not m.any():
        return None
    im = Image.fromarray((m * 255).astype(np.uint8))
    im = im.filter(ImageFilter.MaxFilter(DILATACION)).filter(ImageFilter.MaxFilter(DILATACION))
    return np.asarray(im) > 127


def interpola(rgb, m):
    """Rellena cada racha enmascarada entre sus vecinos horizontales."""
    out = rgb.astype(np.float32).copy()
    alto, ancho, _ = out.shape
    for y in range(alto):
        fila = m[y]
        if not fila.any():
            continue
        d = np.diff(np.concatenate(([0], fila.view(np.int8), [0])))
        for a, b in zip(np.flatnonzero(d == 1), np.flatnonzero(d == -1)):
            izq = out[y, a - 1] if a > 0 else (out[y, b] if b < ancho else np.zeros(3))
            der = out[y, b] if b < ancho else izq
            n = b - a
            for i in range(n):
                t = (i + 1) / (n + 1)
                out[y, a + i] = izq * (1 - t) + der * t
    return out


def procesar(ruta):
    im = Image.open(ruta).convert("RGB")
    gris = np.asarray(im.convert("L"))
    m = mascara_titulo(gris)
    if m is None:
        return im.crop((0, 0, CORTE_X, im.height)), 0

    y0, y1 = BANDA_TITULO
    arr = np.asarray(im).copy()
    parcheado = interpola(arr[y0:y1, :CORTE_X], m)

    # Suavizado local solo donde se parcheo, para matar cualquier costura.
    suave = np.asarray(
        Image.fromarray(parcheado.astype(np.uint8)).filter(ImageFilter.GaussianBlur(3.5)),
        dtype=np.float32,
    )
    peso = np.asarray(
        Image.fromarray((m * 255).astype(np.uint8)).filter(ImageFilter.GaussianBlur(4)),
        dtype=np.float32,
    )[..., None] / 255.0
    arr[y0:y1, :CORTE_X] = (parcheado * (1 - peso) + suave * peso).astype(np.uint8)
    return Image.fromarray(arr).crop((0, 0, CORTE_X, im.height)), int(m.sum())


def main():
    if not os.path.isdir(ORIGEN):
        sys.exit(f"No encuentro el arte original en {ORIGEN}")
    os.makedirs(DESTINO, exist_ok=True)

    archivos = sorted(f for f in os.listdir(ORIGEN) if f.lower().endswith(".jpg"))
    if not archivos:
        sys.exit(f"No hay .jpg en {ORIGEN}")

    total = 0
    print(f"{'combo':<14}{'titulo':<10}{'full':>9}{'card':>9}{'thumb':>9}")
    print("-" * 51)
    for archivo in archivos:
        nombre = slug(os.path.splitext(archivo)[0])
        foto, rellenados = procesar(os.path.join(ORIGEN, archivo))
        pesos = {}
        for etiqueta, ancho in TAMANOS.items():
            alto = round(foto.height * ancho / foto.width)
            salida = os.path.join(DESTINO, f"{nombre}-{etiqueta}.webp")
            foto.resize((ancho, alto), Image.LANCZOS).save(
                salida, "WEBP", quality=CALIDAD, method=6
            )
            pesos[etiqueta] = os.path.getsize(salida)
            total += pesos[etiqueta]
        print(f"{nombre:<14}{('si' if rellenados else '--'):<10}"
              f"{pesos['full']//1024:>7} KB{pesos['card']//1024:>7} KB{pesos['thumb']//1024:>7} KB")

    print("-" * 51)
    print(f"{len(archivos)} combos, {len(archivos)*3} archivos, {total//1024} KB en total")
    print(f"Destino: {os.path.relpath(DESTINO, RAIZ)}")


if __name__ == "__main__":
    main()
