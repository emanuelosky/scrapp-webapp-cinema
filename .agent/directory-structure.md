Directory structure:
└── emanuelosky-scrapp-webapp-cinema/
    ├── README.md
    ├── components.json
    ├── eslint.config.js
    ├── package.json
    ├── svelte.config.js
    ├── tsconfig.json
    ├── vite.config.ts
    ├── .env.example
    ├── .npmrc
    ├── .prettierignore
    ├── .prettierrc
    ├── src/
    │   ├── app.d.ts
    │   ├── app.html
    │   ├── lib/
    │   │   ├── index.ts
    │   │   ├── supabase.ts
    │   │   ├── types.ts
    │   │   ├── utils.ts
    │   │   ├── actions/
    │   │   │   └── inview.ts
    │   │   ├── components/
    │   │   │   ├── AuroraBackground.svelte
    │   │   │   ├── ComingSoonDialog.svelte
    │   │   │   ├── Footer.svelte
    │   │   │   ├── HeroCarousel.svelte
    │   │   │   ├── MovieDetailsDialog.svelte
    │   │   │   ├── MovieGlassCard.svelte
    │   │   │   ├── ParallaxSVGs.svelte
    │   │   │   ├── TheatreSelectorDialog.svelte
    │   │   │   ├── booking/
    │   │   │   │   └── SeatIcon.svelte
    │   │   │   ├── home/
    │   │   │   │   ├── DateSelector.svelte
    │   │   │   │   ├── HeroScrolly.svelte
    │   │   │   │   ├── NowPlayingCarousel.svelte
    │   │   │   │   ├── PromoBanner.svelte
    │   │   │   │   ├── ScrollToTop.svelte
    │   │   │   │   └── UpcomingCarousel.svelte
    │   │   │   └── ui/
    │   │   │       ├── accordion/
    │   │   │       │   ├── accordion-content.svelte
    │   │   │       │   ├── accordion-item.svelte
    │   │   │       │   ├── accordion-trigger.svelte
    │   │   │       │   ├── accordion.svelte
    │   │   │       │   └── index.ts
    │   │   │       ├── alert/
    │   │   │       │   ├── alert-action.svelte
    │   │   │       │   ├── alert-description.svelte
    │   │   │       │   ├── alert-title.svelte
    │   │   │       │   ├── alert.svelte
    │   │   │       │   └── index.ts
    │   │   │       ├── alert-dialog/
    │   │   │       │   ├── alert-dialog-action.svelte
    │   │   │       │   ├── alert-dialog-cancel.svelte
    │   │   │       │   ├── alert-dialog-content.svelte
    │   │   │       │   ├── alert-dialog-description.svelte
    │   │   │       │   ├── alert-dialog-footer.svelte
    │   │   │       │   ├── alert-dialog-header.svelte
    │   │   │       │   ├── alert-dialog-media.svelte
    │   │   │       │   ├── alert-dialog-overlay.svelte
    │   │   │       │   ├── alert-dialog-portal.svelte
    │   │   │       │   ├── alert-dialog-title.svelte
    │   │   │       │   ├── alert-dialog-trigger.svelte
    │   │   │       │   ├── alert-dialog.svelte
    │   │   │       │   └── index.ts
    │   │   │       ├── aspect-ratio/
    │   │   │       │   ├── aspect-ratio.svelte
    │   │   │       │   └── index.ts
    │   │   │       ├── avatar/
    │   │   │       │   ├── avatar-badge.svelte
    │   │   │       │   ├── avatar-fallback.svelte
    │   │   │       │   ├── avatar-group-count.svelte
    │   │   │       │   ├── avatar-group.svelte
    │   │   │       │   ├── avatar-image.svelte
    │   │   │       │   ├── avatar.svelte
    │   │   │       │   └── index.ts
    │   │   │       ├── badge/
    │   │   │       │   ├── badge.svelte
    │   │   │       │   └── index.ts
    │   │   │       ├── breadcrumb/
    │   │   │       │   ├── breadcrumb-ellipsis.svelte
    │   │   │       │   ├── breadcrumb-item.svelte
    │   │   │       │   ├── breadcrumb-link.svelte
    │   │   │       │   ├── breadcrumb-list.svelte
    │   │   │       │   ├── breadcrumb-page.svelte
    │   │   │       │   ├── breadcrumb-separator.svelte
    │   │   │       │   ├── breadcrumb.svelte
    │   │   │       │   └── index.ts
    │   │   │       ├── button/
    │   │   │       │   ├── button.svelte
    │   │   │       │   └── index.ts
    │   │   │       ├── button-group/
    │   │   │       │   ├── button-group-separator.svelte
    │   │   │       │   ├── button-group-text.svelte
    │   │   │       │   ├── button-group.svelte
    │   │   │       │   └── index.ts
    │   │   │       ├── calendar/
    │   │   │       │   ├── calendar-caption.svelte
    │   │   │       │   ├── calendar-cell.svelte
    │   │   │       │   ├── calendar-day.svelte
    │   │   │       │   ├── calendar-grid-body.svelte
    │   │   │       │   ├── calendar-grid-head.svelte
    │   │   │       │   ├── calendar-grid-row.svelte
    │   │   │       │   ├── calendar-grid.svelte
    │   │   │       │   ├── calendar-head-cell.svelte
    │   │   │       │   ├── calendar-header.svelte
    │   │   │       │   ├── calendar-heading.svelte
    │   │   │       │   ├── calendar-month-select.svelte
    │   │   │       │   ├── calendar-month.svelte
    │   │   │       │   ├── calendar-months.svelte
    │   │   │       │   ├── calendar-nav.svelte
    │   │   │       │   ├── calendar-next-button.svelte
    │   │   │       │   ├── calendar-prev-button.svelte
    │   │   │       │   ├── calendar-year-select.svelte
    │   │   │       │   ├── calendar.svelte
    │   │   │       │   └── index.ts
    │   │   │       ├── card/
    │   │   │       │   ├── card-action.svelte
    │   │   │       │   ├── card-content.svelte
    │   │   │       │   ├── card-description.svelte
    │   │   │       │   ├── card-footer.svelte
    │   │   │       │   ├── card-header.svelte
    │   │   │       │   ├── card-title.svelte
    │   │   │       │   ├── card.svelte
    │   │   │       │   └── index.ts
    │   │   │       ├── carousel/
    │   │   │       │   ├── carousel-content.svelte
    │   │   │       │   ├── carousel-item.svelte
    │   │   │       │   ├── carousel-next.svelte
    │   │   │       │   ├── carousel-previous.svelte
    │   │   │       │   ├── carousel.svelte
    │   │   │       │   ├── context.ts
    │   │   │       │   └── index.ts
    │   │   │       ├── chart/
    │   │   │       │   ├── chart-container.svelte
    │   │   │       │   ├── chart-style.svelte
    │   │   │       │   ├── chart-tooltip.svelte
    │   │   │       │   ├── chart-utils.ts
    │   │   │       │   └── index.ts
    │   │   │       ├── checkbox/
    │   │   │       │   ├── checkbox.svelte
    │   │   │       │   └── index.ts
    │   │   │       ├── collapsible/
    │   │   │       │   ├── collapsible-content.svelte
    │   │   │       │   ├── collapsible-trigger.svelte
    │   │   │       │   ├── collapsible.svelte
    │   │   │       │   └── index.ts
    │   │   │       ├── command/
    │   │   │       │   ├── command-dialog.svelte
    │   │   │       │   ├── command-empty.svelte
    │   │   │       │   ├── command-group.svelte
    │   │   │       │   ├── command-input.svelte
    │   │   │       │   ├── command-item.svelte
    │   │   │       │   ├── command-link-item.svelte
    │   │   │       │   ├── command-list.svelte
    │   │   │       │   ├── command-loading.svelte
    │   │   │       │   ├── command-separator.svelte
    │   │   │       │   ├── command-shortcut.svelte
    │   │   │       │   ├── command.svelte
    │   │   │       │   └── index.ts
    │   │   │       ├── context-menu/
    │   │   │       │   ├── context-menu-checkbox-item.svelte
    │   │   │       │   ├── context-menu-content.svelte
    │   │   │       │   ├── context-menu-group-heading.svelte
    │   │   │       │   ├── context-menu-group.svelte
    │   │   │       │   ├── context-menu-item.svelte
    │   │   │       │   ├── context-menu-label.svelte
    │   │   │       │   ├── context-menu-portal.svelte
    │   │   │       │   ├── context-menu-radio-group.svelte
    │   │   │       │   ├── context-menu-radio-item.svelte
    │   │   │       │   ├── context-menu-separator.svelte
    │   │   │       │   ├── context-menu-shortcut.svelte
    │   │   │       │   ├── context-menu-sub-content.svelte
    │   │   │       │   ├── context-menu-sub-trigger.svelte
    │   │   │       │   ├── context-menu-sub.svelte
    │   │   │       │   ├── context-menu-trigger.svelte
    │   │   │       │   ├── context-menu.svelte
    │   │   │       │   └── index.ts
    │   │   │       ├── data-table/
    │   │   │       │   ├── data-table.svelte.ts
    │   │   │       │   ├── flex-render.svelte
    │   │   │       │   ├── index.ts
    │   │   │       │   └── render-helpers.ts
    │   │   │       ├── dialog/
    │   │   │       │   ├── dialog-close.svelte
    │   │   │       │   ├── dialog-content.svelte
    │   │   │       │   ├── dialog-description.svelte
    │   │   │       │   ├── dialog-footer.svelte
    │   │   │       │   ├── dialog-header.svelte
    │   │   │       │   ├── dialog-overlay.svelte
    │   │   │       │   ├── dialog-portal.svelte
    │   │   │       │   ├── dialog-title.svelte
    │   │   │       │   ├── dialog-trigger.svelte
    │   │   │       │   ├── dialog.svelte
    │   │   │       │   └── index.ts
    │   │   │       ├── drawer/
    │   │   │       │   ├── drawer-close.svelte
    │   │   │       │   ├── drawer-content.svelte
    │   │   │       │   ├── drawer-description.svelte
    │   │   │       │   ├── drawer-footer.svelte
    │   │   │       │   ├── drawer-header.svelte
    │   │   │       │   ├── drawer-nested.svelte
    │   │   │       │   ├── drawer-overlay.svelte
    │   │   │       │   ├── drawer-portal.svelte
    │   │   │       │   ├── drawer-title.svelte
    │   │   │       │   ├── drawer-trigger.svelte
    │   │   │       │   ├── drawer.svelte
    │   │   │       │   └── index.ts
    │   │   │       ├── dropdown-menu/
    │   │   │       │   ├── dropdown-menu-checkbox-group.svelte
    │   │   │       │   ├── dropdown-menu-checkbox-item.svelte
    │   │   │       │   ├── dropdown-menu-content.svelte
    │   │   │       │   ├── dropdown-menu-group-heading.svelte
    │   │   │       │   ├── dropdown-menu-group.svelte
    │   │   │       │   ├── dropdown-menu-item.svelte
    │   │   │       │   ├── dropdown-menu-label.svelte
    │   │   │       │   ├── dropdown-menu-portal.svelte
    │   │   │       │   ├── dropdown-menu-radio-group.svelte
    │   │   │       │   ├── dropdown-menu-radio-item.svelte
    │   │   │       │   ├── dropdown-menu-separator.svelte
    │   │   │       │   ├── dropdown-menu-shortcut.svelte
    │   │   │       │   ├── dropdown-menu-sub-content.svelte
    │   │   │       │   ├── dropdown-menu-sub-trigger.svelte
    │   │   │       │   ├── dropdown-menu-sub.svelte
    │   │   │       │   ├── dropdown-menu-trigger.svelte
    │   │   │       │   ├── dropdown-menu.svelte
    │   │   │       │   └── index.ts
    │   │   │       ├── empty/
    │   │   │       │   ├── empty-content.svelte
    │   │   │       │   ├── empty-description.svelte
    │   │   │       │   ├── empty-header.svelte
    │   │   │       │   ├── empty-media.svelte
    │   │   │       │   ├── empty-title.svelte
    │   │   │       │   ├── empty.svelte
    │   │   │       │   └── index.ts
    │   │   │       ├── field/
    │   │   │       │   ├── field-content.svelte
    │   │   │       │   ├── field-description.svelte
    │   │   │       │   ├── field-error.svelte
    │   │   │       │   ├── field-group.svelte
    │   │   │       │   ├── field-label.svelte
    │   │   │       │   ├── field-legend.svelte
    │   │   │       │   ├── field-separator.svelte
    │   │   │       │   ├── field-set.svelte
    │   │   │       │   ├── field-title.svelte
    │   │   │       │   ├── field.svelte
    │   │   │       │   └── index.ts
    │   │   │       ├── form/
    │   │   │       │   ├── form-button.svelte
    │   │   │       │   ├── form-description.svelte
    │   │   │       │   ├── form-element-field.svelte
    │   │   │       │   ├── form-field-errors.svelte
    │   │   │       │   ├── form-field.svelte
    │   │   │       │   ├── form-fieldset.svelte
    │   │   │       │   ├── form-label.svelte
    │   │   │       │   ├── form-legend.svelte
    │   │   │       │   └── index.ts
    │   │   │       ├── hover-card/
    │   │   │       │   ├── hover-card-content.svelte
    │   │   │       │   ├── hover-card-portal.svelte
    │   │   │       │   ├── hover-card-trigger.svelte
    │   │   │       │   ├── hover-card.svelte
    │   │   │       │   └── index.ts
    │   │   │       ├── input/
    │   │   │       │   ├── index.ts
    │   │   │       │   └── input.svelte
    │   │   │       ├── input-group/
    │   │   │       │   ├── index.ts
    │   │   │       │   ├── input-group-addon.svelte
    │   │   │       │   ├── input-group-button.svelte
    │   │   │       │   ├── input-group-input.svelte
    │   │   │       │   ├── input-group-text.svelte
    │   │   │       │   ├── input-group-textarea.svelte
    │   │   │       │   └── input-group.svelte
    │   │   │       ├── input-otp/
    │   │   │       │   ├── index.ts
    │   │   │       │   ├── input-otp-group.svelte
    │   │   │       │   ├── input-otp-separator.svelte
    │   │   │       │   ├── input-otp-slot.svelte
    │   │   │       │   └── input-otp.svelte
    │   │   │       ├── item/
    │   │   │       │   ├── index.ts
    │   │   │       │   ├── item-actions.svelte
    │   │   │       │   ├── item-content.svelte
    │   │   │       │   ├── item-description.svelte
    │   │   │       │   ├── item-footer.svelte
    │   │   │       │   ├── item-group.svelte
    │   │   │       │   ├── item-header.svelte
    │   │   │       │   ├── item-media.svelte
    │   │   │       │   ├── item-separator.svelte
    │   │   │       │   ├── item-title.svelte
    │   │   │       │   └── item.svelte
    │   │   │       ├── kbd/
    │   │   │       │   ├── index.ts
    │   │   │       │   ├── kbd-group.svelte
    │   │   │       │   └── kbd.svelte
    │   │   │       ├── label/
    │   │   │       │   ├── index.ts
    │   │   │       │   └── label.svelte
    │   │   │       ├── menubar/
    │   │   │       │   ├── index.ts
    │   │   │       │   ├── menubar-checkbox-item.svelte
    │   │   │       │   ├── menubar-content.svelte
    │   │   │       │   ├── menubar-group-heading.svelte
    │   │   │       │   ├── menubar-group.svelte
    │   │   │       │   ├── menubar-item.svelte
    │   │   │       │   ├── menubar-label.svelte
    │   │   │       │   ├── menubar-menu.svelte
    │   │   │       │   ├── menubar-portal.svelte
    │   │   │       │   ├── menubar-radio-group.svelte
    │   │   │       │   ├── menubar-radio-item.svelte
    │   │   │       │   ├── menubar-separator.svelte
    │   │   │       │   ├── menubar-shortcut.svelte
    │   │   │       │   ├── menubar-sub-content.svelte
    │   │   │       │   ├── menubar-sub-trigger.svelte
    │   │   │       │   ├── menubar-sub.svelte
    │   │   │       │   ├── menubar-trigger.svelte
    │   │   │       │   └── menubar.svelte
    │   │   │       ├── native-select/
    │   │   │       │   ├── index.ts
    │   │   │       │   ├── native-select-opt-group.svelte
    │   │   │       │   ├── native-select-option.svelte
    │   │   │       │   └── native-select.svelte
    │   │   │       ├── navigation-menu/
    │   │   │       │   ├── index.ts
    │   │   │       │   ├── navigation-menu-content.svelte
    │   │   │       │   ├── navigation-menu-indicator.svelte
    │   │   │       │   ├── navigation-menu-item.svelte
    │   │   │       │   ├── navigation-menu-link.svelte
    │   │   │       │   ├── navigation-menu-list.svelte
    │   │   │       │   ├── navigation-menu-trigger.svelte
    │   │   │       │   ├── navigation-menu-viewport.svelte
    │   │   │       │   └── navigation-menu.svelte
    │   │   │       ├── pagination/
    │   │   │       │   ├── index.ts
    │   │   │       │   ├── pagination-content.svelte
    │   │   │       │   ├── pagination-ellipsis.svelte
    │   │   │       │   ├── pagination-item.svelte
    │   │   │       │   ├── pagination-link.svelte
    │   │   │       │   ├── pagination-next-button.svelte
    │   │   │       │   ├── pagination-next.svelte
    │   │   │       │   ├── pagination-prev-button.svelte
    │   │   │       │   ├── pagination-previous.svelte
    │   │   │       │   └── pagination.svelte
    │   │   │       ├── popover/
    │   │   │       │   ├── index.ts
    │   │   │       │   ├── popover-close.svelte
    │   │   │       │   ├── popover-content.svelte
    │   │   │       │   ├── popover-description.svelte
    │   │   │       │   ├── popover-header.svelte
    │   │   │       │   ├── popover-portal.svelte
    │   │   │       │   ├── popover-title.svelte
    │   │   │       │   ├── popover-trigger.svelte
    │   │   │       │   └── popover.svelte
    │   │   │       ├── progress/
    │   │   │       │   ├── index.ts
    │   │   │       │   └── progress.svelte
    │   │   │       ├── radio-group/
    │   │   │       │   ├── index.ts
    │   │   │       │   ├── radio-group-item.svelte
    │   │   │       │   └── radio-group.svelte
    │   │   │       ├── range-calendar/
    │   │   │       │   ├── index.ts
    │   │   │       │   ├── range-calendar-caption.svelte
    │   │   │       │   ├── range-calendar-cell.svelte
    │   │   │       │   ├── range-calendar-day.svelte
    │   │   │       │   ├── range-calendar-grid-body.svelte
    │   │   │       │   ├── range-calendar-grid-head.svelte
    │   │   │       │   ├── range-calendar-grid-row.svelte
    │   │   │       │   ├── range-calendar-grid.svelte
    │   │   │       │   ├── range-calendar-head-cell.svelte
    │   │   │       │   ├── range-calendar-header.svelte
    │   │   │       │   ├── range-calendar-heading.svelte
    │   │   │       │   ├── range-calendar-month-select.svelte
    │   │   │       │   ├── range-calendar-month.svelte
    │   │   │       │   ├── range-calendar-months.svelte
    │   │   │       │   ├── range-calendar-nav.svelte
    │   │   │       │   ├── range-calendar-next-button.svelte
    │   │   │       │   ├── range-calendar-prev-button.svelte
    │   │   │       │   ├── range-calendar-year-select.svelte
    │   │   │       │   └── range-calendar.svelte
    │   │   │       ├── resizable/
    │   │   │       │   ├── index.ts
    │   │   │       │   ├── resizable-handle.svelte
    │   │   │       │   └── resizable-pane-group.svelte
    │   │   │       ├── scroll-area/
    │   │   │       │   ├── index.ts
    │   │   │       │   ├── scroll-area-scrollbar.svelte
    │   │   │       │   └── scroll-area.svelte
    │   │   │       ├── select/
    │   │   │       │   ├── index.ts
    │   │   │       │   ├── select-content.svelte
    │   │   │       │   ├── select-group-heading.svelte
    │   │   │       │   ├── select-group.svelte
    │   │   │       │   ├── select-item.svelte
    │   │   │       │   ├── select-label.svelte
    │   │   │       │   ├── select-portal.svelte
    │   │   │       │   ├── select-scroll-down-button.svelte
    │   │   │       │   ├── select-scroll-up-button.svelte
    │   │   │       │   ├── select-separator.svelte
    │   │   │       │   ├── select-trigger.svelte
    │   │   │       │   └── select.svelte
    │   │   │       ├── separator/
    │   │   │       │   ├── index.ts
    │   │   │       │   └── separator.svelte
    │   │   │       ├── sheet/
    │   │   │       │   ├── index.ts
    │   │   │       │   ├── sheet-close.svelte
    │   │   │       │   ├── sheet-content.svelte
    │   │   │       │   ├── sheet-description.svelte
    │   │   │       │   ├── sheet-footer.svelte
    │   │   │       │   ├── sheet-header.svelte
    │   │   │       │   ├── sheet-overlay.svelte
    │   │   │       │   ├── sheet-portal.svelte
    │   │   │       │   ├── sheet-title.svelte
    │   │   │       │   ├── sheet-trigger.svelte
    │   │   │       │   └── sheet.svelte
    │   │   │       ├── sidebar/
    │   │   │       │   ├── constants.ts
    │   │   │       │   ├── context.svelte.ts
    │   │   │       │   ├── index.ts
    │   │   │       │   ├── sidebar-content.svelte
    │   │   │       │   ├── sidebar-footer.svelte
    │   │   │       │   ├── sidebar-group-action.svelte
    │   │   │       │   ├── sidebar-group-content.svelte
    │   │   │       │   ├── sidebar-group-label.svelte
    │   │   │       │   ├── sidebar-group.svelte
    │   │   │       │   ├── sidebar-header.svelte
    │   │   │       │   ├── sidebar-input.svelte
    │   │   │       │   ├── sidebar-inset.svelte
    │   │   │       │   ├── sidebar-menu-action.svelte
    │   │   │       │   ├── sidebar-menu-badge.svelte
    │   │   │       │   ├── sidebar-menu-button.svelte
    │   │   │       │   ├── sidebar-menu-item.svelte
    │   │   │       │   ├── sidebar-menu-skeleton.svelte
    │   │   │       │   ├── sidebar-menu-sub-button.svelte
    │   │   │       │   ├── sidebar-menu-sub-item.svelte
    │   │   │       │   ├── sidebar-menu-sub.svelte
    │   │   │       │   ├── sidebar-menu.svelte
    │   │   │       │   ├── sidebar-provider.svelte
    │   │   │       │   ├── sidebar-rail.svelte
    │   │   │       │   ├── sidebar-separator.svelte
    │   │   │       │   ├── sidebar-trigger.svelte
    │   │   │       │   └── sidebar.svelte
    │   │   │       ├── skeleton/
    │   │   │       │   ├── index.ts
    │   │   │       │   └── skeleton.svelte
    │   │   │       ├── sonner/
    │   │   │       │   ├── index.ts
    │   │   │       │   └── sonner.svelte
    │   │   │       ├── spinner/
    │   │   │       │   ├── index.ts
    │   │   │       │   └── spinner.svelte
    │   │   │       ├── switch/
    │   │   │       │   ├── index.ts
    │   │   │       │   └── switch.svelte
    │   │   │       ├── table/
    │   │   │       │   ├── index.ts
    │   │   │       │   ├── table-body.svelte
    │   │   │       │   ├── table-caption.svelte
    │   │   │       │   ├── table-cell.svelte
    │   │   │       │   ├── table-footer.svelte
    │   │   │       │   ├── table-head.svelte
    │   │   │       │   ├── table-header.svelte
    │   │   │       │   ├── table-row.svelte
    │   │   │       │   └── table.svelte
    │   │   │       ├── tabs/
    │   │   │       │   ├── index.ts
    │   │   │       │   ├── tabs-content.svelte
    │   │   │       │   ├── tabs-list.svelte
    │   │   │       │   ├── tabs-trigger.svelte
    │   │   │       │   └── tabs.svelte
    │   │   │       ├── textarea/
    │   │   │       │   ├── index.ts
    │   │   │       │   └── textarea.svelte
    │   │   │       ├── toggle/
    │   │   │       │   ├── index.ts
    │   │   │       │   └── toggle.svelte
    │   │   │       ├── toggle-group/
    │   │   │       │   ├── index.ts
    │   │   │       │   ├── toggle-group-item.svelte
    │   │   │       │   └── toggle-group.svelte
    │   │   │       └── tooltip/
    │   │   │           ├── index.ts
    │   │   │           ├── tooltip-content.svelte
    │   │   │           ├── tooltip-portal.svelte
    │   │   │           ├── tooltip-provider.svelte
    │   │   │           ├── tooltip-trigger.svelte
    │   │   │           └── tooltip.svelte
    │   │   ├── hooks/
    │   │   │   └── is-mobile.svelte.ts
    │   │   ├── state/
    │   │   │   ├── booking.svelte.ts
    │   │   │   └── cinema.svelte.ts
    │   │   └── utils/
    │   │       ├── cfd.ts
    │   │       └── timezone.ts
    │   └── routes/
    │       ├── +layout.svelte
    │       ├── +page.server.ts
    │       ├── +page.svelte
    │       ├── layout.css
    │       ├── api/
    │       │   └── poster/
    │       │       └── [id]/
    │       │           └── +server.ts
    │       ├── booking/
    │       │   └── [id]/
    │       │       └── +page.svelte
    │       ├── checkout/
    │       │   └── [id]/
    │       │       └── +page.svelte
    │       └── concessions/
    │           └── [id]/
    │               └── +page.svelte
    ├── static/
    │   └── robots.txt
    └── .agent/
        ├── 01-architecture-overview.md
        ├── 02-api-contracts.md
        ├── 03-orchestration-rules.md
        ├── 04-ui-design-rules.md
        ├── 05-shadcn-bits-ui.md
        ├── 06-component-architecture.md
        ├── 07-pos-sync-orchestration.md
        ├── scrollytelling_ideas.md
        └── stitch-blueprint.md
