import { Injectable, inject } from '@angular/core';
import { InputEventsRouter, type InputModifiers } from '../../../core/src';
import { EnvironmentProviderService } from '../environment-provider/environment-provider.service';

type DomEvent = KeyboardEvent | WheelEvent | PointerEvent | DragEvent | TouchEvent;

@Injectable()
export class InputEventsRouterService extends InputEventsRouter {
  private readonly environment = inject(EnvironmentProviderService);

  getBaseEvent(event: DomEvent) {
    return {
      modifiers: this.getModifiers(event),
      id: this.environment.generateId(),
      timestamp: this.environment.now(),
    };
  }

  readonly eventHelpers = {
    getPrimaryModifierKey: this.getPrimaryModifierKey.bind(this),
    isPointerEvent: this.isPointerEvent.bind(this),
    isKeyboardEvent: this.isKeyboardEvent.bind(this),
    isWheelEvent: this.isWheelEvent.bind(this),
    isDomEvent: this.isDomEvent.bind(this),
    getModifiers: this.getModifiers.bind(this),
    withPrimaryModifier: this.withPrimaryModifier.bind(this),
    withSecondaryModifier: this.withSecondaryModifier.bind(this),
    withShiftModifier: this.withShiftModifier.bind(this),
    withMetaModifier: this.withMetaModifier.bind(this),
    withoutModifiers: this.withoutModifiers.bind(this),
    withPrimaryButton: this.withPrimaryButton.bind(this),
    isArrowKeyPressed: this.isArrowKeyPressed.bind(this),
    isKeyPressed: this.isKeyPressed.bind(this),
    isKeyComboPressed: this.isKeyComboPressed.bind(this),
    isDeleteKeyPressed: this.isDeleteKeyPressed.bind(this),
  };

  private keysMap = {
    arrows: {
      up: 'ArrowUp',
      down: 'ArrowDown',
      left: 'ArrowLeft',
      right: 'ArrowRight',
    },
    keys: {
      delete: 'Delete',
      backspace: 'Backspace',
    },
  };

  // Utilities
  private getPrimaryModifierKey() {
    if (!this.environment.isClient) return 'ctrlKey';

    return this.environment.os === 'MacOS' ? 'metaKey' : 'ctrlKey';
  }

  private isPointerEvent(event: Event): event is PointerEvent {
    return this.environment.isClient && event instanceof PointerEvent;
  }

  private isKeyboardEvent(event: Event): event is KeyboardEvent {
    return this.environment.isClient && event instanceof KeyboardEvent;
  }

  private isWheelEvent(event: Event): event is WheelEvent {
    return this.environment.isClient && event instanceof WheelEvent;
  }

  private isDomEvent(event: Event): event is KeyboardEvent | WheelEvent | PointerEvent | DragEvent | TouchEvent {
    return this.isPointerEvent(event) || this.isKeyboardEvent(event) || this.isWheelEvent(event);
  }

  private getModifiers(event: Event): InputModifiers {
    if (!this.isDomEvent(event))
      return {
        primary: false,
        secondary: false,
        shift: false,
        meta: false,
      };

    return {
      primary: event[this.getPrimaryModifierKey()],
      secondary: event.altKey,
      shift: event.shiftKey,
      meta: event.metaKey,
    };
  }

  private withPrimaryModifier(event: Event): boolean {
    return this.getModifiers(event).primary;
  }

  private withSecondaryModifier(event: Event): boolean {
    return this.getModifiers(event).secondary;
  }

  private withShiftModifier(event: Event): boolean {
    return this.getModifiers(event).shift;
  }

  private withMetaModifier(event: Event): boolean {
    return this.getModifiers(event).meta;
  }

  private withoutModifiers(event: Event): boolean {
    const modifiers = this.getModifiers(event);

    return Object.values(modifiers).every((modifier) => modifier === false);
  }

  private withPrimaryButton(event: Event): boolean {
    return this.isPointerEvent(event) && (event.button === undefined || event.button === 0);
  }

  private isArrowKeyPressed(event: Event): boolean {
    return this.isKeyboardEvent(event) && Object.values(this.keysMap.arrows).includes(event.key);
  }

  private isKeyPressed(key: string) {
    return (event: Event) => this.isKeyboardEvent(event) && event.key === key;
  }

  private isKeyComboPressed(key: string, ...mods: (keyof InputModifiers)[]) {
    return (event: Event) => {
      if (!this.isKeyboardEvent(event)) return false;

      const modifiersPressed = this.getModifiers(event);
      const requiredModsPressed = mods.every((mod) => modifiersPressed[mod]);

      if (!requiredModsPressed) return false;

      return this.isKeyPressed(key)(event);
    };
  }

  private isDeleteKeyPressed(event: Event): boolean {
    if (!this.isKeyboardEvent(event)) return false;

    const target = event.target as HTMLElement | null;

    const isEditableTarget = (el: HTMLElement | null) =>
      !!el && (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA' || el.isContentEditable);

    if (!isEditableTarget(target)) return false;

    return event.key === this.keysMap.keys.delete || event.key === this.keysMap.keys.backspace;
  }
}
