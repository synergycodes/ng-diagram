import type { InputModifiers } from '../input-events';
import type { EnvironmentInfo } from '../types/environment.interface';

export class BrowserEnvironment implements EnvironmentInfo {
  os: EnvironmentInfo['os'] | null;
  browser: EnvironmentInfo['browser'] | null;
  isSSR?: boolean;
  runtime: EnvironmentInfo['runtime'] = 'web';
  eventHelpers: EnvironmentInfo['eventHelpers'];

  constructor() {
    this.isSSR = !this.checkIfClient();
    this.os = this.detectOS();
    this.browser = this.detectBrowser();
    this.runtime = this.isSSR ? 'node' : 'web';
    this.eventHelpers = {
      getModifiers: this.getModifiers.bind(this),
      withPrimaryModifier: this.withPrimaryModifier.bind(this),
      withSecondaryModifier: this.withSecondaryModifier.bind(this),
      withShiftModifier: this.withShiftModifier.bind(this),
      withMetaModifier: this.withMetaModifier.bind(this),
      withoutModifiers: this.withoutModifiers.bind(this),
      withPrimaryButton: this.withPrimaryButton.bind(this),
      isArrowKeyPressed: this.isArrowKeyPressed.bind(this),
      isDeleteKeyPressed: this.isDeleteKeyPressed.bind(this),
      isKeyPressed: this.isKeyPressed.bind(this),
      isKeyComboPressed: this.isKeyComboPressed.bind(this),
    };
  }

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

  private detectOS(): EnvironmentInfo['os'] {
    if (!this.checkIfClient()) return null;

    const ua = window.navigator.userAgent;
    if (/iPhone|iPad|iPod/.test(ua)) return 'iOS';
    if (/Mac/.test(ua)) return 'MacOS';
    if (/Win/.test(ua)) return 'Windows';
    if (/Android/.test(ua)) return 'Android';
    if (/Linux/.test(ua)) return 'Linux';
    return 'Other';
  }

  private detectBrowser(): EnvironmentInfo['browser'] {
    if (!this.checkIfClient()) return null;

    const ua = window.navigator.userAgent;

    if (/OPR/.test(ua)) return 'Opera';
    if (/Edge|Edg/.test(ua)) return 'Edge';
    if (/Chrome/.test(ua)) return 'Chrome';
    if (/Firefox/.test(ua)) return 'Firefox';
    if (/Safari/.test(ua)) return 'Safari';
    if (/Trident/.test(ua)) return 'IE';

    return 'Unknown';
  }

  private checkIfClient(): boolean {
    const isClient = typeof window !== 'undefined' && typeof document !== 'undefined';
    this.isSSR = !isClient;

    return isClient;
  }

  private getPrimaryModifierKey() {
    if (!this.checkIfClient()) return 'ctrlKey';

    return this.os === 'MacOS' ? 'metaKey' : 'ctrlKey';
  }

  // Utilities
  public now(): number {
    return this.isSSR ? Date.now() : performance.now();
  }

  public generateId(): string {
    const hasCrypto = this.checkIfClient() && typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function';
    return hasCrypto ? crypto.randomUUID() : `${Date.now()}-${Math.random().toString(36).substring(2, 15)}`;
  }

  // Input helpers (bound via this.inputs)
  private isClient(): boolean {
    return typeof window !== 'undefined' && typeof document !== 'undefined';
  }

  private isPointerEvent(event: unknown): event is PointerEvent {
    return this.isClient() && event instanceof PointerEvent;
  }

  private isKeyboardEvent(event: unknown): event is KeyboardEvent {
    return this.isClient() && event instanceof KeyboardEvent;
  }

  private isWheelEvent(event: unknown): event is WheelEvent {
    return this.isClient() && event instanceof WheelEvent;
  }

  private isDomEvent(event: unknown): event is KeyboardEvent | WheelEvent | PointerEvent | DragEvent | TouchEvent {
    return this.isPointerEvent(event) || this.isKeyboardEvent(event) || this.isWheelEvent(event);
  }

  private getModifiers(event: unknown): InputModifiers {
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

  private withPrimaryModifier(event: unknown): boolean {
    return this.getModifiers(event).primary;
  }

  private withSecondaryModifier(event: unknown): boolean {
    return this.getModifiers(event).secondary;
  }

  private withShiftModifier(event: unknown): boolean {
    return this.getModifiers(event).shift;
  }

  private withMetaModifier(event: unknown): boolean {
    return this.getModifiers(event).meta;
  }

  private withoutModifiers(event: unknown): boolean {
    const modifiers = this.getModifiers(event);

    return Object.values(modifiers).every((modifier) => modifier === false);
  }

  private withPrimaryButton(event: unknown): boolean {
    return this.isPointerEvent(event) && (event.button === undefined || event.button === 0);
  }

  private isArrowKeyPressed(event: unknown): boolean {
    return this.isKeyboardEvent(event) && Object.values(this.keysMap.arrows).includes(event.key);
  }

  private isKeyPressed(key: string) {
    return (event: unknown) => this.isKeyboardEvent(event) && event.key === key;
  }

  private isKeyComboPressed(key: string, ...mods: (keyof InputModifiers)[]) {
    return (event: unknown) => {
      if (!this.isKeyboardEvent(event)) return false;

      const modifiersPressed = this.getModifiers(event);
      const requiredModsPressed = mods.every((mod) => modifiersPressed[mod]);

      if (!requiredModsPressed) return false;

      return this.isKeyPressed(key)(event);
    };
  }

  private isDeleteKeyPressed(event: unknown): boolean {
    if (!this.isKeyboardEvent(event)) return false;

    const target = event.target as HTMLElement | null;

    const isEditableTarget = (el: HTMLElement | null) =>
      !!el && (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA' || el.isContentEditable);

    if (!isEditableTarget(target)) return false;

    return event.key === this.keysMap.keys.delete || event.key === this.keysMap.keys.backspace;
  }
}
