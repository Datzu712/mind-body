# Como contribuir

## Requisitos

- [pnpm](https://pnpm.io/installation) >= 11.1.3
- [Rust](https://rustup.rs/) (no es 100% necesario, se puede omitir `@mab/dashboard`)

### Instalar Node.js

Se recomienda gestionar nodejs a través de pnpm para mayor facilidad

```sh
pnpm env use --global lts
```

Esto instala y activa la ultima [lts](https://nodejs.org/en/about/previous-releases) de nodejs globalmente.

## Setup

```sh
git clone https://github.com/Datzu712/mind-body.git
cd mind-body
pnpm install
```

## Estructura del proyecto

```
apps/
  dashboard/   → App de escritorio para administradores (Next.js + Tauri)
  mobile/      → App móvil para miembros (Expo + React Native)
```

## Ambiente de desarrollo

- Dashboard desde el navegador:

```sh
pnpm --filter=@mab/dashboard dev
```

- Dashboard como desktop app con tauri

```sh
pnpm --filter=@mab/dashboard exec tauri dev
```

- App mobile con Expo

```sh
pnpm --filter=@mab/mobile start
```

## Convenciones de ramas

- `main` está **protegida**, esto significa que no se puede hacer push directo. Todo cambio debe ir por un pull request en otra rama.
- Crear ramas desde `main` usando uno de estos prefijos:

| Prefijo     | Cuándo usarlo                                 |
| ----------- | --------------------------------------------- |
| `feat/`     | Nueva funcionalidad                           |
| `fix/`      | Corrección de bug                             |
| `chore/`    | Herramientas, CI, dependencias, config        |
| `docs/`     | Solo documentación                            |
| `refactor/` | Cambio de código sin cambio de comportamiento |

Ejemplo: `feat/pagina-perfil-usuario`

## Convenciones de commits

Este proyecto sigue [Conventional Commits](https://www.conventionalcommits.org/). Los mensajes de commit se validan automáticamente en cada push mediante commitlint.

```
<tipo>(<scope>): <descripción>

feat(dashboard): add button to export user data
fix(mobile): resolve crash during login flow
chore(ci): update nodejs to v24
```

Tipos válidos: `feat`, `fix`, `chore`, `docs`, `refactor`, `test`, `style`, `perf`.

> Se puede usar `--no-verify` para omitir la validación local, pero no se recomienda hacerlo sin una buena razón.

## Uso de IA

Está permitido usar herramientas de IA para generar código **solo en el frontend** (`@mab/dashboard`, `@mab/mobile`).

> **No se permite vibe codear nada relacionado al backend o la base de datos.** Todo código que toque modelos, migraciones, queries, lógica de negocio del servidor o esquemas de DB debe ser escrito y entendido por la persona que lo sube. Código generado sin revisión en esas áreas será rechazado en el PR.

## Abrir un PR

1. Se debe pushear la rama al origin y abrir un PR contra `main`
2. El titulo del pr debe ser descriptivo siguiendo el mismo formato de Conventional Commits
3. Se deben describir los cambios
4. Priorizar arreglar el CI antes de pedir revisión.

## Notas

- No se necesita instalar rust para trabajar en el desktop pues este se puede ejecutar directamente con el cli de nextjs.

- El dashboard NO debe usar ninguna API nativa que no este disponible en las webviews ([WebView2/Webkit](https://v2.tauri.app/reference/webview-versions/#_top)) de tauri, esto es para asegurar que el código sea compatible tanto en desktop como en web.
