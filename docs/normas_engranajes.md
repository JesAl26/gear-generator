# Guía Profesional de Normas, Medidas y Parámetros de Engranajes

Este documento reúne de forma sistemática y profesional las normas internacionales (**ISO**, **DIN**, **AGMA**) relativas al diseño, cálculo de dimensiones, formas y tolerancias de los engranajes cilíndricos de dientes rectos y helicoidales.

---

## 1. Principales Normas Internacionales de Referencia

Las normas estandarizan la terminología, los perfiles de referencia, los módulos/pasos y las tolerancias de fabricación:

| Organización | Norma | Descripción |
| :--- | :--- | :--- |
| **ISO** | **ISO 53** | Perfil de la cremallera de referencia para engranajes cilíndricos de uso general. |
| **ISO** | **ISO 54** | Serie de módulos métricos estándar para engranajes cilíndricos. |
| **ISO** | **ISO 701** | Notación internacional de engranajes: símbolos para datos geométricos. |
| **ISO** | **ISO 1328** | Sistema ISO de clasificación de tolerancias de flancos de dientes. |
| **DIN** | **DIN 867** | Perfil de referencia para engranajes cilíndricos para ingeniería general. |
| **DIN** | **DIN 780** | Series de módulos para engranajes cilíndricos. |
| **DIN** | **DIN 3960 / 3962** | Conceptos y parámetros geométricos / Clases de calidad de engranajes. |
| **AGMA / ANSI** | **ANSI/AGMA 2001** | Factores fundamentales de capacidad de carga y métodos de cálculo para dientes involutos. |
| **AGMA / ANSI** | **ANSI/AGMA 1012** | Terminología de engranajes (estándar americano). |

---

## 2. Nomenclatura y Símbolos Fundamentales (ISO 701 / DIN 3960)

Para evitar ambigüedades, se utilizan los siguientes símbolos normalizados internacionales:

*   **$m$**: Módulo (parámetro de tamaño en sistema métrico, medido en mm).
*   **$P_d$**: Paso diametral (*Diametral Pitch* - sistema anglosajón).
*   **$z$** o **$N$**: Número de dientes.
*   **$\alpha$** o **$\phi$**: Ángulo de presión (estándar: $20^\circ$).
*   **$d$**: Diámetro primitivo o de referencia.
*   **$d_a$**: Diámetro de cabeza o exterior (*addendum diameter*).
*   **$d_f$**: Diámetro de pie o de raíz (*dedendum diameter*).
*   **$d_b$**: Diámetro base (generador de la evolvente/involuta).
*   **$p$**: Paso circular (*circular pitch*).
*   **$h_a$**: Altura de cabeza (*addendum*).
*   **$h_f$**: Altura de pie (*dedendum*).
*   **$c$**: Juego en el pie o holgura (*clearance*).
*   **$s$**: Espesor del diente en el diámetro primitivo.

---

## 3. Geometría del Perfil de Referencia (DIN 867 / ISO 53)

El perfil de referencia define la forma del diente a partir de una cremallera ideal teórica con la que engrana el piñón/rueda. Los parámetros normalizados en función del módulo ($m$) son:

```
                  _..._             <- Límite de cabeza (d_a)
                /       \
               /         \          <- Flanco del diente (Evolvente)
              /           \
      -------/-------------\------- <- Línea de paso primitivo (d)
            /  |  s  |      \
           /                 \
     _____/                   \_____<- Límite de raíz (d_f)
    (_____)                   (_____)<- Radio de acuerdo en el pie (r_f)
```

### Proporciones Estándar del Perfil (DIN 867):
1.  **Altura de cabeza ($h_a$)**: $1.00 \cdot m$
2.  **Altura de pie ($h_f$)**: $1.25 \cdot m$ (incluye la holgura)
3.  **Holgura de fondo ($c$)**: $0.25 \cdot m$
4.  **Altura total del diente ($h$)**: $h_a + h_f = 2.25 \cdot m$
5.  **Ángulo de presión ($\alpha$)**: $20^\circ$ (estándar general). Ocasionalmente $14.5^\circ$ (obsoleto) o $25^\circ$ (para alta carga).
6.  **Radio de acuerdo de la raíz ($r_f$)**: Máximo $0.38 \cdot m$

---

## 4. Fórmulas de Cálculo Geométrico Principal

### Sistema Métrico (ISO/DIN)
El módulo ($m$) es la relación entre el diámetro primitivo y el número de dientes.

| Parámetro | Símbolo | Fórmula de Cálculo |
| :--- | :--- | :--- |
| **Módulo** | $m$ | $m = \frac{d}{z}$ |
| **Diámetro Primitivo** | $d$ | $d = z \cdot m$ |
| **Paso Circular** | $p$ | $p = \pi \cdot m$ |
| **Diámetro Exterior** | $d_a$ | $d_a = d + 2 \cdot h_a = (z + 2) \cdot m$ |
| **Diámetro de Raíz** | $d_f$ | $d_f = d - 2 \cdot h_f = (z - 2.5) \cdot m$ |
| **Diámetro Base** | $d_b$ | $d_b = d \cdot \cos(\alpha)$ |
| **Altura del Diente** | $h$ | $h = 2.25 \cdot m$ |
| **Espesor del Diente** | $s$ | $s = \frac{p}{2} = \frac{\pi \cdot m}{2}$ |

### Sistema Inglés (AGMA/ANSI)
Utiliza el **Diametral Pitch** ($P_d$), que indica el número de dientes por pulgada de diámetro primitivo.

$$\text{Conversión entre sistemas: } m = \frac{25.4}{P_d}$$

| Parámetro | Símbolo | Fórmula de Cálculo |
| :--- | :--- | :--- |
| **Diametral Pitch** | $P_d$ | $P_d = \frac{z}{d \text{ (en pulgadas)}}$ |
| **Diámetro Primitivo** | $d$ | $d = \frac{z}{P_d}$ |
| **Paso Circular** | $p$ | $p = \frac{\pi}{P_d}$ |
| **Diámetro Exterior** | $d_a$ | $d_a = \frac{z + 2}{P_d}$ |

---

## 5. Módulos Normalizados (ISO 54 / DIN 780)

Para garantizar la intercambiabilidad de herramientas de corte y engranajes, la norma **ISO 54** establece series de módulos preferidos (medidas en milímetros):

*   **Serie 1 (Preferencia Principal):**
    `0.1` · `0.2` · `0.3` · `0.4` · `0.5` · `0.6` · `0.8` · `1` · `1.25` · `1.5` · `2` · `2.5` · `3` · `4` · `5` · `6` · `8` · `10` · `12` · `16` · `20` · `25` · `32` · `40` · `50`
*   **Serie 2 (Elección Secundaria):**
    `0.15` · `0.25` · `0.35` · `0.45` · `0.55` · `0.7` · `0.9` · `1.125` · `1.375` · `1.75` · `2.25` · `2.75` · `3.5` · `4.5` · `5.5` · `7` · `9` · `11` · `14` · `18` · `22` · `28` · `36` · `45`

> [!TIP]
> Se recomienda encarecidamente utilizar módulos de la **Serie 1** en todo diseño nuevo para facilitar la fabricación y reducir los costos de herramientas de fresado.

---

## 6. Limitaciones de Diseño y Evitación de Interferencia

Cuando el número de dientes de un piñón es muy pequeño, ocurre **interferencia de tallado o de engrane** (la cabeza del diente de la herramienta corta la raíz del diente del piñón, debilitándolo y destruyendo la evolvente).

*   **Número mínimo de dientes teórico ($\alpha = 20^\circ$)**:
    $$z_{\text{min}} = \frac{2}{\sin^2(20^\circ)} \approx 17.1 \implies 18 \text{ dientes}$$
*   **Corrección de perfil (Desplazamiento de herramienta - X-shift)**:
    Si se deben usar menos de 17 dientes (por ejemplo, en cajas de cambio compactas), se aplica un factor de desplazamiento de perfil ($x$) medido en unidades del módulo ($x \cdot m$) para desplazar la herramienta hacia afuera y evitar el rebaje de la raíz (*undercutting*).

---

## 7. Clases de Tolerancias y Calidad (ISO 1328)

La norma **ISO 1328** clasifica la precisión geométrica de los engranajes en niveles de calidad del **1 al 12**:

*   **Grados 1 al 4**: Precisión extrema de laboratorio y masterización de engranajes patrón.
*   **Grados 5 al 6**: Engranajes de alta precisión para turbomáquinas, aviación y automoción de altas prestaciones.
*   **Grados 7 al 8**: Aplicaciones industriales convencionales, reductores estándar y maquinaria general.
*   **Grados 9 al 12**: Engranajes de baja velocidad, transmisión agrícola, juguetes o fundición sin mecanizado posterior.
