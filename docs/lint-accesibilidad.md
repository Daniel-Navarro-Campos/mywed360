---
# Guía de Lint y Accesibilidad

Esta guía resume las normas de estilo de código (ESLint) y las pruebas de accesibilidad (a11y) implementadas en Lovenda.

## 1. Lint (ESLint)

El proyecto utiliza **ESLint 8** con las reglas por defecto de `eslint-plugin-react` y `eslint-plugin-react-hooks`.

### Scripts

```bash
npm run lint        # Ejecuta eslint con --max-warnings 0
npm run lint:fix    # Aplica correcciones automáticas
```

### Exclusiones

Los archivos *legacy* o copias de seguridad se excluyen mediante `.eslintignore`. Esto mantiene el análisis centrado en el código vigente.

### Reglas importantes

- `no-undef`, `no-unused-vars` – Errores; no se permiten.
- `react/no-unescaped-entities` – Advertencia; corregir cuando sea posible.
- Cualquier **warning** se trata como error en CI (`--max-warnings 0`).

## 2. Accesibilidad (a11y)

Se usa **jest-axe** como prueba automática de accesibilidad.

### Ubicación del test

`src/__tests__/accessibility.test.jsx`

### Ejecución

```bash
npm test # Vitest ejecuta pruebas unitarias y jest-axe
```

El test falla si se detecta alguna violación WCAG en el DOM renderizado de `App`.

## 3. Integración CI

El workflow `ci.yml` ejecuta:

1. `npm run lint`
2. `npm test`
3. Build y cobertura

Cualquier error detiene el despliegue.

---
