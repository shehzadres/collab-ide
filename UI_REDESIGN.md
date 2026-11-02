# UI Redesign Notes

## Design objective

Turn the original functional-but-generic coding workspace into a deliberate product interface: quiet, dense where information matters, spacious where focus matters, and recognizably an IDE without pretending to be a clone of VS Code.

## Visual references and what was borrowed conceptually

- **Linear**: restrained surfaces, carefully tiered typography, thin separators, compact controls, and a clear hierarchy between navigation and work content.
- **Visual Studio Code**: familiar editor anatomy, file tree, tabs, editor canvas, terminal dock, and persistent status information. The structure is familiar so the product does not make developers relearn basic spatial patterns.
- **Raycast**: command-first interaction, compact keyboard affordances, and small utility surfaces that stay out of the way.
- **Radix/shadcn-style component conventions**: predictable focus and interaction states, accessible labels, restrained popovers/dialogs, and consistent control sizing. The project keeps its existing React/Tailwind stack rather than adding a component framework solely for decoration.
- **GitHub's developer surfaces**: clear file hierarchy, explicit states, and utility-first information grouping.

These are design references, not copied screens or assets.

## Design system

### Color

The primary workspace uses a warm graphite base rather than pure black. Elevated regions are separated by subtle border values instead of heavy shadows. A muted sage accent marks primary actions, active states, and presence without turning every control into a call to action. Text is tiered into primary, secondary, and quiet levels; semantic danger remains reserved for destructive actions and errors.

### Typography

- Space Grotesk for selected display headings and product identity.
- IBM Plex Sans for interface copy and controls.
- IBM Plex Mono for code-adjacent labels, metadata, keyboard hints, and terminal content.

The mono face is used as an accent for technical context, not as the default face for every sentence.

### Layout and hierarchy

- **Sessions dashboard**: narrow persistent navigation, compact top bar, editorial introduction, a primary session-creation surface, and a secondary workflow guide. The template chooser is a clear set of selectable cards rather than a generic dropdown.
- **Workspace**: stable IDE geometry with a compact project rail, file explorer, editor tab strip, large editor canvas, and docked terminal. The top bar holds session-level actions and presence; the footer/status area communicates context without competing with the code.
- **Authentication**: split composition with product context on one side and a focused form on the other. Form labels, input states, and primary action are visually distinct.
- **Dialogs and utility surfaces**: consistent spacing, restrained borders, accessible names, and explicit close affordances.

### Interaction rules

- Use one strong primary action per surface.
- Keep secondary actions icon-led but provide titles/accessible names.
- Use subtle hover and selected states; avoid persistent decorative badges.
- Preserve keyboard shortcuts and command-palette access.
- Keep loading, connected, disconnected, and empty states explicit.
- Respect editor focus and avoid overlays that unexpectedly steal it.

## UI coverage

The redesign touches authentication, registration, the sessions dashboard, workspace shell, explorer and file rows, editor tabs and empty state, terminal, theme switching, notification affordances, replay surfaces, and the shared visual token layer.

## Responsive behavior

The workspace prioritizes desktop because Monaco plus an explorer and terminal need horizontal space. At narrower widths, secondary chrome should collapse before the editor becomes unusable. The sessions dashboard reflows its creation and guide columns into a single column.

## Implementation notes

The existing React 18, Tailwind 3, Monaco, xterm, Yjs, and Lucide stack remains in place. The redesign uses the existing component architecture and a consolidated CSS token layer. No new heavyweight UI dependency was introduced.
