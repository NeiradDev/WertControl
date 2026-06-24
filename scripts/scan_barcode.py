#!/usr/bin/env python3
"""Lee una imagen en base64 desde stdin, devuelve el valor del código de barras."""
import sys, base64, io
from PIL import Image
from pyzbar import pyzbar

raw = sys.stdin.buffer.read()
image = Image.open(io.BytesIO(base64.b64decode(raw)))
barcodes = pyzbar.decode(image)
print(barcodes[0].data.decode('utf-8') if barcodes else '', end='')
