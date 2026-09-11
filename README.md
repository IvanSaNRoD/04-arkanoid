# Arkanoid

Juego de Arkanoid/Breakout en HTML, CSS y JavaScript puro: **sin dependencias, sin build, sin gestor de paquetes**. Desarrollado con un flujo *spec-driven* (primero la spec, luego el código).

## Cómo jugar

Abrir `index.html` en el navegador (funciona directamente con `file://`, no necesita servidor).

### Controles

| Acción             | Teclas                         |
| ------------------ | ------------------------------ |
| Mover pala         | `←` / `→`, `A` / `D` o ratón   |
| Lanzar bola        | `Espacio` o clic               |
| Pausa / reanudar   | `P` o `Esc`                    |
| Reiniciar partida  | `Espacio` o clic (en pantalla final) |

La partida se pausa sola al cambiar de ventana o pestaña.

### Reglas

- 1 nivel: 54 ladrillos (6 filas × 9 columnas), se rompen de un golpe.
- 3 vidas. Perder la bola resta una vida y vuelve al saque.
- Puntos por fila: rojo 60 · amarillo 50 · cian 40 · magenta 30 · rosa 20 · verde 10 (máximo 1890).
- El ángulo de rebote depende del punto de impacto en la pala (15°–60° respecto a la vertical).
- Récord guardado en `localStorage` y mostrado como `HI`.

## Estructura

```
index.html          canvas 480×640 + carga de scripts
style.css           centrado del canvas
constants.js        configuración inmutable (dimensiones, tuning, filas)
game.js             estado, input, física, colisiones, render y bucle
assets/
  spritesheet.js    globals de sprites y animaciones de explosión
  spritesheet-breakout.png
  sounds/           ball-bounce.mp3, break-sound.mp3
specs/              specs del proyecto (flujo spec-driven)
.claude/skills/     skills /spec y /spec-impl
```

Los scripts son clásicos (no módulos) y se cargan en orden: `spritesheet.js` → `constants.js` → `game.js`.

## Flujo spec-driven

Cada feature pasa por una spec antes de escribir código, usando las skills `spec` y `spec-impl` de [Klerith/fernando-skills](https://github.com/Klerith/fernando-skills):

1. `/spec <descripción>` → preguntas de clarificación → `specs/NN-slug.md` en estado `Draft`.
2. Revisión humana → estado `Approved`.
3. `/spec-impl NN-slug` → crea la rama `spec-NN-slug` e implementa el plan paso a paso (un commit `feat:` por paso).
4. Verificar criterios de aceptación → estado `Implemented` → PR a `main`.

### Specs

| #  | Spec                                              | Estado      |
| -- | ------------------------------------------------- | ----------- |
| 01 | [Playable Arkanoid MVP](specs/01-playable-mvp.md) | Implemented |

### Próximas specs (fuera del MVP)

- Varios niveles y progresión.
- Ladrillos de varios golpes o indestructibles.
- Power-ups.
- Aumento progresivo de velocidad.
- Canvas responsive, HiDPI y controles táctiles.
- Tabla de récords.
- Música y control de volumen.
