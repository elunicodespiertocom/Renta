# Simulador Renta España + Canarias v5

Simulador web estático orientativo para IRPF 2025 / campaña 2026, con bloque autonómico de Canarias y una interfaz renovada en **modo claro/oscuro automático** con enfoque móvil tipo app bancaria.

## Novedades v5

- modo claro/oscuro automático según sistema
- selector manual de tema
- optimización fuerte para móvil
- navegación inferior sticky en pantallas pequeñas
- mejor contraste en inputs, selects y bloques de resultado
- resumen móvil del paso actual y estado del flujo
- guardado local, exportación JSON e impresión/PDF

## Archivos

- `index.html` → interfaz principal
- `styles.css` → estilos y responsive
- `app.js` → lógica fiscal, navegación, tema y persistencia

## Qué mantiene del núcleo fiscal

- cálculo orientativo de base general y base del ahorro
- bloque de “obligado a declarar”
- referencias AEAT visibles en campos clave
- deducciones estatales principales
- bloque autonómico ampliado de Canarias
- separación entre deducciones calculadas y deducciones manuales asistidas

## Importante

Sigue siendo un **simulador orientativo**. No sustituye:

- Renta Web
- datos fiscales oficiales AEAT
- certificados de empresa o prestaciones
- anexos documentales
- asesoramiento fiscal profesional

## Uso

Abre `index.html` en el navegador. Para una experiencia más parecida a una app:
- usa el tema automático o cambia manualmente con el botón de tema
- en móvil, navega con la barra inferior sticky
- calcula y revisa el detalle final antes de exportar

## Nota técnica

En varias deducciones canarias la AEAT exige anexos, NIF de terceros, facturas, referencias catastrales o validaciones adicionales. Por eso parte del bloque autonómico sigue en modo manual asistido: mejor prudencia que inventarse la ley.
